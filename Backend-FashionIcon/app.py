import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import openai # Corrected import to get access to openai.APIError
import requests 
import uuid # Needed to generate a unique session ID for MemMachine
import requests

# Load environment variables from .env file
load_dotenv() 

# --- API Key Setup ---
api_key = os.getenv("OPENAI_API_KEY") 
# We are removing the explicit MemMachine API Key requirement to simplify testing.
MEMMACHINE_API_BASE = os.getenv("MEMMACHINE_API_BASE", "http://localhost:8081") # Base URL for your MemMachine instance

# --- Test IDs (Replace with your own user/agent IDs in production) ---
FASHION_USER_ID = "profile_user_001" 
ASSISTANT_AGENT_ID = ["fashion-stylist-gemini"]
FASHION_GROUP_ID = "fashion-group-01"

# Initialize FastAPI app
app = FastAPI(
    title="Fashion Icon Assistant API",
    description="A backend service that generates outfit recommendations and logs them to MemMachine.",
    version="1.0.0",
)

# Allow your frontend to access the backend (using a wildcard for testing)
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request model
class OutfitRequest(BaseModel):
    event: str
    weather: str
    mood: str

# Initialize the OpenAI Client
try:
    if not api_key:
        raise ValueError("API Key not found in environment. Please set OPENAI_API_KEY.")
    # Client initialization now uses the imported openai module
    client = openai.OpenAI(api_key=api_key)
except Exception as e:
    print(f"Failed to initialize OpenAI Client: {e}")
    client = None

# --- Memory Logging Helper Function ---

def log_to_memmachine(user_id: str, request_data: OutfitRequest, outfit_response: str):
    """Logs the user query and AI response to the MemMachine API as a memory episode."""
    # Note: Authorization is removed to simplify testing, assuming a permissive environment.

    # 1. Construct the memory episode content (Combines input and output)
    episode_content = (
        f"USER REQUEST (Outfit): Event: {request_data.event}, "
        f"Weather: {request_data.weather}, Mood: {request_data.mood}\n"
        f"AI RESPONSE:\n{outfit_response}"
    )

    # 2. Build the nested SessionData structure required by MemMachine
    session_data = {
        "group_id": FASHION_GROUP_ID,
        "agent_id": ASSISTANT_AGENT_ID,
        "user_id": [user_id], # User IDs must be a list
        "session_id": str(uuid.uuid4()) # Unique session ID per interaction
    }

    # 3. MemMachine API payload structure (conforms to the NewEpisode model)
    payload = {
        "session": session_data,
        "producer": user_id, 
        "produced_for": ASSISTANT_AGENT_ID[0], # The first agent in the list
        "episode_content": episode_content,
        "episode_type": "OUTFIT_GENERATION_INTERACTION",
        "metadata": {
             "user_inputs": request_data.model_dump(),
             "api_call": "generate-outfit-endpoint"
        },
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    # 4. Send the request to the correct MemMachine memory logging endpoint
    log_url = f"{MEMMACHINE_API_BASE}/v1/memories" 

    try:
        response = requests.post(log_url, headers=headers, json=payload, timeout=5)
        response.raise_for_status()
        # Log successful memory ingestion
        print(f"Successfully logged memory for user {user_id} to {log_url}")
    except requests.exceptions.RequestException as e:
        print(f"Error logging to MemMachine at {log_url}. Check server status and API key. Error: {e}")

# --- Memory Retrieval Helper Function ---

def retrieve_memories(user_id: str, query: str) -> str:
    """Retrieves relevant profile memories for the given user and query."""
    # Note: Authorization is removed to simplify testing, assuming a permissive environment.
    
    # 1. Build the nested SessionData structure required by MemMachine for search
    session_data = {
        "group_id": FASHION_GROUP_ID,
        "agent_id": ASSISTANT_AGENT_ID,
        "user_id": [user_id],
        "session_id": str(uuid.uuid4()) 
    }

    # 2. MemMachine API payload structure (conforms to the SearchQuery model)
    payload = {
        "session": session_data,
        "query": query,
        "limit": 5 # Limit to 5 most relevant memories
    }

    headers = {
        "Content-Type": "application/json"
    }

    search_url = f"{MEMMACHINE_API_BASE}/v1/memories/search"

    try:
        response = requests.post(search_url, headers=headers, json=payload, timeout=5)
        response.raise_for_status()
        
        # Parse the MemMachine response content
        search_result = response.json()
        
        # Extract the profile memory results
        profile_memories = search_result.get("content", {}).get("profile_memory", [])
        
        if not profile_memories:
            return ""

        # Format the memory content for the LLM prompt
        formatted_memories = "\n".join([
            f"- Memory ID: {m.get('mem_id', 'N/A')}\n  Content: {m.get('content', 'No content found')}"
            for m in profile_memories
        ])
        
        return f"""
The user's prior interactions and style preferences (Profile Memory) are below. 
USE THIS INFORMATION to tailor your recommendation and refine the **Style Vibe**.

--- PROFILE MEMORY CONTEXT ---
{formatted_memories}
--- END PROFILE MEMORY CONTEXT ---
"""
    except requests.exceptions.RequestException as e:
        print(f"Error retrieving memory from MemMachine at {search_url}. Error: {e}")
        return ""

# --- End Memory Retrieval Helper ---

@app.get("/")
def root():
    return {"message": "Welcome to the Fashion Icon Assistant API 👗"}

@app.post("/generate-outfit")
def generate_outfit(req: OutfitRequest):
    """
    Generate an AI-powered outfit suggestion and log the interaction to MemMachine.
    """
    if not client:
        raise HTTPException(status_code=500, detail="AI client is not initialized. Check server logs for API key errors.")

    # 1. Retrieve the user's profile memory context related to the current request
    # The current request (event, weather, mood) is the query.
    memory_context = retrieve_memories(
        user_id=FASHION_USER_ID, 
        query=f"Outfit for {req.event}, {req.weather}, and {req.mood}."
    )
    
    # 2. Define the AI persona (System Instruction)
    system_instruction = (
        f"""
        {memory_context}
        You are a world-class, insightful personal fashion stylist. Your goal is to provide a single, 
        personalized outfit recommendation and style summary.
        
        Instructions for Output Structure:
        1. Base your recommendation on the user's input and the provided PROFILE MEMORY CONTEXT (if available).
        2. The entire response must be formatted using **clear markdown headings**.
        3. The output MUST strictly contain only these three sections, in this order:
           - **Style Vibe (A concise, 1-sentence descriptor of the look).**
           - **Recommended Outfit (A structured markdown list of Top, Bottom, Shoes, and Accessories).**
           - **Stylist's Note (A quick, professional tip related to the outfit or user's style).**
        4. DO NOT include any introductory or concluding text outside of these three headings.
        """
    )


    # 3. Construct the detailed user prompt
    user_prompt = (
        f"Generate a single, complete outfit for the following scenario: "
        f"Event: {req.event}, "
        f"Weather: {req.weather}, "
        f"Mood/Style: {req.mood}."
    )

    try:
        # 4. Call the OpenAI Chat Completions API
        response = client.chat.completions.create(
            model='gpt-4o-mini-2024-07-18',
            messages=[
                {"role": "system", "content": system_instruction.strip()},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.8,
            max_tokens=300
        )

        # 5. Extract the AI-generated text
        outfit = response.choices[0].message.content.strip()
        
        # 6. Log the interaction to MemMachine (using the hardcoded test user ID)
        log_to_memmachine(FASHION_USER_ID, req, outfit) 
        
        return {"outfit": outfit}

    except openai.APIError as e:
        print(f"OpenAI API Error: {e}")
        raise HTTPException(status_code=500, detail="AI Service Error. Check API key/permissions.")
    except Exception as e:
        print(f"Error during AI generation: {e}")
        raise HTTPException(status_code=500, detail="A general error occurred during outfit generation.")
