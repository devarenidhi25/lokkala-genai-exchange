import os, json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

import firebase_admin
from firebase_admin import credentials, firestore, storage

# ---------------- FIREBASE INIT -----------------

def initialize_firebase():
    if firebase_admin._apps:
        return
    
    firebase_key_json = os.getenv("FIREBASE_CREDENTIALS")

    if firebase_key_json:  # Cloud Run mode
        try:
            firebase_key_dict = json.loads(firebase_key_json)
            cred = credentials.Certificate(firebase_key_dict)
            print("✅ Firebase loaded from GCP Secret Manager")
        except Exception as e:
            raise ValueError(f"❌ Invalid secret JSON: {e}")
    else:  # Local mode
        load_dotenv()
        local_key = "keys/firebase-local.json"
        if not os.path.exists(local_key):
            raise FileNotFoundError("❌ Firebase key missing for local mode.")
        cred = credentials.Certificate(local_key)
        print("✅ Firebase loaded from local file")

    bucket_name = os.getenv("FIREBASE_STORAGE_BUCKET")
    if not bucket_name:
        raise ValueError("❌ Missing FIREBASE_STORAGE_BUCKET")

    firebase_admin.initialize_app(cred, {"storageBucket": bucket_name})
    print(f"✅ Firebase initialized → Bucket: {bucket_name}")


initialize_firebase()
db = firestore.client()
bucket = storage.bucket()

# ---------------- ENV LOADING FOR CLOUD RUN -----------------

if os.getenv("BACKEND_ENV"):
    for line in os.getenv("BACKEND_ENV").split("\n"):
        if "=" in line:
            key, value = line.split("=", 1)
            os.environ[key] = value

# ---------------- FASTAPI APP -----------------

from routes.caption_router import router as caption_router
from routes.insta_router import router as instagram_router
from routes.translator_router import router as translator_router
from routes.catalog_router import router as catalog_router
from routes.translationAgent_router import router as translation_agent_router
from routes.analytics_router import router as analytics_router
from routes.best_time_router import router as best_time_router

app = FastAPI(title="Instagram Pipeline API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://lokkala.vercel.app",
        "https://lokkala.vercel.app/",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(caption_router)
app.include_router(instagram_router)
app.include_router(translator_router)
app.include_router(catalog_router, prefix="/api/catalog", tags=["catalog"])
app.include_router(translation_agent_router)
app.include_router(analytics_router)
app.include_router(best_time_router)

@app.get("/")
async def root():
    return {"message": "🚀 Instagram Pipeline is running on Cloud Run!"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "gcp_project": os.getenv("GCLOUD_PROJECT"),
        "firebase_loaded": firebase_admin._apps != []
    }


# ---------------- CLOUD RUN ENTRYPOINT -----------------

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
