import os
import tempfile
from fastapi import APIRouter, UploadFile, Form, HTTPException
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
async def generate_caption(
    file: UploadFile,
    prompt: str = Form(None)  # ✅ receive prompt text from frontend
):
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")

    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")

    temp_path = None
    try:
        filename = file.filename or "upload.jpg"
        ext = os.path.splitext(filename)[1] or ".jpg"

        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name

        # ✅ Default prompt if user didn't type anything
        product_text = prompt.strip() if prompt else "Handmade artisan item"

        session_id = f"session_{os.urandom(8).hex()}"
        await session_service.create_session(
            app_name=APP_NAME,
            user_id=USER_ID,
            session_id=session_id
        )

        # ✅ Updated prompt: image + text description used
        message_text = f"""
You are a professional social media marketer.

Generate 3 creative Instagram captions for a handmade/artisan product.

🧾 Product description (user wrote):
"{product_text}"

📸 Product image:
{temp_path}

✨ Requirements:
- 3-5 captions, separated by blank line
- Under 200 characters each
- Natural, emotional tone
- 3–5 relevant emojis
- Add 3–7 trending, aesthetic hashtags
- Include soft CTA like “Tap ❤️ if you love handmade!”
- Do NOT mention "handmade" or "artisan" in every caption
- Write caption in whichever language the user provided the description in
"""

        message = types.Content(
            role="user",
            parts=[types.Part(text=message_text)]
        )

        captions = []

        async for event in runner.run_async(
            user_id=USER_ID,
            session_id=session_id,
            new_message=message
        ):
            if event.is_final_response():
                response_text = event.content.parts[0].text
                response_text = event.content.parts[0].text.strip()

                # Remove any accidental model intro lines
                blocked = ["here are", "caption", "example", ":"]
                clean_lines = []
                for line in response_text.split("\n"):
                    if not any(b in line.lower() for b in blocked):
                        clean_lines.append(line)
                clean_text = "\n".join(clean_lines).strip()

                # Split captions
                captions = [c.strip() for c in clean_text.split("\n\n") if len(c.strip()) > 5]

                # Fallback if model returned one caption per line
                if len(captions) < 3:
                    captions = [c.strip() for c in clean_text.split("\n") if len(c.strip()) > 5]

                # Return max 5 captions
                captions = captions[:5]

        if not captions:
            raise HTTPException(status_code=500, detail="Failed to generate captions")

        return {
            "captions": captions,
            "status": "success",
            "style": "image+text"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing: {str(e)}")

    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass
