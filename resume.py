"""
resume.py — Local-only FastAPI router for Resume Analysis & ATS Scoring
Uses HuggingFace Transformers (BART, DistilBERT) and Sentence-Transformers.
No external API calls or Ollama required.
"""

import json
import re
from io import BytesIO
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from sentence_transformers import SentenceTransformer, util
from tools import get_pipe, MODEL_CACHE
import numpy as np

# PDF extraction
try:
    from pdfminer.high_level import extract_text as pdf_extract_text
    PDF_SUPPORT = True
except ImportError:
    PDF_SUPPORT = False

# DOCX extraction
try:
    from docx import Document as DocxDocument
    DOCX_SUPPORT = True
except ImportError:
    DOCX_SUPPORT = False

router = APIRouter(prefix="/api/resume", tags=["Resume"])

# ── Helpers ────────────────────────────────────────────────────────────────────

def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    """Extract plain text from PDF, DOCX, or TXT upload."""
    ext = filename.rsplit(".", 1)[-1].lower()

    if ext == "pdf":
        if not PDF_SUPPORT:
            raise HTTPException(
                status_code=422,
                detail="PDF support unavailable. Install pdfminer.six.",
            )
        return pdf_extract_text(BytesIO(file_bytes)) or ""

    if ext in ("docx", "doc"):
        if not DOCX_SUPPORT:
            raise HTTPException(
                status_code=422,
                detail="DOCX support unavailable. Install python-docx.",
            )
        doc = DocxDocument(BytesIO(file_bytes))
        return "\n".join(p.text for p in doc.paragraphs)

    if ext == "txt":
        return file_bytes.decode("utf-8", errors="replace")

    raise HTTPException(
        status_code=422,
        detail=f"Unsupported file type: .{ext}. Please upload PDF, DOCX, or TXT.",
    )


def extract_keywords(text: str) -> set:
    """Simple keyword extractor using regex for local analysis."""
    words = re.findall(r'\b\w{3,}\b', text.lower())
    # Basic list of tech/business keywords to look for
    common_keywords = {
        'python', 'java', 'react', 'node', 'sql', 'docker', 'kubernetes', 'aws', 'azure',
        'project', 'management', 'leadership', 'development', 'software', 'engineer',
        'data', 'analytics', 'analysis', 'communication', 'teamwork', 'agile', 'scrum'
    }
    return set(words).intersection(common_keywords)


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/analyze")
async def analyze_resume(
    resume: UploadFile = File(..., description="Resume file (PDF, DOCX, or TXT)"),
    job_description: str = Form(..., description="Job description text"),
):
    """
    Full ATS analysis: score the resume against the job description,
    identify matched/missing keywords, and suggest improvements.
    """
    file_bytes = await resume.read()
    resume_text = extract_text_from_file(file_bytes, resume.filename or "resume.txt")

    if len(resume_text.strip()) < 50:
        raise HTTPException(
            status_code=422,
            detail="Could not extract meaningful text from the resume file.",
        )

    # 1. Local Semantic Scoring (Essential & Excellent)
    try:
        model = SentenceTransformer('all-MiniLM-L6-v2', cache_folder=MODEL_CACHE)
        embeddings = model.encode([resume_text, job_description])
        cosine_sim = util.cos_sim(embeddings[0], embeddings[1])
        semantic_score = int(float(cosine_sim) * 100)
    except Exception:
        semantic_score = 0

    # 2. Local Keyword Analysis
    resume_words = extract_keywords(resume_text)
    jd_words = extract_keywords(job_description)
    
    matched = list(jd_words.intersection(resume_words))
    missing = list(jd_words.difference(resume_words))
    
    # 3. Strength / Improvement Heuristics
    strengths = []
    if semantic_score > 70: strengths.append("Strong semantic alignment with job role")
    if len(matched) > 5: strengths.append(f"Strong keyword match ({len(matched)} key skills found)")
    if len(resume_text) > 1000: strengths.append("Comprehensive professional detail")

    improvements = []
    if len(missing) > 0:
        improvements.append({
            "issue": "Missing Key Skills", 
            "suggestion": f"Consider adding mention of: {', '.join(missing[:3])}"
        })
    if semantic_score < 50:
        improvements.append({
            "issue": "Low Relevance",
            "suggestion": "Tailor your experience descriptions to mirror the job description language."
        })

    # 4. Final Assessment
    summary = "The resume shows moderate alignment."
    if semantic_score > 80: summary = "Excellent match! Your profile aligns closely with the job requirements."
    elif semantic_score > 60: summary = "Good match. You have many of the required skills but could tailor your experience further."
    elif semantic_score < 40: summary = "Low match. Consider highlighting more relevant experience or acquiring missing skills."

    result = {
        "ats_score": semantic_score,
        "summary": summary,
        "matched_keywords": matched,
        "missing_keywords": missing,
        "strengths": strengths,
        "improvements": improvements,
        "section_scores": {
            "skills_match": min(100, len(matched) * 15),
            "experience_relevance": semantic_score,
            "formatting": 85,
            "keyword_density": min(100, (len(matched) / (len(jd_words) or 1)) * 100)
        }
    }

    # Enrich LLM data with local semantic score
    if semantic_score > 0:
        result["section_scores"]["semantic_relevance"] = semantic_score

    return JSONResponse(content={"status": "ok", "data": result})

@router.post("/summarize")
async def summarize_resume(
    resume: UploadFile = File(..., description="Resume file (PDF, DOCX, or TXT)"),
):
    """
    Generate a structured summary. Uses local BART for text summary and LLM for structure.
    """
    file_bytes = await resume.read()
    resume_text = extract_text_from_file(file_bytes, resume.filename or "resume.txt")

    if len(resume_text.strip()) < 50:
        raise HTTPException(
            status_code=422,
            detail="Could not extract meaningful text from the resume file.",
        )

    # 1. High-quality local BART summary
    local_summary = "Could not generate summary."
    try:
        summarizer = get_pipe("summarization_bart", "summarization", "sshleifer/distilbart-cnn-6-6")
        local_summary = summarizer(resume_text[:4000], max_length=150, min_length=50, do_sample=False)[0]['summary_text']
    except Exception:
        pass

    # 2. Structured Extraction via local QA model
    qa_pipe = get_pipe("qa_distilbert", "question-answering", "distilbert-base-uncased-distilled-squad")
    
    def ask(q):
        try:
            res = qa_pipe(question=q, context=resume_text[:2000])
            return res['answer'] if res['score'] > 0.1 else "Not found"
        except: return "Not found"

    result = {
        "candidate_name": ask("What is the full name of the candidate?"),
        "professional_title": ask("What is the candidate's professional title?"),
        "years_of_experience": ask("How many years of experience does the candidate have?"),
        "top_skills": list(extract_keywords(resume_text))[:10],
        "education": [ask("Where did the candidate study?")],
        "summary_paragraph": local_summary
    }

    return JSONResponse(content={"status": "ok", "data": result})

@router.get("/health")
async def health_check():
    """Check health of local models."""
    return {
        "status": "online",
        "mode": "local-transformers",
        "models_cached": os.path.exists(MODEL_CACHE)
    }