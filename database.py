import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

# Detect directory of the current file (c:\KnowledgeCode\api)
CURRENT_DIR = Path(__file__).resolve().parent
# Detect project root (c:\KnowledgeCode)
BASE_DIR = CURRENT_DIR.parent # This is already 'c:\KnowledgeCode'

env_path_fastapi = CURRENT_DIR / ".env"
env_path_frontend = BASE_DIR / "KnowledgeCode" / ".env"
env_path_root = BASE_DIR / ".env"

if env_path_fastapi.exists():
    print(f"SUCCESS: Found .env file at {env_path_fastapi}")
    load_dotenv(dotenv_path=str(env_path_fastapi))
elif env_path_frontend.exists():
    print(f"SUCCESS: Found .env file at {env_path_frontend}")
    load_dotenv(dotenv_path=str(env_path_frontend))
elif env_path_root.exists():
    print(f"SUCCESS: Found .env file at {env_path_root}")
    load_dotenv(dotenv_path=str(env_path_root))
else:
    print("WARNING: .env not found in standard locations, checking environment...")
    load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    print("WARNING: MONGODB_URI not found. Defaulting to localhost.")
    MONGODB_URI = "mongodb://localhost:27017"
else:
    # Masking password for security in logs
    try:
        safe_uri = MONGODB_URI.split('@')[-1] if '@' in MONGODB_URI else MONGODB_URI
        print(f"SUCCESS: MONGODB_URI loaded. Connecting to: {safe_uri}")
    except Exception:
        print("SUCCESS: MONGODB_URI loaded.")

MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "knowledgecode_db")

# Use a 5-second timeout for server selection to prevent the API from hanging
client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=5000)

# We use the "test" or "KnowledgeCode" database
db = client.get_database(MONGODB_DB_NAME)

problems_collection = db.practice_problems
categories_collection = db.categories
notifications_collection = db.notifications