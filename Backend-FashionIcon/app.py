import os
import time
import requests
import openai
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

# --- Configuration ---
MEMMACHINE_API_BASE = os.getenv("MEMMACHINE_API_BASE", "http://localhost:8081") 
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# --- App Initialization ---
app = FastAPI(title="Fashion Icon AI Backend")
# Initialize the OpenAI client
openai_client = openai.OpenAI(api_key=OPENAI_API_KEY)


# --- Pydantic Models for API Requests/Responses ---

class OutfitRequest(BaseModel):
    event: str
    weather: str
    mood: str
    # Add optional fields for better context if needed
    user_context: Optional[str] = None

# Pydantic Model for MemMachine API Call (Search)
class SessionPayload(BaseModel):
    group_id: str = "fashion-app"
    agent_id: List[str] = ["fastapi-stylist"]
    user_id: List[str] = ["profile_user_001"] # Hardcoding a user ID for consistency
    session_id: str = "fastapi-session"

class SearchQuery(BaseModel):
    session: SessionPayload
    query: str
    filter: Dict[str, Any] = {}
    limit: int = 3
    
# Pydantic Model for MemMachine API Call (Log)
class LogPayload(BaseModel):
    session: SessionPayload
    producer: str = "fastapi-stylist"
    produced_for: str = "AI_Fashion_System"
    episode_content: str
    episode_type: str = "outfit_request"
    metadata: Dict[str, Any] = {}

# --- MemMachine Interaction Functions ---

def log_to_memmachine(content: str):
    """Logs the user's request and AI response to the MemMachine server."""
    if not MEMMACHINE_API_BASE:
        print("Warning: MEMMACHINE_API_BASE is not set. Skipping memory logging.")
        return

    payload = LogPayload(episode_content=content, 
                         session=SessionPayload()).model_dump(by_alias=True)
    
    # NOTE: API key handling removed as per user request to simplify.
    headers = {'Content-Type': 'application/json'}
    
    try:
        response = requests.post(f"{MEMMACHINE_API_BASE}/v1/memories", json=payload, headers=headers)
        response.raise_for_status()
        print(f"Successfully logged memory for user {payload['session']['user_id'][0]} to {MEMMACHINE_API_BASE}/v1/memories")
    except requests.exceptions.RequestException as e:
        print(f"Error logging to MemMachine at {MEMMACHINE_API_BASE}/v1/memories. Check server status. Error: {e}")
        # Continue execution even if logging fails

def retrieve_memories(query: str) -> str:
    """Retrieves relevant memory fragments from the MemMachine server."""
    if not MEMMACHINE_API_BASE:
        print("Warning: MEMMACHINE_API_BASE is not set. Skipping memory retrieval.")
        return ""

    payload = SearchQuery(query=query, 
                          session=SessionPayload()).model_dump(by_alias=True)

    # NOTE: API key handling removed as per user request to simplify.
    headers = {'Content-Type': 'application/json'}
    
    try:
        response = requests.post(f"{MEMMACHINE_API_BASE}/v1/memories/search", json=payload, headers=headers)
        response.raise_for_status()
        
        memories = response.json().get('memories', [])
        
        if not memories:
            return "No previous style memories found for this user."

        # Format retrieved memories into a concise context string for the AI
        context_lines = ["--- PROFILE MEMORY CONTEXT ---"]
        for mem in memories:
            # Assuming 'episode_content' holds the relevant text (user query or AI response)
            content = mem.get('episode_content', 'N/A')
            context_lines.append(f"PAST INTERACTION: {content}")
        context_lines.append("-----------------------------")
        
        return "\n".join(context_lines)

    except requests.exceptions.RequestException as e:
        print(f"Error retrieving memory from MemMachine at {MEMMACHINE_API_BASE}/v1/memories/search. Error: {e}")
        return "Note to Stylist: Memory retrieval failed. Proceed with current inputs only."

# --- API Endpoint ---

@app.post("/generate-outfit")
async def generate_outfit(request: OutfitRequest):
    """
    Generates a personalized outfit suggestion based on user inputs and memory context.
    """
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured.")

    # 1. Prepare user input for memory search and AI prompt
    user_query = f"Event: {request.event}, Weather: {request.weather}, Mood: {request.mood}."
    if request.user_context:
        user_query += f" Additional Context: {request.user_context}"

    # 2. Retrieve memory context
    memory_context = retrieve_memories(user_query)

    # 3. Construct the comprehensive System Instruction for the LLM
    system_instruction = (
        f"""
        {memory_context}
        You are a world-class, insightful personal fashion stylist. Your goal is to provide a single, 
        personalized outfit recommendation and style summary.
        
        Instructions for Output Structure:
        1. Base your recommendation on the user's input and the provided PROFILE MEMORY CONTEXT (if available).
        2. The entire response must be formatted using clear markdown headings.
        3. The output MUST strictly contain only these three sections, in this order:
           - ## Style Vibe (A concise, 1-sentence descriptor of the look).
           - ## Recommended Outfit (A structured markdown list of - **Top:**, - **Bottom:**, - **Shoes:**, and - **Accessories:**).
           - ## Stylist's Note (A quick, professional tip related to the outfit or user's style).
        4. DO NOT include any introductory or concluding text outside of these three headings.
        """
    )
    
    print(f"--- Sending to AI (Context included: {bool(memory_context)}) ---")
    
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": f"Generate an outfit for: {user_query}"}
            ],
            temperature=0.7
        )

        outfit_text = response.choices[0].message.content
        
        # 4. Log the complete interaction to MemMachine
        full_interaction = f"""
        USER REQUEST: {user_query}
        AI RESPONSE: {outfit_text}
        """
        log_to_memmachine(full_interaction)

        return {"outfit": outfit_text}

    except openai.APIError as e:
        print(f"OpenAI API Error: {e}")
        raise HTTPException(status_code=500, detail="AI Service Error. Check API key/permissions.")
    except Exception as e:
        print(f"Error during AI generation: {e}")
        raise HTTPException(status_code=500, detail="A general error occurred during outfit generation.")
