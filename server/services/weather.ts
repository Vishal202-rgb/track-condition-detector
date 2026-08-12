import axios from "axios";

export type WeatherSnapshot = { temp: string; humidity: string; windSpeed: string };

const WEATHER_CACHE_MS = 60_000;
let lastSuccessfulWeather: WeatherSnapshot | null = null;
let lastFetchedAt = 0;
let weatherInFlight: Promise<WeatherSnapshot> | null = null;

export function resetWeatherCache() {
  lastSuccessfulWeather = null;
  lastFetchedAt = 0;
  weatherInFlight = null;
}

export async function fetchLiveWeather(): Promise<WeatherSnapshot> {
  if (lastSuccessfulWeather && Date.now() - lastFetchedAt < WEATHER_CACHE_MS) {
    return lastSuccessfulWeather;
  }

  if (weatherInFlight) return weatherInFlight;

  weatherInFlight = (async () => {
    try {
      // Silverstone Circuit coordinates. Values are sourced only from Open-Meteo.
      const res = await axios.get("https://api.open-meteo.com/v1/forecast?latitude=52.0786&longitude=-1.0169&current=temperature_2m,relative_humidity_2m,wind_speed_10m", { timeout: 4000 });
      const current = res.data?.current;
      if (!current || !Number.isFinite(current.temperature_2m) || !Number.isFinite(current.relative_humidity_2m) || !Number.isFinite(current.wind_speed_10m)) {
        throw new Error("Open-Meteo response did not include current weather values");
      }
      lastSuccessfulWeather = {
        temp: `${current.temperature_2m}°C`,
        humidity: `${current.relative_humidity_2m}%`,
        windSpeed: `${current.wind_speed_10m} km/h`,
      };
      lastFetchedAt = Date.now();
      return lastSuccessfulWeather;
    } catch (err) {
      console.warn("[Weather] Open-Meteo request failed:", err);
      return lastSuccessfulWeather ?? { temp: "N/A", humidity: "N/A", windSpeed: "N/A" };
    } finally {
      weatherInFlight = null;
    }
  })();

  return weatherInFlight;
}
