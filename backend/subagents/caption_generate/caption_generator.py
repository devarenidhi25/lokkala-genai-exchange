# import os
# import requests
# from google.adk.agents import LlmAgent
# import google.generativeai as genai
# from PIL import Image
# from io import BytesIO
# from config import GOOGLE_API_KEY

# # Set environment variable for ADK
# os.environ['GOOGLE_API_KEY'] = GOOGLE_API_KEY

# # Configure genai globally
# genai.configure(api_key=GOOGLE_API_KEY)

# def generate_caption(image_url: str) -> str:
#     """Generate a short Instagram caption for an online image.
    
#     Args:
#         image_url: URL of the image to caption
        
#     Returns:
#         Generated Instagram caption or error message
#     """
#     try:
#         print(f"Starting caption generation for: {image_url}")
        
#         if not image_url:
#             return "Error: Please provide an image URL"
        
#         # Remove quotes if user included them
#         image_url = image_url.strip('"\'')
#         print(f"Cleaned URL: {image_url}")
        
#         # Download the image from URL
#         print("Downloading image from URL...")
#         response = requests.get(image_url, timeout=10)
#         response.raise_for_status()
        
#         # Open image from bytes
#         img = Image.open(BytesIO(response.content))
#         print(f"Image downloaded successfully: {img.size}")
        
#         # More specific prompt for Instagram captions
#         prompt = """Create an engaging Instagram caption for this photo. 
#         Keep it under 150 characters. Use 1-2 relevant emojis. 
#         Make it catchy and Instagram-style, not a description. 
#         Focus on mood, feeling, or a brief inspirational message."""
        
#         print("Calling Gemini API...")
#         model = genai.GenerativeModel("gemini-2.5-pro")
#         response = model.generate_content([prompt, img])
        
#         result = response.text.strip()
#         # Remove any extra quotes or formatting
#         result = result.strip('"\'')
#         print(f"Generated caption: {result}")
#         return result
    
#     except requests.RequestException as e:
#         error_msg = f"Error downloading image: {str(e)}"
#         print(error_msg)
#         return error_msg
#     except Exception as e:
#         error_msg = f"Error processing image: {str(e)}"
#         print(error_msg)
#         return error_msg

# caption_generator_agent = LlmAgent(
#     name="CaptionGeneratorAgent",
#     description="Generates short, catchy Instagram-style captions for images from URLs. Ask the user for the image URL if not provided.",
#     model="gemini-2.5-pro",
#     tools=[generate_caption]
# )










import os
from google.adk.agents import LlmAgent
import google.generativeai as genai
from PIL import Image
from config import GOOGLE_API_KEY

# -----------------------
# Configure Google Gemini
# -----------------------
os.environ['GOOGLE_API_KEY'] = GOOGLE_API_KEY
genai.configure(api_key=GOOGLE_API_KEY)


def generate_caption_from_file(image_path: str) -> str:
    """
    Generate a short Instagram caption for a local image file.

    Args:
        image_path: Path to the image file on local device.

    Returns:
        Generated Instagram caption or error message.
    """
    try:
        if not os.path.exists(image_path):
            return f"❌ Error: File not found - {image_path}"

        # Open image directly
        img = Image.open(image_path)
        print(f"✅ Loaded image: {image_path}, size: {img.size}")

        # Prompt for Gemini
        prompt = """Create an engaging Instagram caption for this photo.
        Keep it under 150 characters. Use 1-2 relevant emojis.
        Make it catchy and Instagram-style, not a description.
        Focus on mood, feeling, or a brief inspirational message."""

        print("🌀 Calling Gemini API...")
        model = genai.GenerativeModel("gemini-2.5-pro")
        response = model.generate_content([prompt, img])

        # Clean the output
        result = response.text.strip().strip('"\'')
        print(f"📝 Generated caption: {result}")
        return result

    except Exception as e:
        return f"❌ Error processing image: {str(e)}"


# -----------------------
# Define ADK LLM Agent
# -----------------------
caption_generator_agent = LlmAgent(
    name="CaptionGeneratorAgent",
    description=(
        "Generates short, catchy Instagram-style captions "
        "for local images on your device."
    ),
    model="gemini-2.5-pro",
    tools=[generate_caption_from_file]
)
