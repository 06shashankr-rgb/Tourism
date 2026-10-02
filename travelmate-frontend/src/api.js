const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const token = localStorage.getItem("tmToken");
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || "Request failed.");
  return body;
}

export const api = {
  signup: (payload) => request("/auth/signup", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) => request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  me: () => request("/auth/me"),
  places: ({ lat, lng, radius = 200 } = {}) => request(`/places?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&radius=${radius}`),
  events: ({ lat, lng, radius = 200 } = {}) => request(`/events?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&radius=${radius}`),
  planner: () => request("/planner"),
  addPlanner: (item, type) => request("/planner", { method: "POST", body: JSON.stringify({ item, type }) }),
  removePlanner: (type, itemId) => request(`/planner/${encodeURIComponent(type)}/${encodeURIComponent(itemId)}`, { method: "DELETE" }),
  bookings: () => request("/bookings"),
  createBooking: (payload) => request("/bookings", { method: "POST", body: JSON.stringify(payload) }),
  assistant: (question, location) => request("/assistant", {
    method: "POST",
    body: JSON.stringify({ question, lat: location?.lat, lng: location?.lng })
  })
};