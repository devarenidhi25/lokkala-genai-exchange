import os
import tempfile
from fastapi import APIRouter, UploadFile, Form, HTTPException
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types
from agents.translator import translator_agent
import json
from pydub import AudioSegment

router = APIRouter(prefix="/translator", tags=["Speech Translator"])

APP_NAME = "speech_translator"
USER_ID = "user123"
session_service = InMemorySessionService()
runner = Runner(
    agent=translator_agent,
    app_name=APP_NAME,
    session_service=session_service
)

def convert_to_wav_pydub(input_path: str, output_path: str):
    """Convert audio file to WAV format using pydub"""
    try:
        print(f"🔄 Loading audio file: {input_path}")
        
        # Load audio file (supports webm, mp3, etc.)
        audio = AudioSegment.from_file(input_path)
        
        print(f"📊 Original audio: {len(audio)}ms, {audio.frame_rate}Hz, {audio.channels} channel(s)")
        
        # Convert to WAV with proper settings for speech recognition
        audio = audio.set_frame_rate(16000).set_channels(1)
        
        # Export as WAV
        audio.export(output_path, format="wav")
        print(f"✅ Converted to WAV: {output_path}")
        
        # Verify the output file
        if os.path.exists(output_path):
            size = os.path.getsize(output_path)
            print(f"✅ WAV file created: {size} bytes")
            return True
        else:
            print(f"❌ WAV file not found after conversion")
            return False
            
    except Exception as e:
        print(f"❌ Pydub conversion error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

@router.post("/translate")
async def translate_audio(file: UploadFile, lang_code: str = Form(...)):
    """Accepts an uploaded audio file + language code and returns the English translation."""
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    temp_input_path = None
    temp_wav_path = None
    
    try:
        print(f"\n{'='*60}")
        print(f"📥 Received file: {file.filename}, Language: {lang_code}")
        print(f"   Content-Type: {file.content_type}")
        
        # Save uploaded file temporarily
        suffix = ".webm" if "webm" in str(file.content_type).lower() else ".wav"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_input_path = temp_file.name
        
        input_size = os.path.getsize(temp_input_path)
        print(f"💾 Saved temporary file: {temp_input_path}")
        print(f"   File size: {input_size} bytes")
        
        if input_size == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")
        
        # Convert to WAV format
        temp_wav_path = temp_input_path.replace(suffix, "_converted.wav")
        
        # Try to convert if not already WAV
        if suffix != ".wav":
            print("🔄 Converting to WAV format using pydub...")
            conversion_success = convert_to_wav_pydub(temp_input_path, temp_wav_path)
            if not conversion_success:
                raise HTTPException(
                    status_code=500, 
                    detail="Audio conversion failed. Please check FFmpeg installation."
                )
        else:
            # If already WAV, just copy/rename it
            import shutil
            shutil.copy(temp_input_path, temp_wav_path)
            print(f"📋 Copied WAV file to: {temp_wav_path}")
        
        print(f"✅ WAV file ready: {temp_wav_path}")
        
        # Verify file exists and has content
        if not os.path.exists(temp_wav_path):
            raise HTTPException(status_code=500, detail="WAV file was not created")
        
        wav_size = os.path.getsize(temp_wav_path)
        print(f"📊 Final WAV file size: {wav_size} bytes")
        
        if wav_size == 0:
            raise HTTPException(status_code=500, detail="WAV file is empty")
        
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
                    text=f"Translate this audio into English. Audio path: {temp_wav_path}, Language: {lang_code}"
                )
            ]
        )
        
        print("🤖 Sending to agent...")
        
        result_text = None
        async for event in runner.run_async(
            user_id=USER_ID,
            session_id=session_id,
            new_message=message
        ):
            if event.is_final_response():
                result_text = event.content.parts[0].text
                print(f"📤 Agent response: {result_text}")
        
        if not result_text:
            raise HTTPException(status_code=500, detail="Translation failed - no response from agent")
        
        # Try to parse JSON response from agent
        try:
            result_json = json.loads(result_text)
            if result_json.get("status") == "success":
                translation = result_json.get("english_translation", "")
                detected = result_json.get("detected_text", "")
                print(f"✅ Translation successful!")
                print(f"   Detected: {detected}")
                print(f"   Translation: {translation}")
                print(f"{'='*60}\n")
                return {
                    "status": "success",
                    "translation": translation,
                    "detected_text": detected
                }
            else:
                error_msg = result_json.get("message", "Unknown error")
                print(f"❌ Translation failed: {error_msg}")
                print(f"{'='*60}\n")
                raise HTTPException(status_code=500, detail=f"Translation failed: {error_msg}")
        except json.JSONDecodeError:
            # If not JSON, treat the entire response as translation
            print(f"⚠️ Response is not JSON, using as plain text: {result_text}")
            print(f"{'='*60}\n")
            return {
                "status": "success",
                "translation": result_text.strip()
            }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Translation error: {str(e)}")
        print(f"{'='*60}\n")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error translating audio: {str(e)}")
    
    finally:
        # Clean up temporary files
        for path in [temp_input_path, temp_wav_path]:
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                    print(f"🗑️ Cleaned up: {path}")
                except OSError as e:
                    print(f"⚠️ Could not delete {path}: {e}")