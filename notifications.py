from datetime import datetime
from fastapi import APIRouter, Form
from database import notifications_collection

router = APIRouter(tags=["Notifications"])

# ─── Notification Endpoints ───────────────────────────────────────────────────

@router.get("/notifications")
async def get_notifications():
    """Fetch all notifications, sorted by the latest first."""
    cursor = notifications_collection.find().sort("timestamp", -1)
    notifs = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        notifs.append(doc)
    return notifs

@router.post("/notifications")
async def create_notification(
    title: str = Form(...),
    message: str = Form(...),
    category: str = Form(...) # course, game, or feature
):
    new_notif = {
        "title": title,
        "message": message,
        "category": category,
        "timestamp": datetime.utcnow().isoformat()
    }
    await notifications_collection.insert_one(new_notif)
    return {"status": "ok"}