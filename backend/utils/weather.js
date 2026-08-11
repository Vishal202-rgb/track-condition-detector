import axios from "axios";

// Default coordinates: SilverStone Circuit (UK) - Lat: 52.0786, Lon: -1.0169
const DEFAULT_LAT = 52.0786;
const DEFAULT_LON = -1.0169;

export async function fetchTrackWeather(lat = DEFAULT_LAT, lon = DEFAULT_LON) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;
    const { data } = await axios.get(url, { timeout: 3000 });
    
    if (data && data.current) {
      const { temperature_2m, relative_humidity_2m, wind_speed_10m } = data.current;
      return `Auto-Fetch: ${temperature_2m}°C Ambient, Humidity ${relative_humidity_2m}%, Wind ${wind_speed_10m} km/h`;
    }
  } catch (err) {
    console.warn("Weather API auto-fetch failed, using fallback:", err.message);
  }
  return "Auto-Fetch: Sunny 26°C, Air Humidity 55%, Track Temp 32°C";
}
