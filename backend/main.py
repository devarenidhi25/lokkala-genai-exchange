from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.caption_router import router as caption_router
from routes.insta_router import router as instagram_router
from routes.translator_router import router as translator_router
from routes.catalog_router import router as catalog_router
from routes.translationAgent_router import router as translation_agent_router
from routes.analytics_router import router as analytics_router  # NEW
from routes.best_time_router import router as best_time_router
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="Instagram Pipeline API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://lokkala.vercel.app",
        "https://lokkala.vercel.app/"
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
app.include_router(analytics_router)  # NEW: Analytics endpoints
app.include_router(best_time_router)

@app.get("/")
async def root():
    return {"message": "🚀 Instagram Pipeline is running!"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "project_id": os.environ.get("GCLOUD_PROJECT", "Not set"),
        "credentials_set": bool(os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")),
        "bigquery_enabled": bool(os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"))  # NEW

    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)