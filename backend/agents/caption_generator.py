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

def generate_captions(image_path: str) -> dict:
    """
    Generates 3 Instagram caption options for the given image file.
    
    Args:
        image_path: Path to the image file
        
    Returns:
        dict with 'captions' key containing list of caption strings
    """
    if not image_path or not os.path.exists(image_path):
        return {"error": "Image file not found", "captions": []}

    try:
        # Open and prepare image
        img = Image.open(image_path)
        
        # Create the prompt
        prompt = """You are an Instagram caption specialist.
Analyze this image and generate 3 creative Instagram captions with relevant hashtags.

Format each option as:

OPTION 1: [engaging caption]
Hashtags: #tag1 #tag2 #tag3

OPTION 2: [engaging caption]
Hashtags: #tag1 #tag2 #tag3

OPTION 3: [engaging caption]
Hashtags: #tag1 #tag2 #tag3
"""

        # Use the correct Gemini API for vision
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        response = model.generate_content([prompt, img])
        
        # Extract and parse captions
        caption_text = response.text
        captions = [opt.strip() for opt in caption_text.split("\n\n") if opt.strip()][:3]
        
        return {"captions": captions}
        
    except Exception as e:
        return {"error": str(e), "captions": []}


caption_tool = FunctionTool(func=generate_captions)

caption_generator_agent = Agent(
    name="CaptionGeneratorAgent",
    model="gemini-2.0-flash-exp",
    instruction="You generate Instagram captions from images. When given an image path, use the generate_captions tool to create 3 caption options.",
    description="Generates captions for uploaded images using Gemini vision.",
    tools=[caption_tool],
)