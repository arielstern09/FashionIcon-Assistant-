import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import openai 
import requests 
import uuid 
from typing import Optional, Dict, Any

# Load environment variables from .env file
load_dotenv() 

# --- API Key Setup ---
api_key = os.getenv("OPENAI_API_KEY") 
MEMMACHINE_API_BASE = os.getenv("MEMMACHINE_API_BASE", "http://0.0.0.0:8080") 

# --- Test IDs ---
FASHION_USER_ID = "profile_user_001" 
ASSISTANT_AGENT_ID = ["fashion-stylist-gemini"]
FASHION_GROUP_ID = "fashion-group-01"

# Initialize FastAPI app
app = FastAPI(
    title="Fashion Icon Assistant API",
    description="A backend service that generates outfit recommendations and logs them to MemMachine.",
    version="1.0.0",
)

# CORS Configuration - Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request models
class OutfitRequest(BaseModel):
    event: str
    weather: str
    mood: str

class MemorySearchRequest(BaseModel):
    session: Dict[str, Any]
    query: str
    limit: Optional[int] = 20
    filter: Optional[Dict[str, Any]] = {}

# Initialize the OpenAI Client
try:
    if not api_key:
        raise ValueError("API Key not found in environment. Please set OPENAI_API_KEY.")
    client = openai.OpenAI(api_key=api_key)
except Exception as e:
    print(f"Failed to initialize OpenAI Client: {e}")
    client = None

# --- Memory Logging Helper Function ---
def log_to_memmachine(user_id: str, request_data: OutfitRequest, outfit_response: str):
    """Logs the user query and AI response to the MemMachine API as a memory episode."""
    episode_content = (
        f"USER REQUEST (Outfit): Event: {request_data.event}, "
        f"Weather: {request_data.weather}, Mood: {request_data.mood}\n"
        f"AI RESPONSE:\n{outfit_response}"
    )

    session_data = {
        "group_id": FASHION_GROUP_ID,
        "agent_id": ASSISTANT_AGENT_ID,
        "user_id": [user_id],
        "session_id": str(uuid.uuid4())
    }

    payload = {
        "session": session_data,
        "producer": user_id, 
        "produced_for": ASSISTANT_AGENT_ID[0],
        "episode_content": episode_content,
        "episode_type": "OUTFIT_GENERATION_INTERACTION",
        "metadata": {
             "user_inputs": request_data.model_dump(),
             "api_call": "generate-outfit-endpoint"
        },
    }
    
    headers = {"Content-Type": "application/json"}
    log_url = f"{MEMMACHINE_API_BASE}/v1/memories" 

    try:
        response = requests.post(log_url, headers=headers, json=payload, timeout=5)
        response.raise_for_status()
        print(f"Successfully logged memory for user {user_id} to {log_url}")
    except requests.exceptions.RequestException as e:
        print(f"Error logging to MemMachine at {log_url}. Error: {e}")

# --- Memory Retrieval Helper Function ---
def retrieve_memories(user_id: str, query: str) -> str:
    """Retrieves relevant profile memories for the given user and query."""
    session_data = {
        "group_id": FASHION_GROUP_ID,
        "agent_id": ASSISTANT_AGENT_ID,
        "user_id": [user_id],
        "session_id": str(uuid.uuid4()) 
    }

    payload = {
        "session": session_data,
        "query": query,
        "limit": 5
    }

    headers = {"Content-Type": "application/json"}
    search_url = f"{MEMMACHINE_API_BASE}/v1/memories/search"

    try:
        response = requests.post(search_url, headers=headers, json=payload, timeout=5)
        response.raise_for_status()
        
        search_result = response.json()
        profile_memories = search_result.get("content", {}).get("profile_memory", [])
        
        if not profile_memories:
            return ""

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

@app.get("/")
def root():
    return {"message": "Welcome to the Fashion Icon Assistant API 👗"}

# --- NEW: Proxy endpoint for memory search with proper CORS ---
@app.post("/api/memories/search")
def search_memories_proxy(request: MemorySearchRequest):
    """
    Proxy endpoint to forward memory search requests to MemMachine.
    This handles CORS properly for frontend requests.
    """
    headers = {"Content-Type": "application/json"}
    search_url = f"{MEMMACHINE_API_BASE}/v1/memories/search"

    try:
        response = requests.post(
            search_url, 
            headers=headers, 
            json=request.model_dump(), 
            timeout=10
        )
        response.raise_for_status()
        result = response.json()
        
        # DEBUG: Print what we're getting from MemMachine
        print(f"MemMachine search response: {result}")
        
        return result
    except requests.exceptions.RequestException as e:
        print(f"Error proxying search to MemMachine: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to search memories: {str(e)}"
        )

@app.post("/generate-outfit")
def generate_outfit(req: OutfitRequest):
    """
    Generate an AI-powered outfit suggestion and log the interaction to MemMachine.
    """
    if not client:
        raise HTTPException(
            status_code=500, 
            detail="AI client is not initialized. Check server logs for API key errors."
        )

    memory_context = retrieve_memories(
        user_id=FASHION_USER_ID, 
        query=f"Outfit for {req.event}, {req.weather}, and {req.mood}."
    )
    
    system_instruction = f"""
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

    user_prompt = (
        f"Generate a single, complete outfit for the following scenario: "
        f"Event: {req.event}, "
        f"Weather: {req.weather}, "
        f"Mood/Style: {req.mood}."
    )

    try:
        response = client.chat.completions.create(
            model='gpt-4o-mini-2024-07-18',
            messages=[
                {"role": "system", "content": system_instruction.strip()},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.8,
            max_tokens=300
        )

        outfit = response.choices[0].message.content.strip()
        log_to_memmachine(FASHION_USER_ID, req, outfit) 
        
        return {"outfit": outfit}

    except openai.APIError as e:
        print(f"OpenAI API Error: {e}")
        raise HTTPException(status_code=500, detail="AI Service Error. Check API key/permissions.")
    except Exception as e:
        print(f"Error during AI generation: {e}")
        raise HTTPException(status_code=500, detail="A general error occurred during outfit generation.")