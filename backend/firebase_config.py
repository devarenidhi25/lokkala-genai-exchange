import firebase_admin
from firebase_admin import credentials, firestore, storage
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Initialize Firebase Admin SDK
def initialize_firebase():
    if not firebase_admin._apps:
        # Path to service account key
        service_account_path = Path(__file__).parent / 'keys' / 'FirebaseServiceAccountKey.json'

        
        if not service_account_path.exists():
            raise FileNotFoundError(
                f"Service account key not found at {service_account_path}. "
                "Please download it from Firebase Console and place it in the backend folder."
            )
        
        cred = credentials.Certificate(str(service_account_path))
        
        # Get storage bucket from environment variable
        storage_bucket = os.getenv('FIREBASE_STORAGE_BUCKET')
        
        if not storage_bucket:
            raise ValueError(
                "FIREBASE_STORAGE_BUCKET not found in environment variables. "
                "Please check your .env file."
            )
        
        firebase_admin.initialize_app(cred, {
            'storageBucket': storage_bucket
        })
        print("✅ Firebase initialized successfully")
        print(f"📦 Storage bucket: {storage_bucket}")

# Initialize on import
initialize_firebase()

# Export clients
db = firestore.client()
bucket = storage.bucket()