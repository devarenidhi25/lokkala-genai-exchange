from fastapi import APIRouter, UploadFile, File
import base64
import requests
import os
from dotenv import load_dotenv
from google.oauth2 import service_account
import google.auth.transport.requests

# Router for enhancement
router = APIRouter()

# Load .env for credentials
load_dotenv()

PROJECT_ID = "genaiexchange-471004"
LOCATION = "us-central1"
MODEL = "publishers/google/models/imagen-3.0-capability-002"
ENDPOINT = f"https://{LOCATION}-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/{LOCATION}/publishers/google/models/{MODEL}:predict"


# ✅ Add this function
def get_access_token():
    creds = service_account.Credentials.from_service_account_file(
        os.getenv("GOOGLE_APPLICATION_CREDENTIALS"),
        scopes=["https://www.googleapis.com/auth/cloud-platform"]
    )
    request = google.auth.transport.requests.Request()
    creds.refresh(request)
    return creds.token


@router.post("/enhance-image")
async def enhance_image(file: UploadFile = File(...)):
    img_bytes = await file.read()
    img_b64 = base64.b64encode(img_bytes).decode("utf-8")

    instruction = (
        "Enhance this product photo: improve lighting, colors, sharpness, "
        "remove imperfections, and make it look professional for online marketing."
    )

    payload = {
        "instances": [
            {
                "prompt": instruction,
                "image": img_b64
            }
        ],
        "parameters": {
            "sampleCount": 1
        }
    }

    headers = {
        "Authorization": f"Bearer {get_access_token()}",
        "Content-Type": "application/json",
    }

    response = requests.post(ENDPOINT, headers=headers, json=payload)

    if response.status_code != 200:
        return {"error": response.text}

    result = response.json()
    if "predictions" not in result or not result["predictions"]:
        return {"error": "No prediction returned from Vertex AI", "raw": result}

    enhanced_b64 = result["predictions"][0]["bytesBase64Encoded"]

    filename = f"enhanced_{file.filename}.png"
    with open(filename, "wb") as f:
        f.write(base64.b64decode(enhanced_b64))

    return {"message": "Image enhanced successfully", "imageBase64": enhanced_b64}
