import os
import tempfile
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types
from agents.instagram_poster import instagram_poster_agent

router = APIRouter(prefix="/instagram", tags=["Instagram"])

APP_NAME = "instagram_pipeline"
USER_ID = "user123"

session_service = InMemorySessionService()
runner = Runner(
    agent=instagram_poster_agent,
    app_name=APP_NAME,
    session_service=session_service
)


@router.post("/post")
async def post_to_instagram(image: UploadFile = File(...), caption: str = Form("")):
    """
    Post an image to Instagram with optional caption.
    Generates caption if not provided.
    """
    if not image:
        raise HTTPException(status_code=400, detail="No file uploaded")

    if not image.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")

    temp_path = None

    try:
        # Save uploaded file temporarily
        filename = image.filename or "upload.jpg"
        ext = os.path.splitext(filename)[1] or ".jpg"

        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as temp_file:
            content = await image.read()
            temp_file.write(content)
            temp_path = temp_file.name

        print(f"📁 Received file: {temp_path}")
        print(f"📝 Caption: '{caption}' (length: {len(caption)})")

        # Create unique session for this request
        session_id = f"session_{os.urandom(8).hex()}"
        await session_service.create_session(
            app_name=APP_NAME,
            user_id=USER_ID,
            session_id=session_id
        )

        # Use default caption if empty
        final_caption = caption if caption and caption.strip() else "✨ Check out this beautiful handmade creation! 🎨 #handmade #artisan"
        
        print(f"✅ Final caption to use: '{final_caption}'")

        # Send DIRECT instruction to call the tool - no ambiguity
        message = types.Content(
            role="user",
            parts=[types.Part(
                text=f"Call the instagram_post_run tool now with these parameters: image_path='{temp_path}' and caption='{final_caption}'"
            )]
        )

        result_text = ""
        post_successful = False

        # Run agent asynchronously
        async for event in runner.run_async(
            user_id=USER_ID,
            session_id=session_id,
            new_message=message
        ):
            if event.is_final_response():
                result_text = event.content.parts[0].text
                print(f"🤖 Agent response: {result_text}")
                
                # Check if it was successful
                if "Successfully posted" in result_text or "success" in result_text.lower():
                    post_successful = True

        if not result_text:
            raise HTTPException(status_code=500, detail="Agent did not respond")

        # Check if the agent refused or failed
        if "sorry" in result_text.lower() or "cannot" in result_text.lower() or "need" in result_text.lower():
            raise HTTPException(
                status_code=500, 
                detail=f"Agent refused to post: {result_text}"
            )

        return {
            "success": post_successful,
            "caption": final_caption,
            "post_result": result_text,
            "message": "Post request processed" if post_successful else "Post may have failed - check post_result"
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error posting to Instagram: {str(e)}")

    finally:
        # Clean up temporary file
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
                print(f"🧹 Cleaned up: {temp_path}")
            except OSError as e:
                print(f"⚠️ Could not delete temp file: {e}")