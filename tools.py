import os
import subprocess
import shutil
import tempfile
import threading
import hashlib
from pathlib import Path
import torch
from fastapi import APIRouter, Form, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import FileResponse
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, AutoModelForQuestionAnswering
import pandas as pd
import pdfplumber
import redis

router = APIRouter(tags=["Tools"])

# ─── Ghostscript Helpers ──────────────────────────────────────────────────────

def get_gs_executable():
    """Determine the Ghostscript executable name based on the platform."""
    if os.name == 'nt':  # Windows
        for cmd in ['gs', 'gswin64c', 'gswin32c']:
            try:
                subprocess.run([cmd, "--version"], capture_output=True, check=True)
                return cmd
            except (subprocess.CalledProcessError, FileNotFoundError):
                continue
    return 'gs'

GS_EXEC = get_gs_executable()

def run_gs_command(args: list):
    """Helper to execute Ghostscript commands safely."""
    if not GS_EXEC:
        raise HTTPException(status_code=500, detail="Ghostscript engine not found. Please install Ghostscript.")
    command = [GS_EXEC, "-dNOPAUSE", "-dBATCH", "-dQUIET"] + args
    try:
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        return result
    except subprocess.CalledProcessError as e:
        print(f"Ghostscript Error: {e.stderr}")
        raise HTTPException(status_code=500, detail=f"Engine error: {e.stderr}")

# ─── Utility Functions ────────────────────────────────────────────────────────

async def save_upload_file(upload_file: UploadFile, destination: Path):
    try:
        with destination.open("wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
    finally:
        upload_file.file.close()

def create_temp_dir():
    td = tempfile.TemporaryDirectory()
    return td, Path(td.name)

def handle_exception(td: tempfile.TemporaryDirectory, e: Exception):
    td.cleanup()
    if isinstance(e, HTTPException):
        raise e
    raise HTTPException(status_code=500, detail=str(e))

# Local directory to store models within the container
MODEL_CACHE = "/app/model_cache"
os.makedirs(MODEL_CACHE, exist_ok=True)

# Redis Setup
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
try:
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
except Exception as e:
    print(f"Redis not available: {e}")
    redis_client = None

# Global dictionary to store loaded models in memory
_pipelines = {}
_load_lock = threading.Lock()

def get_model_pkg(cache_key: str, model_class, model_name: str):
    """Lazy-loads and caches model and tokenizer to bypass broken pipeline registries."""
    if cache_key not in _pipelines:
        with _load_lock:
            if cache_key not in _pipelines:
                try:
                    tokenizer = AutoTokenizer.from_pretrained(model_name, cache_dir=MODEL_CACHE)
                    model = model_class.from_pretrained(model_name, cache_dir=MODEL_CACHE)
                    
                    # Move to GPU if available, else CPU
                    device = "cuda" if torch.cuda.is_available() else "cpu"
                    model.to(device)
                    
                    _pipelines[cache_key] = (model, tokenizer, device)
                except Exception as e:
                    raise HTTPException(status_code=500, detail=f"Model error: {str(e)}")
    return _pipelines[cache_key]

@router.post("/ai/summarize")
def ai_summarize(text: str = Form(...)):
    """Note: Changed to 'def' to run in threadpool and avoid blocking event loop."""
    # 1. Check Redis Cache
    if redis_client:
        cache_key = f"sum:{hashlib.md5(text.encode()).hexdigest()}"
        cached = redis_client.get(cache_key)
        if cached:
            return {"result": cached, "cached": True}

    model, tokenizer, device = get_model_pkg("sum", AutoModelForSeq2SeqLM, "sshleifer/distilbart-cnn-6-6")
    
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=1024).to(device)
    with torch.no_grad():
        summary_ids = model.generate(inputs["input_ids"], max_length=150, min_length=40, do_sample=False)
    
    summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)

    # 2. Store in Cache (Expires in 24 hours)
    if redis_client:
        redis_client.setex(cache_key, 86400, summary)

    return {"result": summary, "cached": False}

@router.post("/ai/qa")
def ai_qa(question: str = Form(...), context: str = Form(...)):
    """Note: Changed to 'def' to run in threadpool."""
    # 1. Check Redis Cache
    if redis_client:
        cache_key = f"qa:{hashlib.md5((question + context).encode()).hexdigest()}"
        cached = redis_client.get(cache_key)
        if cached:
            return {"result": cached, "cached": True}

    model, tokenizer, device = get_model_pkg("qa", AutoModelForQuestionAnswering, "distilbert-base-uncased-distilled-squad")
    
    inputs = tokenizer(question, context, return_tensors="pt", truncation=True, max_length=512).to(device)
    with torch.no_grad():
        outputs = model(**inputs)
    
    # Find the tokens with the highest `start` and `end` scores
    answer_start = torch.argmax(outputs.start_logits)
    answer_end = torch.argmax(outputs.end_logits) + 1
    
    answer = tokenizer.convert_tokens_to_string(tokenizer.convert_ids_to_tokens(inputs["input_ids"][0][answer_start:answer_end]))

    # 2. Store in Cache
    if redis_client:
        redis_client.setex(cache_key, 86400, answer)

    return {"result": answer, "cached": False}

# ─── PDF / Office Tools ───────────────────────────────────────────────────────

@router.post("/compress-pdf")
async def compress_pdf(
    file: UploadFile = File(...),
    compressionLevel: str = Form("medium"),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    td, tmp_path = create_temp_dir()
    try:
        input_path = tmp_path / "input.pdf"
        output_path = tmp_path / "compressed.pdf"
        await save_upload_file(file, input_path)
        settings = {"high": "/screen", "medium": "/ebook", "low": "/printer"}
        gs_setting = settings.get(compressionLevel, "/ebook")
        run_gs_command(["-sDEVICE=pdfwrite", "-dCompatibilityLevel=1.4", f"-dPDFSETTINGS={gs_setting}", f"-sOutputFile={output_path}", str(input_path)])
        background_tasks.add_task(td.cleanup)
        return FileResponse(output_path, filename=f"compressed-{file.filename}", media_type="application/pdf")
    except Exception as e:
        handle_exception(td, e)

@router.post("/pdf-to-word")
async def pdf_to_word(file: UploadFile = File(...), background_tasks: BackgroundTasks = BackgroundTasks()):
    td, tmp_path = create_temp_dir()
    try:
        input_path = tmp_path / "input.pdf"
        output_path = tmp_path / "converted.docx"
        await save_upload_file(file, input_path)
        run_gs_command(["-sDEVICE=docxwrite", f"-sOutputFile={output_path}", str(input_path)])
        if not output_path.exists() or output_path.stat().st_size == 0:
            raise HTTPException(status_code=500, detail="Conversion resulted in an empty file")
        background_tasks.add_task(td.cleanup)
        return FileResponse(output_path, filename=file.filename.replace(".pdf", ".docx"), media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    except Exception as e:
        handle_exception(td, e)

@router.post("/pdf-to-image")
async def pdf_to_image(file: UploadFile = File(...), background_tasks: BackgroundTasks = BackgroundTasks()):
    td, tmp_path = create_temp_dir()
    try:
        input_path = tmp_path / "input.pdf"
        output_path = tmp_path / "page.png"
        await save_upload_file(file, input_path)
        run_gs_command(["-sDEVICE=png16m", "-r300", "-dFirstPage=1", "-dLastPage=1", f"-sOutputFile={output_path}", str(input_path)])
        if not output_path.exists() or output_path.stat().st_size == 0:
            raise HTTPException(status_code=500, detail="Image generation failed")
        background_tasks.add_task(td.cleanup)
        return FileResponse(output_path, filename=file.filename.replace(".pdf", ".png"), media_type="image/png")
    except Exception as e:
        handle_exception(td, e)

@router.post("/pdf-to-excel")
async def pdf_to_excel(file: UploadFile = File(...), background_tasks: BackgroundTasks = BackgroundTasks()):
    td, tmp_path = create_temp_dir()
    try:
        input_path = tmp_path / "input.pdf"
        output_path = tmp_path / "extracted.xlsx"
        await save_upload_file(file, input_path)
        all_tables = []
        with pdfplumber.open(input_path) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()
                for table in tables:
                    if len(table) > 1:
                        df = pd.DataFrame(table[1:], columns=table[0])
                        all_tables.append(df)
        if not all_tables:
            raise HTTPException(status_code=400, detail="No structured tables found in the PDF.")
        with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
            full_df = pd.concat(all_tables, ignore_index=True)
            full_df.to_excel(writer, index=False, sheet_name='Extracted Data')
        background_tasks.add_task(td.cleanup)
        return FileResponse(output_path, filename=file.filename.replace(".pdf", ".xlsx"), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    except Exception as e:
        handle_exception(td, e)

@router.post("/protect-pdf")
async def protect_pdf(file: UploadFile = File(...), password: str = Form(...), background_tasks: BackgroundTasks = BackgroundTasks()):
    td, tmp_path = create_temp_dir()
    try:
        input_path = tmp_path / "input.pdf"
        output_path = tmp_path / "protected.pdf"
        await save_upload_file(file, input_path)
        run_gs_command(["-sDEVICE=pdfwrite", "-dEncryptionR=3", f"-sUserPassword={password}", f"-sOwnerPassword={password}", "-dPDFSETTINGS=/prepress", f"-sOutputFile={output_path}", str(input_path)])
        background_tasks.add_task(td.cleanup)
        return FileResponse(output_path, filename=f"protected-{file.filename}", media_type="application/pdf")
    except Exception as e:
        handle_exception(td, e)

@router.post("/unlock-pdf")
async def unlock_pdf(file: UploadFile = File(...), password: str = Form(...), background_tasks: BackgroundTasks = BackgroundTasks()):
    td, tmp_path = create_temp_dir()
    try:
        input_path = tmp_path / "input.pdf"
        output_path = tmp_path / "unlocked.pdf"
        await save_upload_file(file, input_path)
        run_gs_command(["-sDEVICE=pdfwrite", f"-sPDFPassword={password}", f"-sOutputFile={output_path}", str(input_path)])
        background_tasks.add_task(td.cleanup)
        return FileResponse(output_path, filename=f"unlocked-{file.filename}", media_type="application/pdf")
    except Exception as e:
        handle_exception(td, e)

@router.post("/extract-text")
async def extract_text(file: UploadFile = File(...), background_tasks: BackgroundTasks = BackgroundTasks()):
    td, tmp_path = create_temp_dir()
    try:
        input_path = tmp_path / "input.pdf"
        output_path = tmp_path / "extracted.txt"
        await save_upload_file(file, input_path)
        run_gs_command(["-sDEVICE=txtwrite", f"-sOutputFile={output_path}", str(input_path)])
        background_tasks.add_task(td.cleanup)
        return FileResponse(output_path, filename=file.filename.replace(".pdf", ".txt"), media_type="text/plain")
    except Exception as e:
        handle_exception(td, e)