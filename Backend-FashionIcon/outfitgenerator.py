"""
Outfit Generator — AI Fashion Assistant
---------------------------------------
Input:  Event, Weather, Mood
Output:  Full outfit recommendation (top, bottom, shoes, accessories, and style note)
"""

import random
import fastapi

def generate_outfit(event, weather, mood):
    if "dinner" in event.lower():
        return f"For {event} in {weather}, try a cute top with jeans and ankle boots! Mood: {mood}"
    else:
        return f"{event.capitalize()} day? Go with comfy sneakers and layers."

event = input("What's the event? ")
weather = input("What's the weather like? ")
mood = input("What's your mood? ")

print(generate_outfit(event, weather, mood))
