import firebase_admin
from firebase_admin import credentials, firestore, storage
import os, json
from dotenv import load_dotenv

load_dotenv()

def initialize_firebase():
    if not firebase_admin._apps:
        
        firebase_json = os.getenv("FIREBASE_CONFIG")
        if not firebase_json:
            raise ValueError("Environment variable FIREBASE_CONFIG is missing")

        # Load credentials from env JSON
        cred = credentials.Certificate(json.loads(firebase_json))

        storage_bucket = os.getenv("FIREBASE_STORAGE_BUCKET")
        if not storage_bucket:
            raise ValueError("FIREBASE_STORAGE_BUCKET is missing in environment variables")

        firebase_admin.initialize_app(cred, {
            "storageBucket": storage_bucket
        })

        print("✅ Firebase initialized using ENV credentials")
        print(f"📦 Bucket: {storage_bucket}")

# Init on import
initialize_firebase()

# Export
db = firestore.client()
bucket = storage.bucket()
