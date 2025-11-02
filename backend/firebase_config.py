import firebase_admin
from firebase_admin import credentials, firestore, storage
import os
import json
from dotenv import load_dotenv

# Load env only in local
load_dotenv()

def initialize_firebase():
    if firebase_admin._apps:
        return
    
    # Try Secret Manager first (Cloud Run)
    firebase_key_json = os.getenv("FIREBASE_CREDENTIALS")

    if firebase_key_json:
        try:
            firebase_key_dict = json.loads(firebase_key_json)
            cred = credentials.Certificate(firebase_key_dict)
            print("✅ Firebase: Loaded from Secret Manager (Cloud Run mode)")
        except Exception as e:
            raise ValueError(f"❌ Secret Manager JSON invalid: {e}")
    else:
        # Local mode - load from keys folder
        local_key_path = "keys/firebase-local.json"  # rename your file to this
        if not os.path.exists(local_key_path):
            raise FileNotFoundError(
                f"❌ Local Firebase key not found: {local_key_path}\n"
                "Please download firebase key and place it there."
            )
        cred = credentials.Certificate(local_key_path)
        print("✅ Firebase: Loaded from local file mode")

    bucket_name = os.getenv("FIREBASE_STORAGE_BUCKET")
    if not bucket_name:
        raise ValueError("❌ Missing FIREBASE_STORAGE_BUCKET env variable")

    firebase_admin.initialize_app(cred, {"storageBucket": bucket_name})
    print(f"✅ Firebase initialized successfully (Bucket: {bucket_name})")


initialize_firebase()

# Export clients
db = firestore.client()
bucket = storage.bucket()
