from dotenv import load_dotenv
from pathlib import Path
import os
from pymongo import MongoClient

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

MONGO_URI = os.getenv("MONGO_URI")

print("URI OK:", MONGO_URI is not None)

try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    client.admin.command("ping")
    print("MongoDB connection SUCCESS")
except Exception as e:
    print("MongoDB connection ERROR:")
    print(e)