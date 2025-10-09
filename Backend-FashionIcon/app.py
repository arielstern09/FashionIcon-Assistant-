# app.py — Backend for Fashion Icon Assistant
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
# --- UPDATED: Using OpenAI SDK ---
import openai
from openai import OpenAI
# --- END UPDATED IMPORTS ---

# Load environment variables from .env file
load_dotenv() 

# ⚠️ Retrieve the API key from environment variables
# This will use the value of OPENAI_API_KEY from your .env file
api_key = os.getenv("OPENAI_API_KEY") 

# Initialize FastAPI app
app = FastAPI(
    title="Fashion Icon Assistant API",
    description="A backend service that generates outfit recommendations based on event, weather, and mood.",
    version="1.0.0",
)

# Allow your frontend to access the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request model
class OutfitRequest(BaseModel):
    event: str
    weather: str
    mood: str

# Initialize the OpenAI Client outside of the request handler for efficiency
try:
    if not api_key:
        raise ValueError("API Key not found in environment. Please set OPENAI_API_KEY.")
    
    # Initialize the client using the api_key
    client = OpenAI(api_key=api_key)
    
except Exception as e:
    print(f"Failed to initialize OpenAI Client: {e}")
    # Setting client to None allows the server to start, but API calls will fail gracefully
    client = None

@app.get("/")
def root():
    return {"message": "Welcome to the Fashion Icon Assistant API 👗"}

@app.post("/generate-outfit")
def generate_outfit(req: OutfitRequest):
    """
    Generate an AI-powered outfit suggestion based on user input using OpenAI.
    """
    if not client:
        return {"outfit": "Error: AI client is not initialized. Check server logs for API key errors."}

    # 1. Define the AI persona (System Instruction)
    system_instruction = (
        "You are a helpful, creative, and professional fashion stylist. "
        "Your response must be a single, complete outfit recommendation (top, bottom, shoes, accessory) "
        "tailored specifically to the user's request. Do not include commentary or list options."
    )

    # 2. Construct the detailed user prompt
    user_prompt = (
        f"Generate a single, complete outfit for the following scenario: "
        f"Event: {req.event}, "
        f"Weather: {req.weather}, "
        f"Mood/Style: {req.mood}."
    )

    try:
        # 3. Call the OpenAI Chat Completions API
        response = client.chat.completions.create(
            model='gpt-4.1-mini-2025-04-14', # A reliable, cost-effective model for this task
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.8,
            max_tokens=200 # Limit output length for a concise response
        )

        # 4. Extract and return the AI-generated text
        # Use .choices[0].message.content for the OpenAI response structure
        outfit = response.choices[0].message.content.strip()
        
        return {"outfit": outfit}

    except openai.APIError as e:
        print(f"OpenAI API Error: {e}")
        return {"outfit": "Sorry, the AI service returned an error. Please check your API key and permissions."}
    except Exception as e:
        print(f"Error during AI generation: {e}")
        return {"outfit": "Sorry, I ran into a general issue generating that outfit. Please try a different request."}
