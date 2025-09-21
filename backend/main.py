# main.py
import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from subagents import root_agent
from caption_backend import router as caption_router
from subagents.caption_generate.caption_generator import (
    caption_generator_agent
)
from subagents.insta_generate.instagram_poster import instagram_poster_agent
# --- Load environment variables ---
load_dotenv()
print("GOOGLE_APPLICATION_CREDENTIALS =>", os.getenv("GOOGLE_APPLICATION_CREDENTIALS"))

# --- FastAPI app setup ---
app = FastAPI(title="Insta Auto Post API")

# Allow frontend calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Include routers ---
app.include_router(caption_router)
# app.include_router(enhance_router)  # optional


# --- Request/response models for Social Media Agent ---
class SocialPostRequest(BaseModel):
    image_path: str


class SocialPostResponse(BaseModel):
    success: bool
    message: str
    caption: str = None


@app.post("/social-agent", response_model=SocialPostResponse)
async def social_agent(req: SocialPostRequest):
    try:
        # Clean the file path
        image_path = req.image_path.strip('"').strip("'").replace("\\", "/")

        if not os.path.exists(image_path):
            return SocialPostResponse(
                success=False,
                message=f"❌ Error: File not found - {image_path}"
            )

        # 1️⃣ Generate caption
        caption = caption_generator_agent.tools[0](image_path)
        # 2️⃣ Post to Instagram
        post_result = instagram_poster_agent.tools[0](caption, image_path)

        return SocialPostResponse(
            success=True,
            message=post_result,
            caption=caption
        )
    except Exception as e:
        return SocialPostResponse(success=False, message=str(e))




# --- Optional CLI entrypoint for testing ---
if __name__ == "__main__":
    test_image = "C:/Users/Nidhi/OneDrive/Documents/LocalArtisans/images/test.jpg"  # replace with your test image path
    print("🚀 Running Insta Auto Post Pipeline...")
    result = root_agent.run({"image_path": test_image})
    print("🎉 Pipeline Result:", result)
