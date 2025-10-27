import os
from typing import List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from google.cloud import translate


router = APIRouter(prefix="/translate", tags=["Translation"])

# ----------- Pydantic Models -----------
class TranslateRequest(BaseModel):
    texts: List[str]
    target: str

class TranslateResponse(BaseModel):
    translations: List[str]

# ----------- Config -----------
# Try multiple environment variable names and remove quotes
PROJECT_ID = (
    os.environ.get("GCLOUD_PROJECT", "").strip('"').strip("'") or 
    os.environ.get("GOOGLE_CLOUD_PROJECT", "").strip('"').strip("'") or
    os.environ.get("GCP_PROJECT", "").strip('"').strip("'") or
    "gen-ai-exchange-ho-548d0"  # Fallback to your project ID
)

LOCATION = "global"

print(f"Using Google Cloud Project ID: {PROJECT_ID}")

# ----------- Routes -----------
@router.post("", response_model=TranslateResponse)  # Changed from "/" to ""
async def translate_text(req: TranslateRequest):
    """
    Translate an array of texts into the target language using
    Google Cloud Translation API v3.
    """
    if not req.texts or not isinstance(req.texts, list):
        raise HTTPException(status_code=400, detail="texts must be a non-empty list")
    if not req.target:
        raise HTTPException(status_code=400, detail="target language required")

    # If target is English, just return the originals
    if req.target == "en":
        return {"translations": req.texts}

    try:
        client = translate.TranslationServiceClient()
        parent = f"projects/{PROJECT_ID}/locations/{LOCATION}"
        response = client.translate_text(
            request={
                "parent": parent,
                "contents": req.texts,
                "mime_type": "text/plain",
                "target_language_code": req.target,
            }
        )
        translated = [t.translated_text for t in response.translations]
        return {"translations": translated}
    except Exception as e:
        print(f"Translation error: {e}")
        raise HTTPException(status_code=500, detail=f"Translation failed: {e}")