import os
from PIL import Image
from google.adk.agents import Agent
from google.adk.tools import FunctionTool
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY not found in .env file!")

genai.configure(api_key=api_key)

def generate_captions(image_path: str, prompt: str = "") -> dict:
    if not image_path or not os.path.exists(image_path):
        return {"error": "Image not found", "captions": []}

    try:
        img = Image.open(image_path)

        user_text = prompt.strip() if prompt else "Handcrafted artisan product"

        prompt_text = f"""
You are an Instagram caption specialist.

User description: "{user_text}"

Analyze this image + description and generate 3-5 Instagram captions with hashtags.
"""

        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        response = model.generate_content([prompt_text, img])
        caption_text = response.text
        captions = [opt.strip() for opt in caption_text.split("\n\n") if opt.strip()][:3]
        return {"captions": captions}

    except Exception as e:
        return {"error": str(e), "captions": []}


caption_tool = FunctionTool(func=generate_captions)

caption_generator_agent = Agent(
    name="CaptionGeneratorAgent",
    model="gemini-2.0-flash-exp",
    instruction="Use image + user text to generate captions.",
    description="Generates captions for artisan products using Gemini Vision.",
    tools=[caption_tool],
)
