import os
import requests
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
from google.adk.agents import Agent
from google.adk.tools import FunctionTool

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUD_NAME"),
    api_key=os.getenv("API_KEY"),
    api_secret=os.getenv("API_SECRET")
)

def instagram_post_run(inputs: dict):
    """
    Uploads image to Cloudinary, then posts the image to Instagram via the Graph API.
    Requires .env variables:
      - CLOUD_NAME, API_KEY, API_SECRET
      - INSTAGRAM_ACCESS_TOKEN
      - INSTAGRAM_BUSINESS_ACCOUNT_ID
    """
    image_path = inputs.get("image_path")
    caption = inputs.get("caption")

    access_token = os.getenv("INSTAGRAM_ACCESS_TOKEN")
    business_account_id = os.getenv("INSTAGRAM_BUSINESS_ACCOUNT_ID")

    if not access_token or not business_account_id:
        return {"post_status": "❌ Missing Instagram API credentials."}

    if not image_path or not os.path.exists(image_path):
        return {"post_status": "❌ Image file not found."}

    try:
        print("Uploading image to Cloudinary...")
        upload_result = cloudinary.uploader.upload(image_path)
        image_url = upload_result.get("secure_url")

        if not image_url:
            return {"post_status": "Cloudinary upload failed."}

        print("Cloudinary upload successful.")
        print("Image URL:", image_url)

        # -------------------------------
        # Step 1: Upload image container to Instagram
        # -------------------------------
        print("Sending image to Instagram via Graph API...")
        upload_url = f"https://graph.facebook.com/v21.0/{business_account_id}/media"

        payload = {
            "image_url": image_url,  
            "caption": caption,
            "access_token": access_token
        }

        upload_response = requests.post(upload_url, data=payload)
        upload_data = upload_response.json()
        print("Upload response:", upload_data)

        if "id" not in upload_data:
            return {"post_status": f"Upload failed: {upload_data}"}

        container_id = upload_data["id"]

        # -------------------------------
        # Step 2: Publish the container
        # -------------------------------
        publish_url = f"https://graph.facebook.com/v21.0/{business_account_id}/media_publish"
        publish_response = requests.post(
            publish_url,
            data={"creation_id": container_id, "access_token": access_token},
        )
        publish_data = publish_response.json()
        print("Publish response:", publish_data)

        if "id" not in publish_data:
            return {"post_status": f"Publish failed: {publish_data}"}

        return {
            "post_status": "Successfully posted to Instagram!",
            "media_id": publish_data["id"],
            "caption": caption,
            "image_url": image_url,
        }

    except Exception as e:
        return {"post_status": f"❌ Exception: {e}"}


# -------------------------------
# Wrap it as an ADK FunctionTool
# -------------------------------
insta_tool = FunctionTool(func=instagram_post_run)

# -------------------------------
# Instagram Poster Agent Definition
# -------------------------------
instagram_poster_agent = Agent(
    name="InstagramPosterAgent",
    model="gemini-2.0-flash",
    instruction="""
You are an Instagram Poster Agent.
Task:
- Takes image_path and caption
- Uploads image to Cloudinary
- Gets the public image URL
- Posts the image to Instagram via Graph API
- Returns post_status, media_id, and image_url
""",
    description="Uploads image to Cloudinary and posts it to Instagram via Graph API.",
    tools=[insta_tool],
    output_key="post_status",
)