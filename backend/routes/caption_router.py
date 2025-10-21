import os
import tempfile
from fastapi import APIRouter, UploadFile, HTTPException
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types
from agents.caption_generator import caption_generator_agent

router = APIRouter(prefix="/instagram", tags=["Caption Generator"])

APP_NAME = "instagram_pipeline"
USER_ID = "user123"

session_service = InMemorySessionService()
runner = Runner(
    agent=caption_generator_agent,
    app_name=APP_NAME,
    session_service=session_service
)


@router.post("/caption")
async def generate_caption(file: UploadFile):
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")

    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")

    temp_path = None
    try:
        # Save uploaded file temporarily
        filename = file.filename or "upload.jpg"
        ext = os.path.splitext(filename)[1] or ".jpg"

        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name

        # Create unique session ID for each request
        session_id = f"session_{os.urandom(8).hex()}"
        await session_service.create_session(
            app_name=APP_NAME,
            user_id=USER_ID,
            session_id=session_id
        )

        # Send message to agent with the image path
        message = types.Content(
            role="user",
            parts=[types.Part(text=f"Generate Instagram captions for the image at: {temp_path}")]
        )
        
        captions = []

        # Run agent
        async for event in runner.run_async(
            user_id=USER_ID,
            session_id=session_id,
            new_message=message
        ):
            if event.is_final_response():
                # Extract captions from response
                response_text = event.content.parts[0].text
                captions = [opt.strip() for opt in response_text.split("\n\n") if opt.strip()][:3]

        if not captions:
            raise HTTPException(status_code=500, detail="Failed to generate captions")

        return {"captions": captions, "status": "success"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

    finally:
        # Clean up temporary file
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass
