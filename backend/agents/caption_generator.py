from google.adk.agents import Agent
from google.adk.tools import FunctionTool
import google.generativeai as genai
from PIL import Image
from dotenv import load_dotenv
import os
import base64
from io import BytesIO

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    raise ValueError("GOOGLE_API_KEY not found in .env file!")

genai.configure(api_key=api_key)

def read_image_as_base64(image_path: str) -> dict:
    """
    Reads an image file and returns it as base64 string with metadata.
    This allows the agent to see and analyze the image.
    """
    try:
        img = Image.open(image_path)

        if img.mode != 'RGB':
            img = img.convert('RGB')

        buffered = BytesIO()
        img.save(buffered, format="JPEG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode()
        
        return {
            "success": True,
            "image_data": img_base64,
            "size": img.size,
            "format": img.format,
            "message": f"Image loaded successfully: {img.size[0]}x{img.size[1]}"
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": f"Error reading image: {e}"
        }

caption_generator_agent = Agent(
    name="CaptionGeneratorAgent",
    model="gemini-2.0-flash",  
    description="Generates Instagram captions from uploaded images using Gemini Vision.",
    instruction="""
You are an Instagram caption specialist. When given an image path:

1. Use the `read_image_as_base64` tool to load the image
2. Analyze the image content carefully
3. Generate 3 different caption options:
   - Option 1: Focus on the main subject/theme
   - Option 2: Creative/artistic angle
   - Option 3: Engaging/humorous take
4. Include 3-5 relevant hashtags for each option
5. Make captions short (1-2 sentences), catchy, and aesthetic

Format your response clearly with labeled options.
""",
    tools=[read_image_as_base64],
    output_key="caption",
)