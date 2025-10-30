import io
import os
import tempfile
import speech_recognition as sr
from gtts import gTTS
import google.generativeai as genai
from dotenv import load_dotenv
from playsound import playsound
from google.adk.agents import Agent
from google.adk.tools import FunctionTool

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
def translator_run(audio_path: str, lang_code: str) -> dict:
    """
    Translates spoken input in the selected Indian language into English text and audio.
    
    Args:
        audio_path: Path to input WAV audio file
        lang_code: Source language code (e.g., 'hi-IN', 'mr-IN')

    Returns:
        dict: Detected text, translated text
    """
    try:
        if lang_code in FALLBACK_MAP:
            print(f"⚠️ Using fallback {FALLBACK_MAP[lang_code]} for {lang_code}")
            lang_code = FALLBACK_MAP[lang_code]

        recognizer = sr.Recognizer()
        with sr.AudioFile(audio_path) as source:
            audio = recognizer.record(source)

        # Step 1: Recognize speech
        detected_text = recognizer.recognize_google(audio, language=lang_code)
        print(f"🗣️ Recognized: {detected_text}")

        # Step 2: Translate with Gemini
        model = genai.GenerativeModel("gemini-2.0-flash")
        prompt = (
            f"Translate the following {LANGUAGES.get(lang_code, lang_code)} text into fluent English:\n\n"
            f"{detected_text}\n\n"
            f"Output only the English translation."
        )
        response = model.generate_content(prompt)
        english_translation = response.text.strip()
        print(f"🌍 English Translation: {english_translation}")

        # Step 3: Convert translation to speech (in memory)
        tts = gTTS(text=english_translation, lang="en")
        temp_audio = tempfile.NamedTemporaryFile(delete=True, suffix=".mp3")
        tts.save(temp_audio.name)
        playsound(temp_audio.name)  # plays directly, not stored permanently

        return {
            "status": "success",
            "detected_text": detected_text,
            "english_translation": english_translation,
        }

    except sr.UnknownValueError:
        return {"status": "error", "message": "Could not understand audio."}
    except Exception as e:
        return {"status": "error", "message": str(e)}


translator_tool = FunctionTool(func=translator_run)

# ----------------------------------------------------------
# TRANSLATOR AGENT
# ----------------------------------------------------------
translator_agent = Agent(
    name="TranslatorAgent",
    model="gemini-2.0-flash",
    instruction="""
You are a multilingual speech-to-English translator agent.
You accept an audio file and language code.
You should:
1. Recognize the speech in the selected Indian language.
2. Translate it fluently into English using Gemini.
3. Output both detected and translated text.
4. Play the English translation audio locally (do not save files permanently).
""",
    description="Translates spoken Indian language audio into English using Gemini.",
    tools=[translator_tool],
)