from google.adk.agents import LlmAgent

# --- Constants ---
GEMINI_MODEL = "gemini-2.0-flash"  # lightweight + supports multimodal

# Create the image generator agent
image_generator_agent = LlmAgent(
    name="ImageGeneratorAgent",
    model=GEMINI_MODEL,
    instruction="""You are an AI that generates creative image concepts.
    
    Input:
    {text}
    
    Task:
    - Convert the input text into a descriptive, vivid image prompt.
    - Output should be suitable for generating an image with Gemini.
    """,
    description="Generates an image prompt based on input text.",
    output_key="image_prompt",
)