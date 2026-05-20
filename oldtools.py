import os
import subprocess
import shutil
import tempfile
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
import pandas as pd
import pdfplumber

router = APIRouter(tags=["tools"])

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

        # Map levels to GS PDFSETTINGS
        settings = {
            "high": "/screen",   # 72 dpi
            "medium": "/ebook",  # 150 dpi
            "low": "/printer"    # 300 dpi
        }
        gs_setting = settings.get(compressionLevel, "/ebook")

        run_gs_command([
            "-sDEVICE=pdfwrite",
            "-dCompatibilityLevel=1.4",
            f"-dPDFSETTINGS={gs_setting}",
            f"-sOutputFile={output_path}",
            str(input_path)
        ])

        background_tasks.add_task(td.cleanup)
        return FileResponse(
            output_path, 
            filename=f"compressed-{file.filename}",
            media_type="application/pdf"
        )
    except Exception as e:
        handle_exception(td, e)

@router.post("/pdf-to-word")
async def pdf_to_word(file: UploadFile = File(...), background_tasks: BackgroundTasks = BackgroundTasks()):
    td, tmp_path = create_temp_dir()
    try:
        input_path = tmp_path / "input.pdf"
        output_path = tmp_path / "converted.docx"

        await save_upload_file(file, input_path)

        run_gs_command([
            "-sDEVICE=docxwrite",
            f"-sOutputFile={output_path}",
            str(input_path)
        ])

        if not output_path.exists() or output_path.stat().st_size == 0:
            raise HTTPException(status_code=500, detail="Conversion resulted in an empty file")

        background_tasks.add_task(td.cleanup)
        return FileResponse(
            output_path,
            filename=file.filename.replace(".pdf", ".docx"),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
    except Exception as e:
        handle_exception(td, e)

@router.post("/pdf-to-image")
async def pdf_to_image(file: UploadFile = File(...), background_tasks: BackgroundTasks = BackgroundTasks()):
    td, tmp_path = create_temp_dir()
    try:
        input_path = tmp_path / "input.pdf"
        output_path = tmp_path / "page.png"

        await save_upload_file(file, input_path)

        run_gs_command([
            "-sDEVICE=png16m",
            "-r300",
            "-dFirstPage=1",
            "-dLastPage=1",
            f"-sOutputFile={output_path}",
            str(input_path)
        ])

        if not output_path.exists() or output_path.stat().st_size == 0:
            raise HTTPException(status_code=500, detail="Image generation failed")

        background_tasks.add_task(td.cleanup)
        return FileResponse(
            output_path,
            filename=file.filename.replace(".pdf", ".png"),
            media_type="image/png"
        )
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
        return FileResponse(
            output_path,
            filename=file.filename.replace(".pdf", ".xlsx"),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    except Exception as e:
        handle_exception(td, e)

@router.post("/protect-pdf")
async def protect_pdf(
    file: UploadFile = File(...),
    password: str = Form(...),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    td, tmp_path = create_temp_dir()
    try:
        input_path = tmp_path / "input.pdf"
        output_path = tmp_path / "protected.pdf"
        
        await save_upload_file(file, input_path)

        run_gs_command([
            "-sDEVICE=pdfwrite",
            "-dEncryptionR=3",
            f"-sUserPassword={password}",
            f"-sOwnerPassword={password}",
            "-dPDFSETTINGS=/prepress",
            f"-sOutputFile={output_path}",
            str(input_path)
        ])

        background_tasks.add_task(td.cleanup)
        return FileResponse(
            output_path,
            filename=f"protected-{file.filename}",
            media_type="application/pdf"
        )
    except Exception as e:
        handle_exception(td, e)

@router.post("/unlock-pdf")
async def unlock_pdf(
    file: UploadFile = File(...),
    password: str = Form(...),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    td, tmp_path = create_temp_dir()
    try:
        input_path = tmp_path / "input.pdf"
        output_path = tmp_path / "unlocked.pdf"
        
        await save_upload_file(file, input_path)

        run_gs_command([
            "-sDEVICE=pdfwrite",
            f"-sPDFPassword={password}",
            f"-sOutputFile={output_path}",
            str(input_path)
        ])

        background_tasks.add_task(td.cleanup)
        return FileResponse(
            output_path,
            filename=f"unlocked-{file.filename}",
            media_type="application/pdf"
        )
    except Exception as e:
        handle_exception(td, e)

@router.post("/extract-text")
async def extract_text(file: UploadFile = File(...), background_tasks: BackgroundTasks = BackgroundTasks()):
    td, tmp_path = create_temp_dir()
    try:
        input_path = tmp_path / "input.pdf"
        output_path = tmp_path / "extracted.txt"

        await save_upload_file(file, input_path)

        run_gs_command([
            "-sDEVICE=txtwrite",
            f"-sOutputFile={output_path}",
            str(input_path)
        ])

        background_tasks.add_task(td.cleanup)
        return FileResponse(
            output_path,
            filename=file.filename.replace(".pdf", ".txt"),
            media_type="text/plain"
        )
    except Exception as e:
        handle_exception(td, e)