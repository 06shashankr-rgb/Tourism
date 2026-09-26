import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getWeather, searchCity, weatherDescription } from "./weatherApi";

export default function WeatherPage({ location, startGps }) {
  const [coords, setCoords] = useState({ lat: location.lat, lon: location.lng });
  const [placeName, setPlaceName] = useState(location.label || "Your location");
  const [data, setData] = useState(null);
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (lat, lon, label) => {
    setLoading(true);
    setError("");
    try {
      const result = await getWeather(lat, lon);
      setData(result);
      setCoords({ lat, lon });
      if (label) setPlaceName(label);
    } catch (e) {
      setError(e.message || "Could not load weather.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(location.lat, location.lng, location.label || "Your location");
  }, [location.lat, location.lng, location.label, load]);

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      p => load(p.coords.latitude, p.coords.longitude, "Your current location"),
      () => setError("Location permission was denied.")
    );
    if (startGps) startGps();
  }

  async function handleCity(e) {
    e.preventDefault();
    if (!city.trim()) return;
    try {
      const result = await searchCity(city.trim());
      await load(result.latitude, result.longitude, [result.name, result.admin1, result.country].filter(Boolean).join(", "));
      setCity("");
    } catch (e) {
      setError(e.message || "City search failed.");
    }
  }

  const current = data?.current;
  const daily = data?.daily;
  const hourly = data?.hourly;

  const hourlyItems = useMemo(() => {
    if (!hourly) return [];
    const nowIndex = Math.max(0, hourly.time.findIndex(t => new Date(t) >= new Date()));
    const start = nowIndex >= 0 ? nowIndex : 0;
    return hourly.time.slice(start, start + 12).map((time, i) => {
      const index = start + i;
      return {
        time,
        temp: Math.round(hourly.temperature_2m[index]),
        rain: hourly.precipitation_probability[index] ?? 0,
        code: hourly.weather_code[index],
      };
    });
  }, [hourly]);

  if (loading) return <main className="page"><small>WEATHER</small><h2>Loading weather…</h2><div className="empty">Getting the latest forecast for {placeName}.</div></main>;

  return <main className="page weather-page">
    <div className="weather-heading">
      <div><small>SKYCAST WEATHER • TRAVEL PLANNING</small><h2>Weather for {placeName}</h2><p className="weather-coords">{coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}</p></div>
      <button onClick={useCurrentLocation}>📍 Use my location</button>
    </div>

    <form className="weather-search" onSubmit={handleCity}>
      <input value={city} onChange={e => setCity(e.target.value)} placeholder="Search a city…" />
      <button type="submit">Search</button>
    </form>

    {error && <div className="weather-error">{error}</div>}

    {current && <section className="weather-grid">
      <article className="weather-current">
        <div><span className="weather-icon">{weatherDescription(current.weather_code)[1]}</span><div><h3>{Math.round(current.temperature_2m)}°C</h3><p>{weatherDescription(current.weather_code)[0]}</p></div></div>
        <div className="weather-stats">
          <span>Feels like <b>{Math.round(current.apparent_temperature)}°C</b></span>
          <span>Humidity <b>{current.relative_humidity_2m}%</b></span>
          <span>Wind <b>{Math.round(current.wind_speed_10m)} km/h</b></span>
          <span>UV <b>{current.uv_index ?? "—"}</b></span>
        </div>
      </article>

      <article className="weather-card">
        <h3>Next 12 hours</h3>
        <div className="hourly-row">{hourlyItems.map((h, i) => <div className="hour" key={h.time}><b>{i === 0 ? "Now" : new Date(h.time).toLocaleTimeString([], {hour:"numeric"})}</b><span>{weatherDescription(h.code)[1]}</span><strong>{h.temp}°</strong><small>🌧 {h.rain}%</small></div>)}</div>
      </article>

      <article className="weather-card">
        <h3>7-day forecast</h3>
        <div className="daily-list">{daily.time.map((date, i) => <div className="daily-row" key={date}><b>{i === 0 ? "Today" : new Date(date + "T12:00:00").toLocaleDateString([], {weekday:"short"})}</b><span>{weatherDescription(daily.weather_code[i])[1]} {weatherDescription(daily.weather_code[i])[0]}</span><span>🌧 {daily.precipitation_probability_max[i] ?? 0}%</span><strong>{Math.round(daily.temperature_2m_min[i])}° / {Math.round(daily.temperature_2m_max[i])}°</strong></div>)}</div>
      </article>

      <article className="weather-card travel-tip">
        <h3>🧭 TravelMate weather tip</h3>
        <p>{current.precipitation > 0 || (daily.precipitation_probability_max?.[0] ?? 0) >= 50
          ? "Rain is possible today. Consider carrying an umbrella and check the event details before travelling."
          : current.uv_index >= 6
          ? "UV levels may be strong. Plan outdoor sightseeing with shade, water and sun protection."
          : "Conditions look suitable for sightseeing. Check nearby places and events in TravelMate to build your itinerary."}</p>
      </article>
    </section>}
  </main>;
}
