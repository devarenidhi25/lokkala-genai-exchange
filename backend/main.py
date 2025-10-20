import asyncio
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types
from agent import root_agent
import os
from dotenv import load_dotenv
load_dotenv()
APP_NAME = "instagram_pipeline"
USER_ID = "user123"
SESSION_ID = "session_1234"

# router of translater left to add

async def main():
    image_path = "C:/Users/Hxtreme/Downloads/lion.jpg"  
    if not os.path.exists(image_path):
        print(f"Image not found: {image_path}")
        return

    session_service = InMemorySessionService()
    await session_service.create_session(
        app_name=APP_NAME, user_id=USER_ID, session_id=SESSION_ID
    )

    runner = Runner(agent=root_agent, app_name=APP_NAME, session_service=session_service)

    # User input
    user_query = {"image_path": image_path}
    print("User Input:", user_query)

    content = types.Content(role="user", parts=[types.Part(text=str(user_query))])

    async for event in runner.run_async(user_id=USER_ID, session_id=SESSION_ID, new_message=content):
        if event.is_final_response():
            final_response = event.content.parts[0].text
            print("Agent Response:", final_response)

if __name__ == "__main__":
    asyncio.run(main())