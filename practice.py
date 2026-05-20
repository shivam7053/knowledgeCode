from fastapi import APIRouter, HTTPException, Body, Response, status
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from database import problems_collection, categories_collection
from bson import ObjectId
import subprocess
import tempfile
import os
import time

router = APIRouter(tags=["practice"])

# ─── Data Models ──────────────────────────────────────────────────────────────

class Category(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    name: str
    title: str
    image_url: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)


class TestCase(BaseModel):
    input: str = ""
    expected_output: str = ""        # auto-filled when reference_solution is saved
    is_hidden: bool = False
    explanation: Optional[str] = None


class Question(BaseModel):
    title: str = ""
    description: str = ""
    initial_code: str = ""
    solution_check: str = ""         # legacy — kept for backward compat
    reference_solution: str = ""     # admin's correct solution (same language as problem)
    custom_checker: str = ""         # optional Python: def check(input,expected,actual)->bool
    test_cases: List[TestCase] = []
    examples: List[Dict[str, str]] = []
    constraints: List[str] = []


class Problem(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    title: str = ""
    difficulty: str = "Easy"
    category: str = "general"
    language: str = "python"
    questions: List[Question] = []

    model_config = ConfigDict(populate_by_name=True)


class Submission(BaseModel):
    problem_id: str
    question_index: int
    language: str
    code: str
    run_only: bool = False


class ValidateRequest(BaseModel):
    language: str
    reference_solution: str
    test_cases: List[TestCase]


class CompilerRequest(BaseModel):
    language: str
    code: str
    stdin: str = ""


# ─── Execution Engine ──────────────────────────────────────────────────────────

TIMEOUT_SECONDS = 5

# Define Docker image names for execution environments
PYTHON_EXEC_IMAGE = "knowledgecode-python-exec"
NODE_EXEC_IMAGE = "knowledgecode-node-exec"
JAVA_EXEC_IMAGE = "knowledgecode-java-exec"
CPP_EXEC_IMAGE = "knowledgecode-cpp-exec"

LANGUAGE_CONFIG: Dict[str, Any] = {
    "python": {
        "filename": "solution.py",
        "image": PYTHON_EXEC_IMAGE,
        "cmd": ["python", "solution.py"],
    },
    "javascript": {
        "filename": "solution.js",
        "image": NODE_EXEC_IMAGE,
        "cmd": ["node", "solution.js"],
    },
    "java": {
        "filename": "Main.java",
        "image": JAVA_EXEC_IMAGE,
        "cmd": ["sh", "-c", "javac Main.java && java Main"], # Compile and run in one command
    },
    "cpp": {
        "filename": "solution.cpp",
        "image": CPP_EXEC_IMAGE,
        "cmd": ["sh", "-c", "g++ -o solution solution.cpp && ./solution"], # Compile and run in one command
    },
    "sql": None,   # handled separately via SQLite
}


async def execute_code(language: str, code: str, stdin_input: str = "") -> Dict[str, Any]:
    """Execute code in a subprocess and return stdout / stderr / time."""
    if language == "sql":
        return _execute_sql(code)

    config = LANGUAGE_CONFIG.get(language)
    if not config:
        return {"stdout": "", "stderr": f"Language '{language}' not supported.", "time": "0ms"}

    start = time.time()
    sandbox_base = "/sandbox" if os.path.exists("/sandbox") else None
    try:
        with tempfile.TemporaryDirectory(dir=sandbox_base) as tmpdir:
            # Write the user's code to a file in the temporary directory
            code_file_path = os.path.join(tmpdir, config["filename"])
            with open(code_file_path, "w") as f:
                f.write(code)

            # Construct the Docker command
            docker_cmd = [
                "docker", "run",
                "-i",        # Keep STDIN open even if not attached
                "--rm",  # Automatically remove the container when it exits
                "--network", "none", # Disable network access for security
                "--memory", "128m",  # Limit memory to 128MB
                "--cpus", "0.5",     # Limit CPU to 0.5 cores
            ]

            sandbox_vol = os.getenv("SANDBOX_VOLUME_NAME")
            if sandbox_vol and sandbox_base:
                docker_cmd += ["-v", f"{sandbox_vol}:/sandbox", "-w", tmpdir]
            else:
                docker_cmd += ["-v", f"{tmpdir}:/app"]

            docker_cmd += [
                config["image"],     # The image to use for execution
                *config["cmd"]       # The command to run inside the container
            ]

            # Execute the Docker command
            # Pass stdin_input to the container's stdin
            proc = subprocess.run(
                docker_cmd,
                input=stdin_input,
                capture_output=True, text=True, timeout=TIMEOUT_SECONDS,
            )
            elapsed = f"{round((time.time() - start) * 1000, 2)}ms"
            return {"stdout": proc.stdout, "stderr": proc.stderr, "time": elapsed}

    except subprocess.TimeoutExpired:
        return {"stdout": "", "stderr": f"Time Limit Exceeded (>{TIMEOUT_SECONDS}s)", "time": f"{TIMEOUT_SECONDS * 1000}ms"}
    except FileNotFoundError:
        return {"stdout": "", "stderr": "Docker client not found. Is Docker installed and running?", "time": "0ms"}
    except subprocess.CalledProcessError as e:
        return {"stdout": "", "stderr": f"Docker execution error: {e.stderr}", "time": "0ms"}
    except Exception as exc:
        return {"stdout": "", "stderr": str(exc), "time": "0ms"}


def _execute_sql(code: str) -> Dict[str, Any]:
    import sqlite3
    start = time.time()
    lines: List[str] = []
    err = ""
    try:
        parts = code.split("-- QUERY --", 1)
        setup = parts[0].strip() if len(parts) > 1 else ""
        query = parts[-1].strip()
        conn = sqlite3.connect(":memory:")
        cur = conn.cursor()
        if setup:
            cur.executescript(setup)
        cur.execute(query)
        rows = cur.fetchall()
        if cur.description:
            lines.append("|".join(d[0] for d in cur.description))
            lines.extend("|".join(str(c) for c in row) for row in rows)
        conn.close()
    except Exception as exc:
        err = str(exc)
    return {"stdout": "\n".join(lines), "stderr": err,
            "time": f"{round((time.time()-start)*1000,2)}ms"}


# ─── Reference Solution ────────────────────────────────────────────────────────

async def derive_expected_outputs(
    language: str,
    reference_solution: str,
    test_cases: List[TestCase],
) -> List[TestCase]:
    """
    Run the reference solution against every test-case input.
    Store the stdout as expected_output. Raises ValueError on any runtime error.
    """
    updated: List[TestCase] = []
    for tc in test_cases:
        result = await execute_code(language, reference_solution, tc.input)
        if result["stderr"].strip():
            raise ValueError(
                f"Input {repr(tc.input)} → error:\n{result['stderr'].strip()}"
            )
        updated.append(TestCase(
            input=tc.input,
            expected_output=result["stdout"].strip(),
            is_hidden=tc.is_hidden,
            explanation=tc.explanation,
        ))
    return updated


# ─── Custom Checker ────────────────────────────────────────────────────────────

def run_custom_checker(checker_code: str, stdin: str, expected: str, actual: str) -> bool:
    """
    Execute admin-supplied Python checker. Must define:
        def check(input_data: str, expected: str, actual: str) -> bool
    Returns False on any error so a bad checker never silently passes wrong answers.
    """
    ns: Dict[str, Any] = {}
    try:
        exec(compile(checker_code, "<checker>", "exec"), ns)
        fn = ns.get("check")
        return bool(fn(stdin, expected, actual)) if callable(fn) else False
    except Exception:
        return False


# ─── Test-Case Runner ──────────────────────────────────────────────────────────

async def run_test_cases(
    language: str,
    code: str,
    test_cases: List[TestCase],
    custom_checker: str = "",
    run_only: bool = False,
) -> Dict[str, Any]:
    cases = [tc for tc in test_cases if not tc.is_hidden] if run_only else test_cases

    if not cases:
        # No test cases at all — just execute and report
        result = await execute_code(language, code)
        return {
            "test_results": [],
            "passed":  0 if result["stderr"] else 1,
            "total":   1,
            "runtime": result["time"],
            "stdout":  result["stdout"],
            "stderr":  result["stderr"],
        }

    test_results: List[Dict[str, Any]] = []
    passed_count = 0
    runtimes: List[float] = []

    for i, tc in enumerate(cases):
        result   = await execute_code(language, code, tc.input)
        actual   = result["stdout"].strip()
        expected = tc.expected_output.strip()
        has_err  = bool(result["stderr"].strip())

        if has_err:
            passed = False
        elif custom_checker:
            passed = run_custom_checker(custom_checker, tc.input, expected, actual)
        else:
            passed = actual == expected

        if passed:
            passed_count += 1

        try:
            runtimes.append(float(result["time"].replace("ms", "")))
        except Exception:
            pass

        test_results.append({
            "index":     i,
            "input":     tc.input   if not tc.is_hidden else "🔒 Hidden",
            "expected":  expected   if not tc.is_hidden else "🔒 Hidden",
            "actual":    actual,
            "passed":    passed,
            "stderr":    result["stderr"],
            "runtime":   result["time"],
            "is_hidden": tc.is_hidden,
        })

    avg_rt    = f"{round(sum(runtimes)/len(runtimes), 2)}ms" if runtimes else "N/A"
    first_err = next((r["stderr"] for r in test_results if r["stderr"]), "")

    return {
        "test_results": test_results,
        "passed":  passed_count,
        "total":   len(cases),
        "runtime": avg_rt,
        "stdout":  test_results[0]["actual"] if test_results else "",
        "stderr":  first_err,
    }


# ─── Shared save helper ────────────────────────────────────────────────────────

async def _prepare_problem_dict(problem: Problem) -> dict:
    """
    Before persisting, run each question's reference_solution (if present)
    against all test-case inputs to auto-populate expected_output.
    Raises HTTP 422 if the reference solution errors.
    """
    d = problem.model_dump(by_alias=True)
    d.pop("_id", None)

    for qi, question in enumerate(problem.questions):
        ref = question.reference_solution.strip()
        if not ref:
            continue   # admin typed expected_output manually — keep as-is

        try:
            updated = await derive_expected_outputs(
                language=problem.language,
                reference_solution=ref,
                test_cases=question.test_cases,
            )
        except ValueError as exc:
            raise HTTPException(
                status_code=422,
                detail=f"Question {qi + 1}: reference solution failed → {exc}",
            )

        d["questions"][qi]["test_cases"] = [tc.model_dump() for tc in updated]

    return d


# ─── Category Routes ───────────────────────────────────────────────────────────

@router.get("/categories", response_model=List[Category])
async def get_categories():
    cats = await categories_collection.find().to_list(100)
    for c in cats:
        c["_id"] = str(c["_id"])
    return cats


@router.post("/categories", response_model=Category)
async def create_category(category: Category):
    d = category.model_dump(by_alias=True)
    d.pop("_id", None)
    ins = await categories_collection.insert_one(d)
    created = await categories_collection.find_one({"_id": ins.inserted_id})
    created["_id"] = str(created["_id"])
    return created


# ─── Problem Routes ────────────────────────────────────────────────────────────

@router.get("/problems", response_model=List[Problem])
async def list_all_problems():
    problems = await problems_collection.find().to_list(1000)
    for p in problems:
        p["_id"] = str(p["_id"])
    return problems


@router.get("/problems/{category}", response_model=List[Problem])
async def get_problems_by_category(category: str):
    problems = await problems_collection.find({"category": category}).to_list(1000)
    for p in problems:
        p["_id"] = str(p["_id"])
    return problems


@router.get("/problem/{problem_id}", response_model=Problem)
async def get_problem(problem_id: str):
    if not ObjectId.is_valid(problem_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    problem = await problems_collection.find_one({"_id": ObjectId(problem_id)})
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    problem["_id"] = str(problem["_id"])
    return problem


@router.post("/problems", response_model=Problem, status_code=status.HTTP_201_CREATED)
async def create_problem(problem: Problem):
    d = await _prepare_problem_dict(problem)
    ins = await problems_collection.insert_one(d)
    created = await problems_collection.find_one({"_id": ins.inserted_id})
    created["_id"] = str(created["_id"])
    return created


@router.put("/problem/{problem_id}", response_model=Problem)
async def update_problem(problem_id: str, problem: Problem):
    if not ObjectId.is_valid(problem_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    d = await _prepare_problem_dict(problem)
    result = await problems_collection.replace_one({"_id": ObjectId(problem_id)}, d)
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Problem not found")
    updated = await problems_collection.find_one({"_id": ObjectId(problem_id)})
    updated["_id"] = str(updated["_id"])
    return updated


@router.delete("/problem/{problem_id}")
async def delete_problem(problem_id: str):
    if not ObjectId.is_valid(problem_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    result = await problems_collection.delete_one({"_id": ObjectId(problem_id)})
    if result.deleted_count == 1:
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    raise HTTPException(status_code=404, detail="Problem not found")


# ─── Validate Reference Solution (preview — nothing saved) ────────────────────

@router.post("/validate-solution")
async def validate_reference_solution(body: ValidateRequest):
    """
    Admin dry-run: execute the reference solution against test inputs and
    return the outputs. Nothing is persisted. Used for live preview in the form.
    """
    results = []
    for tc in body.test_cases:
        r = await execute_code(body.language, body.reference_solution, tc.input)
        results.append({
            "input":  tc.input,
            "output": r["stdout"].strip(),
            "stderr": r["stderr"].strip(),
            "ok":     not bool(r["stderr"].strip()),
        })

    all_ok = all(r["ok"] for r in results)
    return {
        "ok":      all_ok,
        "results": results,
        "error":   None if all_ok else "Some test cases produced errors.",
    }


# ─── Run / Submit ──────────────────────────────────────────────────────────────

@router.post("/run")
async def run_code(submission: Submission):
    """Run against sample (non-hidden) test cases only."""
    submission.run_only = True
    return await _evaluate(submission)


@router.post("/submit")
async def submit_code(submission: Submission):
    """Run against ALL test cases including hidden ones."""
    submission.run_only = False
    return await _evaluate(submission)


async def _evaluate(submission: Submission) -> Dict[str, Any]:
    if not ObjectId.is_valid(submission.problem_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")

    problem = await problems_collection.find_one({"_id": ObjectId(submission.problem_id)})
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    questions = problem.get("questions", [])
    if submission.question_index >= len(questions):
        raise HTTPException(status_code=400, detail="Invalid question index")

    q       = questions[submission.question_index]
    raw_tcs = q.get("test_cases", [])

    # Legacy: promote old solution_check string into a single test case
    if not raw_tcs and q.get("solution_check"):
        raw_tcs = [{"input": "", "expected_output": q["solution_check"],
                    "is_hidden": False, "explanation": None}]

    test_cases = [TestCase(**tc) for tc in raw_tcs]
    checker    = q.get("custom_checker", "")

    exec_result = await run_test_cases(
        language=submission.language,
        code=submission.code,
        test_cases=test_cases,
        custom_checker=checker,
        run_only=submission.run_only,
    )

    passed     = exec_result["passed"]
    total      = exec_result["total"]
    is_correct = passed == total and total > 0

    return {
        "status":       "accepted" if is_correct else "wrong_answer",
        "is_correct":   is_correct,
        "message":      "Accepted" if is_correct else f"{passed}/{total} test cases passed",
        "passed":       passed,
        "total":        total,
        "runtime":      exec_result["runtime"],
        "stdout":       exec_result.get("stdout", ""),
        "stderr":       exec_result.get("stderr", ""),
        "test_results": exec_result.get("test_results", []),
        "run_only":     submission.run_only,
    }


@router.post("/run-compiler")
async def run_compiler(req: CompilerRequest):
    """Generic endpoint for the online compiler."""
    result = await execute_code(
        language=req.language,
        code=req.code,
        stdin_input=req.stdin
    )
    return result