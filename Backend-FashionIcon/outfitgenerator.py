"""
Outfit Generator — AI Fashion Assistant
---------------------------------------
Input:  Event, Weather, Mood
Output:  Full outfit recommendation (top, bottom, shoes, accessories, and style note)
"""

import random

def generate_outfit(event, weather, mood):
    """
    Suggests an outfit based on event, weather, and mood.
    You can expand this with wardrobe data or API calls to fashion sites.
    """

    # Define basic categories
    tops = {
        "warm": ["light blouse", "flowy top", "short-sleeve crop tee"],
        "cool": ["cozy sweater", "long-sleeve turtleneck", "denim jacket over a tee"],
    }

    bottoms = {
        "warm": ["high-waisted shorts", "midi skirt", "linen pants"],
        "cool": ["jeans", "leather pants", "maxi skirt"],
    }

    shoes = {
        "casual": ["white sneakers", "ankle boots", "cute flats"],
        "dressy": ["block heels", "strappy sandals", "loafers"],
    }

    accessories = [
        "gold hoops",
        "tote bag",
        "crossbody purse",
        "statement necklace",
        "stacked rings",
    ]

    # Pick based on weather
    temp_type = "warm" if float(weather.replace("°F", "")) > 68 else "cool"

    # Outfit assembly
    outfit_top = random.choice(tops[temp_type])
    outfit_bottom = random.choice(bottoms[temp_type])

    outfit_shoes = random.choice(
        shoes["casual" if "casual" in mood.lower() else "dressy"]
    )
    outfit_accessory = random.choice(accessories)

    # Generate personalized advice
    style_note = (
        f"For a {event.lower()} when it's around {weather}, "
        f"go for a {outfit_top} with {outfit_bottom}, "
        f"pair it with {outfit_shoes}, and add {outfit_accessory} to complete the look. "
        f"Since you’re feeling {mood.lower()}, "
        f"try adding your personal touch—maybe a pop of color or bold makeup!"
    )

    return style_note


if __name__ == "__main__":
    print("👗 Welcome to the Outfit Generator!")
    event = input("Event (e.g., dinner with friends, work meeting): ")
    weather = input("Weather (e.g., 70°F): ")
    mood = input("Mood (e.g., casual, confident, flirty): ")

    print("\n✨ Generating your outfit...\n")
    recommendation = generate_outfit(event, weather, mood)
    print("💡 Outfit Suggestion:\n")
    print(recommendation)
