import io
import os
import tempfile
import speech_recognition as sr
from gtts import gTTS
import google.generativeai as genai
from dotenv import load_dotenv
from google.adk.agents import Agent
from google.adk.tools import FunctionTool
import json

# ----------------------------------------------------------
# LOAD ENV VARIABLES
# ----------------------------------------------------------
load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# ----------------------------------------------------------
# LANGUAGE SUPPORT
# ----------------------------------------------------------
LANGUAGES = {
    "mr-IN": "Marathi",
    "hi-IN": "Hindi",
    "ta-IN": "Tamil",
    "te-IN": "Telugu",
    "ml-IN": "Malayalam",
    "gu-IN": "Gujarati",
    "or-IN": "Odia",
    "bn-IN": "Bengali",
    "pa-IN": "Punjabi",
    "kn-IN": "Kannada",
    "as-IN": "Assamese",
    "ne-IN": "Nepali",
    "ks-IN": "Kashmiri",
    "ur-IN": "Urdu",
    "sa-IN": "Sanskrit",
    "mai-IN": "Maithili",
    "sd-IN": "Sindhi",
    "mni-IN": "Manipuri",
    "doi-IN": "Dogri",
    "kok-IN": "Konkani",
}

# Dialects fallback
FALLBACK_MAP = {
    "bho-IN": "hi-IN",
    "har-IN": "hi-IN",
    "ks-IN": "hi-IN",
    "ur-IN": "hi-IN",
    "sa-IN": "hi-IN",
    "mai-IN": "hi-IN",
    "sd-IN": "hi-IN",
    "mni-IN": "hi-IN",
    "doi-IN": "hi-IN",
    "kok-IN": "mr-IN",
}

# ----------------------------------------------------------
# FUNCTION TOOL
# ----------------------------------------------------------
def translator_run(audio_path: str, lang_code: str) -> str:
    """
    Translates spoken input in the selected Indian language into English text.
    
    Args:
        audio_path: Path to input WAV audio file
        lang_code: Source language code (e.g., 'hi-IN', 'mr-IN')

    Returns:
        str: JSON string with status, detected_text, and english_translation
    """
    try:
        print(f"\n{'='*60}")
        print(f"🔧 TRANSLATOR FUNCTION CALLED")
        print(f"   Audio path: {audio_path}")
        print(f"   Language: {lang_code}")
        
        if lang_code in FALLBACK_MAP:
            print(f"⚠️ Using fallback {FALLBACK_MAP[lang_code]} for {lang_code}")
            lang_code = FALLBACK_MAP[lang_code]

        recognizer = sr.Recognizer()
        
        # Check if file exists
        if not os.path.exists(audio_path):
            print(f"❌ Audio file not found: {audio_path}")
            return json.dumps({
                "status": "error",
                "message": f"Audio file not found: {audio_path}"
            })
        
        file_size = os.path.getsize(audio_path)
        print(f"📊 Audio file size: {file_size} bytes")
        
        # Add better audio file handling
        try:
            with sr.AudioFile(audio_path) as source:
                print(f"📂 Opened audio file successfully")
                # Adjust for ambient noise
                recognizer.adjust_for_ambient_noise(source, duration=0.5)
                audio = recognizer.record(source)
                print(f"✅ Audio recorded from file")
        except Exception as audio_error:
            print(f"❌ Audio file error: {audio_error}")
            import traceback
            traceback.print_exc()
            return json.dumps({
                "status": "error",
                "message": f"Could not read audio file: {str(audio_error)}"
            })

        # Step 1: Recognize speech
        try:
            print(f"🎤 Attempting speech recognition with Google...")
            detected_text = recognizer.recognize_google(audio, language=lang_code)
            print(f"🗣️ Recognized: {detected_text}")
        except sr.UnknownValueError:
            print(f"❌ Could not understand audio")
            return json.dumps({
                "status": "error",
                "message": "Could not understand audio. Please speak clearly."
            })
        except sr.RequestError as e:
            print(f"❌ Speech recognition service error: {e}")
            return json.dumps({
                "status": "error",
                "message": f"Speech recognition service error: {str(e)}"
            })

        # Step 2: Translate with Gemini
        try:
            print(f"🌐 Translating with Gemini...")
            model = genai.GenerativeModel("gemini-2.0-flash")
            prompt = (
                f"Translate the following {LANGUAGES.get(lang_code, lang_code)} text into fluent English:\n\n"
                f"{detected_text}\n\n"
                f"Output ONLY the English translation, nothing else."
            )
            response = model.generate_content(prompt)
            english_translation = response.text.strip()
            print(f"🌍 English Translation: {english_translation}")
        except Exception as gemini_error:
            print(f"❌ Gemini error: {gemini_error}")
            import traceback
            traceback.print_exc()
            return json.dumps({
                "status": "error",
                "message": f"Translation service error: {str(gemini_error)}"
            })

        # Return JSON string
        result = {
            "status": "success",
            "detected_text": detected_text,
            "english_translation": english_translation,
        }
        print(f"✅ Translation complete!")
        print(f"{'='*60}\n")
        return json.dumps(result)

    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        print(f"{'='*60}\n")
        return json.dumps({
            "status": "error",
            "message": f"Unexpected error: {str(e)}"
        })


translator_tool = FunctionTool(func=translator_run)

# ----------------------------------------------------------
# TRANSLATOR AGENT
# ----------------------------------------------------------
translator_agent = Agent(
    name="TranslatorAgent",
    model="gemini-2.0-flash",
    instruction="""
You are a multilingual speech-to-English translator agent.
You will receive a request to translate audio from an Indian language to English.

Your task:
1. Call the translator_run function with the audio_path and lang_code provided
2. Parse the result JSON string from the function
3. Return the parsed result directly

IMPORTANT: Do NOT modify or wrap the result. Return exact parsed JSON.
""",
    description="Translates Indian language speech to English using Gemini.",
    tools=[translator_tool],
)
