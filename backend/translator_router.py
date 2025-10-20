import os
from typing import List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

# Google Cloud Translation API client
try:
    from google.cloud import translate_v3 as translate
except Exception:
    from google.cloud import translate as translate

router = APIRouter(prefix="/translate", tags=["Translation"])

# ----------- Pydantic Models -----------
class TranslateRequest(BaseModel):
    texts: List[str]
    target: str

class TranslateResponse(BaseModel):
    translations: List[str]

# ----------- Config -----------
# *** MODIFIED: Rely completely on the environment variable 'GCLOUD_PROJECT' ***
PROJECT_ID = os.environ.get("GCLOUD_PROJECT") 

# Check if the variable was set. Raise an error if running locally without it.
if not PROJECT_ID:
    raise EnvironmentError("The GCLOUD_PROJECT environment variable is not set. Cannot run the application.")

LOCATION = "global"

# ----------- Routes -----------
@router.post("/", response_model=TranslateResponse)
async def translate_text(req: TranslateRequest):
    """
    Translate an array of texts into the target language using
    Google Cloud Translation API v3.
    """
    if not req.texts or not isinstance(req.texts, list):
        raise HTTPException(status_code=400, detail="texts must be a non-empty list")
    if not req.target:
        raise HTTPException(status_code=400, detail="target language required")

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
        raise HTTPException(status_code=500, detail=f"Translation failed: {e}")
