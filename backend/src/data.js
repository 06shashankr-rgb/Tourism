export const seedPlaces = [
  { id: 1, name: "Mysore Palace", category: "Heritage", lat: 12.3052, lng: 76.6552, rating: 4.8, price: 100, imageUrl: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=85", description: "Historic palace and major Mysuru attraction." },
  { id: 2, name: "Chamundi Hill", category: "Nature", lat: 12.2746, lng: 76.6737, rating: 4.7, price: 0, imageUrl: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=85", description: "Scenic hill with panoramic views and temple." },
  { id: 3, name: "Brindavan Gardens", category: "Garden", lat: 12.4244, lng: 76.5722, rating: 4.6, price: 50, imageUrl: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=85", description: "Landscaped gardens and evening fountains." },
  { id: 4, name: "St. Philomena's Cathedral", category: "Heritage", lat: 12.3176, lng: 76.6497, rating: 4.6, price: 0, imageUrl: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=85", description: "Prominent neo-Gothic cathedral in Mysuru." },
  { id: 5, name: "Karanji Lake", category: "Nature", lat: 12.2994, lng: 76.6695, rating: 4.5, price: 30, imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85", description: "Lake, bird watching and nature trails." },
  { id: 6, name: "Mysuru Railway Museum", category: "Museum", lat: 12.3182, lng: 76.6424, rating: 4.4, price: 50, imageUrl: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=85", description: "Railway heritage museum with historic coaches." }
];

export const seedEvents = [
  { id: 101, placeId: 1, name: "Mysuru Events & Shows", venue: "Mysore Palace area", lat: 12.3052, lng: 76.6552, price: 150, seats: 120, source: "BookMyShow", sourceUrl: "https://in.bookmyshow.com/explore/events-mysuru-mysore", date: "Check live listing", time: "Varies", description: "Live event listings around Mysuru." },
  { id: 102, placeId: 2, name: "Chamundi Hill Events", venue: "Chamundi Hill area", lat: 12.2746, lng: 76.6737, price: 250, seats: 25, source: "AllEvents", sourceUrl: "https://allevents.in/mysore", date: "Check live listing", time: "Varies", description: "Current events and activities around Mysuru." },
  { id: 103, placeId: 4, name: "Mysuru Heritage Events", venue: "Mysuru heritage area", lat: 12.3176, lng: 76.6497, price: 100, seats: 200, source: "AllEvents", sourceUrl: "https://allevents.in/mysore", date: "Check live listing", time: "Varies", description: "Local heritage and cultural event listings." }
];
