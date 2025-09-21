# caption_backend.py
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Any, Dict
import os
import json
import base64
import tempfile
from dotenv import load_dotenv

# Google Gen AI client (google-genai)
from google import genai

load_dotenv()

router = APIRouter()

# Config from .env
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")  # override in .env if you want

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY not set in your environment (put it in .env)")

# Create client (the google-genai SDK)
client = genai.Client(api_key=GEMINI_API_KEY)


class CaptionRequest(BaseModel):
    prompt: Optional[str] = ""
    imageBase64: Optional[str] = None
    tone: Optional[str] = "heritage-focused"


def extract_json_from_text(text: str):
    """
    Try to find the first JSON object/array in the text and parse it.
    Returns parsed JSON or None if not found/parsable.
    """
    if not text:
        return None
    # try bracket-search heuristics
    starts = []
    for i, ch in enumerate(text):
        if ch in ['[', '{']:
            starts.append((i, ch))
    # try from earliest starting bracket
    for start_idx, ch in starts:
        if ch == '[':
            end_idx = text.rfind(']')
        else:
            end_idx = text.rfind('}')
        if end_idx <= start_idx:
            continue
        candidate = text[start_idx:end_idx + 1]
        try:
            return json.loads(candidate)
        except Exception:
            continue
    # fall back: try whole text
    try:
        return json.loads(text)
    except Exception:
        return None


@router.post("/api/generate-caption")
async def generate_caption(req: CaptionRequest):
    try:
        # Build a strict instruction that asks for JSON-only output
        final_prompt = f"""
You are an expert copywriter for Indian handmade artisan products. Based on the information below, return EXACTLY one valid JSON object (no extra text) with this schema:

{{
  "variations": [
    {{
      "short": "short caption (one line, casual)",
      "long": "long caption (detailed product description + story)",
      "hashtags": ["#tag1", "#tag2"],
      "post_sample": "sample social post using the caption"
    }}
  ],
  "marketing_tips": [
    "Short actionable marketing tip 1",
    "Short actionable marketing tip 2"
  ]
}}

Give exactly 3 variations in the `variations` array. Use the following inputs:
User Prompt: {req.prompt or "N/A"}
Tone: {req.tone}

Return JSON only (no explanation, no markdown). Make hashtags relevant and include at least 3 hashtags per variation.
"""

        # Prepare contents for Gemini
        # If an image was provided, save to a temp file and upload via the SDK so Gemini sees it.
        contents = None
        temp_path = None

        if req.imageBase64:
            # decode and write to temp file
            image_bytes = base64.b64decode(req.imageBase64)
            with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tf:
                tf.write(image_bytes)
                temp_path = tf.name

            # upload the file using client.files.upload (supported by the SDK)
            uploaded_file = client.files.upload(file=temp_path)

            # Provide multimodal contents: image + text prompt
            # order: file first, then prompt (both are acceptable)
            contents = [uploaded_file, final_prompt]
        else:
            contents = final_prompt

        # Call Gemini
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=contents,
        )

        # The SDK returns aggregated text on response.text()
        text_response = response.text if hasattr(response, "text") else str(response)

        # Try to find JSON inside the response
        parsed = extract_json_from_text(text_response)
        if parsed is None:
            # If we couldn't parse JSON, return the raw text so frontend can show it (and debugging)
            parsed = {"raw_text": text_response}

        # cleanup temp file
        if temp_path:
            try:
                os.unlink(temp_path)
            except Exception:
                pass

        return {"success": True, "data": parsed}
    
    except Exception as e:
        # include the error message for debugging
        return {"success": False, "error": str(e)}
