from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import practice
import notifications
import tools
import resume
import Tests as tests
from bson import ObjectId

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialise Test Portal DB + seed data
    await tests.startup()

    # Startup: Print registered routes
    print("\n=== Registered routes ===")
    for route in app.routes:
        if hasattr(route, "methods"):
            methods = ", ".join(sorted(route.methods))
            print(f"  {methods:<20} {route.path}")
    print("=========================\n")
    yield
    # Shutdown logic can go here if needed


app = FastAPI(title="KnowledgeCode Tools API", lifespan=lifespan)

# Global encoder to handle MongoDB ObjectIds automatically
from fastapi.encoders import jsonable_encoder
app.json_encoders = {ObjectId: str}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Practice Router
app.include_router(practice.router, prefix="/practice")
# Include Tools Router
app.include_router(tools.router)
# Include Notifications Router
app.include_router(notifications.router)
# Include Resume Router
app.include_router(resume.router)
# Include Test Portal Router
app.include_router(tests.router, prefix="/tests", tags=["Tests"])

@app.get("/")
async def root():
    return {"status": "ok"}