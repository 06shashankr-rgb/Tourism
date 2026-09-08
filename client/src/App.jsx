import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Destinations from "./pages/Destinations";
import TouristPlaces from "./pages/TouristPlaces";
import PlaceDetails from "./pages/PlaceDetails";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import Booking from "./pages/Booking";
import BookingConfirmation from "./pages/BookingConfirmation";
import AIChat from "./pages/AIChat";
import TripPlanner from "./pages/TripPlanner";
import MyBookings from "./pages/MyBookings";
import Profile from "./pages/Profile";

function App() {
  return (
    <Routes>

      {/* Authentication */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Main Website */}
      <Route path="/home" element={<Home />} />
      <Route path="/destinations" element={<Destinations />} />

      {/* Tourist Places */}
      <Route path="/places" element={<TouristPlaces />} />
      <Route path="/place/:id" element={<PlaceDetails />} />

      {/* Events */}
      <Route path="/events" element={<Events />} />
      <Route path="/event/:id" element={<EventDetails />} />

      {/* Booking */}
      <Route path="/booking" element={<Booking />} />
      <Route
        path="/booking-confirmation"
        element={<BookingConfirmation />}
      />

      {/* AI */}
      <Route path="/ai-assistant" element={<AIChat />} />

      {/* Other */}
      <Route path="/trip-planner" element={<TripPlanner />} />
      <Route path="/my-bookings" element={<MyBookings />} />
      <Route path="/profile" element={<Profile />} />

      {/* Unknown URL */}
      <Route path="*" element={<Navigate to="/login" />} />

    </Routes>
  );
}

export default App;