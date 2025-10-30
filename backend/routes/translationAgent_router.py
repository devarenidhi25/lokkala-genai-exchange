import os
import tempfile
from fastapi import APIRouter, UploadFile, Form, HTTPException
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types
from agents.translator import translator_agent

router = APIRouter(prefix="/translator", tags=["Speech Translator"])

APP_NAME = "speech_translator"
USER_ID = "user123"

session_service = InMemorySessionService()
runner = Runner(
    agent=translator_agent,
    app_name=APP_NAME,
    session_service=session_service
)


@router.post("/translate")
async def translate_audio(file: UploadFile, lang_code: str = Form(...)):
    """Accepts an uploaded audio file + language code and returns the English translation."""
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    if not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="File must be an audio file")

    temp_path = None

    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name

        # Create a new session for this translation request
        session_id = f"session_{os.urandom(8).hex()}"
        await session_service.create_session(
            app_name=APP_NAME,
            user_id=USER_ID,
            session_id=session_id
        )

        message = types.Content(
            role="user",
            parts=[
                types.Part(
                    text=f"Translate this audio into English. Audio path: {temp_path}, Language: {lang_code}"
                )
            ]
        )

        result = None

        async for event in runner.run_async(
            user_id=USER_ID,
            session_id=session_id,
            new_message=message
        ):
            if event.is_final_response():
                result = event.content.parts[0].text

        if not result:
            raise HTTPException(status_code=500, detail="Translation failed.")

        return {"status": "success", "translation": result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error translating audio: {str(e)}")

    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass
