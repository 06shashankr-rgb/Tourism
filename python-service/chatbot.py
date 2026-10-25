"""Rule-based TravelMate chatbot logic; no cloud AI key is required."""

def answer_question(message: str, location: str = "Mysuru") -> str:
    text = message.casefold()
    if any(w in text for w in ("hello", "hi", "hey", "namaste")):
        return f"Hello! Welcome to TravelMate. I can help you explore {location}, discover attractions, plan a trip, and find events. What would you like to do?"
    if any(w in text for w in ("place", "attraction", "visit", "sightseeing", "tourist", "nearby")):
        return f"Popular places to research in {location} include Mysuru Palace, Chamundi Hill, St. Philomena's Cathedral, Karanji Lake, and Brindavan Gardens. Check current opening hours and travel details before visiting."
    if any(w in text for w in ("food", "restaurant", "eat", "cuisine")):
        return f"To explore food in {location}, compare nearby restaurants by distance, opening hours, reviews, and dietary options. TravelMate's Places section can show available place records."
    if any(w in text for w in ("hotel", "stay", "accommodation", "lodging")):
        return f"Compare accommodation in {location} by budget, location, guest reviews, and cancellation policy. Confirm availability directly with the provider before booking."
    if any(w in text for w in ("event", "festival", "concert", "show")):
        return f"Check TravelMate's Events section for listed events in or near {location}. Event dates and ticket availability can change, so confirm details with the official organiser."
    if any(w in text for w in ("plan", "itinerary", "trip", "day")):
        return "For a simple itinerary, group nearby attractions together, check opening times, leave time for travel and meals, and keep one flexible slot. Tell me your trip length, budget, and interests for a more tailored outline."
    if any(w in text for w in ("book", "booking", "ticket")):
        return "Open the Events section, choose an event, and follow its booking instructions. Check the provider, ticket terms, date, and total price before confirming any purchase."
    if any(w in text for w in ("translate", "language", "kannada", "hindi")):
        return "TravelMate includes prepared interface translations. For translating new sentences offline, start the optional IndicTrans2 setup described in python-service/README.md."
    return "I can help with tourist attractions, restaurants, accommodation, local events, bookings, and trip planning. Tell me your destination and what you are looking for."
