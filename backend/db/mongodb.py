import os
from datetime import datetime
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

client = MongoClient(os.getenv("MONGODB_URI"))
db     = client[os.getenv("DATABASE_NAME")]

messages_collection = db["messages"]

def save_message(session_id: str, role: str, content: str):
    messages_collection.insert_one({
        "session_id": session_id,
        "role":       role,
        "content":    content,
        "timestamp":  datetime.utcnow()
    })

def get_session_messages(session_id: str) -> list:
    messages = messages_collection.find(
        {"session_id": session_id},
        {"_id": 0}
    ).sort("timestamp", 1)
    return list(messages)

def get_all_sessions() -> list:
    pipeline = [
        {"$sort": {"timestamp": -1}},
        {"$group": {
            "_id":          "$session_id",
            "last_message": {"$first": "$content"},
            "last_time":    {"$first": "$timestamp"},
            "message_count":{"$sum": 1}
        }},
        {"$sort": {"last_time": -1}},
        {"$limit": 50}
    ]
    return list(messages_collection.aggregate(pipeline))
