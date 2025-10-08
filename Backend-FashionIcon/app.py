# app.py — Backend for Fashion Icon Assistant
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random

# Initialize FastAPI app
app = FastAPI(
    title="Fashion Icon Assistant API",
    description="A backend service that generates outfit recommendations based on event, weather, and mood.",
    version="1.0.0",
)

# Allow your frontend to access the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, specify your frontend domain instead of '*'
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request model
class OutfitRequest(BaseModel):
    event: str
    weather: str
    mood: str

# Some sample items — can be replaced later with AI or a database
tops = ["white blouse", "crop top", "denim jacket", "graphic tee", "silk cami"]
bottoms = ["jeans", "flowy skirt", "cargo pants", "black trousers", "shorts"]
shoes = ["heels", "sneakers", "boots", "sandals", "loafers"]
accessories = ["gold necklace", "silver hoops", "tote bag", "sunglasses", "watch"]

@app.get("/")
def root():
    return {"message": "Welcome to the Fashion Icon Assistant API 👗"}

@app.post("/generate-outfit")
def generate_outfit(req: OutfitRequest):
    """
    Generate a simple outfit suggestion based on user input.
    """
    top = random.choice(tops)
    bottom = random.choice(bottoms)
    shoe = random.choice(shoes)
    accessory = random.choice(accessories)

    outfit = (
        f"For {req.event} on a {req.weather} day with a {req.mood} vibe, "
        f"try pairing a {top} with {bottom}, "
        f"complete the look with {shoe} and {accessory}. ✨"
    )

    return {"outfit": outfit}
