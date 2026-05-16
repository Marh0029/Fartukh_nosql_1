import os
import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

MONGO_URI = os.getenv("MONGO_URI")

client = MongoClient(MONGO_URI)
db = client["spotify"]

collection = db["tracks_raw"]
collection.drop()

CSV_PATH = r"C:\Users\fartu\.cache\kagglehub\datasets\maharshipandya\-spotify-tracks-dataset\versions\1\dataset.csv"

df = pd.read_csv(CSV_PATH)

print("Rows loaded from CSV:", len(df))

# чистка
df = df.dropna()

records = df.to_dict("records")
collection.insert_many(records)

print("Inserted into MongoDB:", collection.count_documents({}))