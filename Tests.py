"""
tests.py  —  Test Portal Router
================================
Drop-in router for the KnowledgeCode FastAPI backend.

Add to main.py:
    import tests
    app.include_router(tests.router, prefix="/tests", tags=["Tests"])
    # also add to lifespan startup:
    await tests.startup()
"""

from __future__ import annotations
import os, re, textwrap, json
from typing import Optional, List, Dict
from fastapi import APIRouter, File, HTTPException, UploadFile, status
from pydantic import BaseModel, Field, ConfigDict
from bson import ObjectId
from database import db, subjects_collection, tests_collection, questions_collection, attempts_collection
from datetime import datetime

MODEL_CACHE = os.getenv("MODEL_CACHE_DIR", "/app/model_cache")

router = APIRouter()

async def startup():
    """Call from main.py lifespan startup."""
    count = await subjects_collection.count_documents({})
    if count == 0:
        await _seed()

async def _seed():
    # 1. Subjects
    for name, icon, color in [("Java","☕","badge-orange"),("Python","🐍","badge-blue"),
                                ("C++","⚡","badge-purple"),("JavaScript","🌐","badge-green")]:
        await subjects_collection.insert_one({"name": name, "icon": icon, "color": color})

    cursor = subjects_collection.find()
    s = {r["name"]: str(r["_id"]) for r in await cursor.to_list(10)}

    # 2. Tests
    test_data = [
        {"subject_id": s["Java"], "title": "Java Basics", "duration": 20, "description": "Core concepts"},
        {"subject_id": s["Java"], "title": "OOP in Java", "duration": 25, "description": "OOP"},
        {"subject_id": s["Python"], "title": "Python Fundamentals", "duration": 15, "description": "Basics"},
        {"subject_id": s["C++"], "title": "C++ Pointers", "duration": 30, "description": "Memory"}
    ]
    for t in test_data:
        await tests_collection.insert_one(t)

    cursor = tests_collection.find()
    tm = {r["title"]: str(r["_id"]) for r in await cursor.to_list(10)}

    # 3. Questions
    qs = [
        (tm["Java Basics"],"What is the default value of a boolean in Java?",
         ["true","false","0","null"],1,"Boolean fields default to <b>false</b> in Java."),
        (tm["Java Basics"],"Which keyword prevents a class from being subclassed?",
         ["static","abstract","final","private"],2,"<b>final</b> prevents a class from being extended."),
        (tm["Java Basics"],"What does JVM stand for?",
         ["Java Virtual Machine","Java Variable Method","Java Verified Module","Just Virtual Machine"],0,
         "JVM = <b>Java Virtual Machine</b>, the bytecode execution engine."),
        (tm["OOP in Java"],"Method overloading is an example of?",
         ["Inheritance","Encapsulation","Polymorphism","Abstraction"],2,
         "Overloading is <b>compile-time polymorphism</b>."),
        (tm["Python Fundamentals"],"Output of print(type(3/2)) in Python 3?",
         ["int","float","double","number"],1,"Python 3 division always returns <b>float</b>."),
        (tm["Python Fundamentals"],"Which method removes the last list element?",
         ["remove()","delete()","pop()","discard()"],2,"<b>pop()</b> removes and returns the last element."),
        (tm["C++ Pointers"],"What does a pointer store?",
         ["A value","A data type","A memory address","A variable name"],2,
         "A pointer holds the <b>memory address</b> of another variable."),
    ]
    for tid, text, opts, correct, exp in qs:
        await questions_collection.insert_one({
            "test_id": tid, "text": text, "options": opts, "correct": correct, "explanation": exp
        })

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class SubjectCreate(BaseModel):
    name: str; icon: str = "📚"; color: str = "badge-blue"

class SubjectOut(BaseModel):
    id: str = Field(..., validation_alias="_id")
    name: str; icon: str; color: str; test_count: int = 0
    model_config = ConfigDict(populate_by_name=True)

class TestCreate(BaseModel):
    subject_id: str; title: str; duration: int = 20; description: str = ""

class TestOut(BaseModel):
    id: str = Field(..., validation_alias="_id")
    subject_id: str; title: str; duration: int; description: str; question_count: int = 0
    model_config = ConfigDict(populate_by_name=True)

class QuestionCreate(BaseModel):
    test_id: str; text: str; options: List[str] = Field(..., min_length=2)
    correct: int; explanation: str = ""

class QuestionOut(BaseModel):
    id: str = Field(..., validation_alias="_id")
    test_id: str; text: str; options: List[str]; correct: int; explanation: str
    model_config = ConfigDict(populate_by_name=True)

class QuestionStudent(BaseModel):
    id: str = Field(..., validation_alias="_id")
    test_id: str; text: str; options: List[str]
    model_config = ConfigDict(populate_by_name=True)

class AttemptSubmit(BaseModel):
    test_id: str; answers: Dict[str, int]; elapsed_sec: int

class AttemptResult(BaseModel):
    attempt_id: str; score: float; correct: int; wrong: int
    skipped: int; total: int; elapsed_sec: int; solutions: List[dict]

class ParseRequest(BaseModel):
    test_id: str; content: str

class AdminStats(BaseModel):
    subjects: int; tests: int; questions: int; attempts: int

# ---------------------------------------------------------------------------
# Subjects
# ---------------------------------------------------------------------------

@router.get("/subjects", response_model=List[SubjectOut])
async def list_subjects():
    pipeline = [
        {"$addFields": {"id_str": {"$toString": "$_id"}}},
        {"$lookup": {
            "from": "test_metadata",
            "localField": "id_str",
            "foreignField": "subject_id",
            "as": "tests"
        }},
        {"$addFields": {"test_count": {"$size": "$tests"}}},
        {"$sort": {"name": 1}},
        {"$project": {"tests": 0, "id_str": 0}}
    ]
    cursor = subjects_collection.aggregate(pipeline)
    res = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        res.append(doc)
    return res

@router.post("/subjects", response_model=SubjectOut, status_code=201)
async def create_subject(p: SubjectCreate):
    d = p.model_dump()
    ins = await subjects_collection.insert_one(d)
    created = await subjects_collection.find_one({"_id": ins.inserted_id})
    created["_id"] = str(created["_id"])
    return created

@router.put("/subjects/{sid}", response_model=SubjectOut)
async def update_subject(sid: str, p: SubjectCreate):
    if not ObjectId.is_valid(sid): raise HTTPException(400, "Invalid ID")
    await subjects_collection.update_one({"_id": ObjectId(sid)}, {"$set": p.model_dump()})
    updated = await subjects_collection.find_one({"_id": ObjectId(sid)})
    if not updated: raise HTTPException(404, "Not found")
    updated["_id"] = str(updated["_id"])
    return updated

@router.delete("/subjects/{sid}", status_code=204)
async def delete_subject(sid: str):
    if not ObjectId.is_valid(sid): raise HTTPException(400, "Invalid ID")
    # Manual cascade
    cursor = tests_collection.find({"subject_id": sid})
    async for t in cursor:
        await questions_collection.delete_many({"test_id": str(t["_id"])})
    await tests_collection.delete_many({"subject_id": sid})
    await subjects_collection.delete_one({"_id": ObjectId(sid)})

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

@router.get("/subjects/{sid}/tests", response_model=List[TestOut])
async def list_tests_by_subject(sid: str):
    pipeline = [
        {"$match": {"subject_id": sid}},
        {"$addFields": {"id_str": {"$toString": "$_id"}}},
        {"$lookup": {"from": "test_questions", "localField": "id_str", "foreignField": "test_id", "as": "qs"}},
        {"$addFields": {"question_count": {"$size": "$qs"}}},
        {"$sort": {"title": 1}},
        {"$project": {"qs": 0, "id_str": 0}}
    ]
    cursor = tests_collection.aggregate(pipeline)
    res = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        res.append(doc)
    return res

@router.get("/tests", response_model=List[TestOut])
async def list_all_tests():
    pipeline = [
        {"$addFields": {"id_str": {"$toString": "$_id"}}},
        {"$lookup": {"from": "test_questions", "localField": "id_str", "foreignField": "test_id", "as": "qs"}},
        {"$addFields": {"question_count": {"$size": "$qs"}}},
        {"$project": {"qs": 0, "id_str": 0}}
    ]
    cursor = tests_collection.aggregate(pipeline)
    res = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        res.append(doc)
    return res

@router.get("/tests/{tid}", response_model=TestOut)
async def get_test(tid: str):
    if not ObjectId.is_valid(tid): raise HTTPException(400, "Invalid ID")
    pipeline = [
        {"$match": {"_id": ObjectId(tid)}},
        {"$addFields": {"id_str": {"$toString": "$_id"}}},
        {"$lookup": {"from": "test_questions", "localField": "id_str", "foreignField": "test_id", "as": "qs"}},
        {"$addFields": {"question_count": {"$size": "$qs"}}},
        {"$project": {"qs": 0, "id_str": 0}}
    ]
    cursor = tests_collection.aggregate(pipeline)
    res = await cursor.to_list(1)
    if not res: raise HTTPException(404, "Test not found")
    doc = res[0]
    doc["_id"] = str(doc["_id"])
    return doc

@router.post("/tests", response_model=TestOut, status_code=201)
async def create_test(p: TestCreate):
    ins = await tests_collection.insert_one(p.model_dump())
    created = await tests_collection.find_one({"_id": ins.inserted_id})
    created["_id"] = str(created["_id"])
    return created

@router.put("/tests/{tid}", response_model=TestOut)
async def update_test(tid: str, p: TestCreate):
    if not ObjectId.is_valid(tid): raise HTTPException(400, "Invalid ID")
    await tests_collection.update_one({"_id": ObjectId(tid)}, {"$set": p.model_dump()})
    updated = await tests_collection.find_one({"_id": ObjectId(tid)})
    if not updated: raise HTTPException(404, "Not found")
    updated["_id"] = str(updated["_id"])
    return updated

@router.delete("/tests/{tid}", status_code=204)
async def delete_test(tid: str):
    if not ObjectId.is_valid(tid): raise HTTPException(400, "Invalid ID")
    await questions_collection.delete_many({"test_id": tid})
    await tests_collection.delete_one({"_id": ObjectId(tid)})

# ---------------------------------------------------------------------------
# Questions
# ---------------------------------------------------------------------------

@router.get("/tests/{tid}/questions", response_model=List[QuestionStudent])
async def get_questions_student(tid: str):
    cursor = questions_collection.find({"test_id": tid}).sort("_id", 1)
    res = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        res.append(doc)
    return res

@router.get("/admin/questions", response_model=List[QuestionOut])
async def list_all_questions(test_id: Optional[str] = None):
    q = {"test_id": test_id} if test_id else {}
    cursor = questions_collection.find(q).sort("_id", 1)
    res = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        res.append(doc)
    return res

@router.post("/admin/questions", response_model=QuestionOut, status_code=201)
async def create_question(p: QuestionCreate):
    ins = await questions_collection.insert_one(p.model_dump())
    created = await questions_collection.find_one({"_id": ins.inserted_id})
    created["_id"] = str(created["_id"])
    return created

@router.put("/admin/questions/{qid}", response_model=QuestionOut)
async def update_question(qid: str, p: QuestionCreate):
    if not ObjectId.is_valid(qid): raise HTTPException(400, "Invalid ID")
    await questions_collection.update_one({"_id": ObjectId(qid)}, {"$set": p.model_dump()})
    updated = await questions_collection.find_one({"_id": ObjectId(qid)})
    updated["_id"] = str(updated["_id"])
    return updated

@router.delete("/admin/questions/{qid}", status_code=204)
async def delete_question(qid: str):
    if not ObjectId.is_valid(qid): raise HTTPException(400, "Invalid ID")
    await questions_collection.delete_one({"_id": ObjectId(qid)})

# ---------------------------------------------------------------------------
# Submit attempt
# ---------------------------------------------------------------------------

@router.post("/tests/{tid}/submit", response_model=AttemptResult)
async def submit_test(tid: str, p: AttemptSubmit):
    cursor = questions_collection.find({"test_id": tid}).sort("_id", 1)
    qs = await cursor.to_list(1000)
    if not qs: raise HTTPException(404, "No questions for this test")

    correct_n = wrong_n = skipped_n = 0
    solutions = []
    for q in qs:
        qid = str(q["_id"])
        ans = p.answers.get(qid)
        opts = q["options"]
        is_ok = ans is not None and ans == q["correct"]
        if ans is None: skipped_n += 1
        elif is_ok: correct_n += 1
        else: wrong_n += 1
        solutions.append({"question_id":qid,"text":q["text"],"options":opts,
                           "your_answer":ans,"correct_answer":q["correct"],
                           "is_correct":is_ok,"explanation":q["explanation"]})

    total = len(qs)
    score = round((correct_n / total) * 100, 1)
    
    attempt = {
        "test_id": tid,
        "answers": p.answers,
        "score": score,
        "elapsed_sec": p.elapsed_sec,
        "timestamp": datetime.utcnow()
    }
    ins = await attempts_collection.insert_one(attempt)
    
    return AttemptResult(attempt_id=str(ins.inserted_id), score=score, correct=correct_n, wrong=wrong_n,
                         skipped=skipped_n, total=total, elapsed_sec=p.elapsed_sec, solutions=solutions)

# ---------------------------------------------------------------------------
# Document parser
# ---------------------------------------------------------------------------

def _regex_parse(text: str) -> list[dict]:
    questions = []
    blocks = re.split(r"\n(?=Q\d+[.)]\s|Question\s*\d+[:.]\s)", text.strip(), flags=re.I)
    for block in blocks:
        lines = [l.strip() for l in block.strip().split("\n") if l.strip()]
        if not lines: continue
        q_text = re.sub(r"^Q\d+[.)]\s*|^Question\s*\d+[:.]\s*", "", lines[0], flags=re.I).strip()
        raw_opts: list[str] = []
        for line in lines[1:]:
            if re.match(r"^(answer|ans|correct)\s*[:\-]", line, re.I): break
            inline = re.findall(r"[a-dA-D][).]\s*([^a-dA-D).\n]+?)(?=\s+[a-dA-D][).]|$)", line)
            if inline:
                raw_opts.extend([o.strip().rstrip("*") for o in inline])
            elif re.match(r"^[a-dA-D][).\s]", line):
                raw_opts.append(re.sub(r"^[a-dA-D][).\s]\s*", "", line).rstrip("*").strip())
        ans_line = next((l for l in lines if re.match(r"^(answer|ans|correct)\s*[:\-]", l, re.I)), None)
        exp_line = next((l for l in lines if re.match(r"^(explanation|exp)\s*[:\-]", l, re.I)), None)
        correct = 0
        if ans_line:
            m = re.search(r"[a-dA-D]", ans_line, re.I)
            if m: correct = "abcd".index(m.group(0).lower())
        explanation = re.sub(r"^(explanation|exp)\s*[:\-]\s*", "", exp_line, flags=re.I).strip() if exp_line else ""
        if q_text and len(raw_opts) >= 2:
            questions.append({"text":q_text,"options":raw_opts[:4],"correct":correct,"explanation":explanation})
    return questions


@router.post("/admin/parse-document")
async def parse_document(p: ParseRequest):
    parsed = _regex_parse(p.content)
    if not parsed:
        raise HTTPException(422, detail=(
            "No questions found. Expected format:\n"
            "Q1. Question text\na) Opt A  b) Opt B  c) Opt C  d) Opt D\n"
            "Answer: b\nExplanation: text"))
    saved = []
    for q in parsed:
        q["test_id"] = p.test_id
        ins = await questions_collection.insert_one(q)
        # After insert, q contains an '_id' field of type ObjectId.
        # We must convert it to a string to prevent FastAPI serialization errors.
        q["id"] = str(ins.inserted_id)
        if "_id" in q: del q["_id"]
        saved.append(q)
    return {"imported": len(saved), "questions": saved}


@router.post("/admin/parse-document/upload")
async def parse_document_upload(test_id: str, file: UploadFile = File(...)):
    content = (await file.read()).decode("utf-8", errors="replace")
    return await parse_document(ParseRequest(test_id=test_id, content=content))

@router.get("/admin/stats", response_model=AdminStats)
async def admin_stats():
    return {
        "subjects": await subjects_collection.count_documents({}),
        "tests": await tests_collection.count_documents({}),
        "questions": await questions_collection.count_documents({}),
        "attempts": await attempts_collection.count_documents({})
    }