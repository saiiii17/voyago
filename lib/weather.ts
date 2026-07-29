// Free, no-API-key weather via Open-Meteo.

const WMO_DESCRIPTIONS: Record<number, string> = {
  0: "Clear sky",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Dense drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Light rain showers",
  81: "Rain showers",
  82: "Violent rain showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Severe thunderstorm with hail",
};

export function describeWeatherCode(code: number): string {
  return WMO_DESCRIPTIONS[code] ?? "Unknown";
}

export interface DestinationForecast {
  locationName: string;
  latitude: number;
  longitude: number;
  current: { temperatureC: number; description: string };
  daily: { date: string; maxC: number; minC: number; description: string }[];
}

export async function getDestinationForecast(destination: string): Promise<DestinationForecast | null> {
  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1`,
    { next: { revalidate: 24 * 60 * 60 } }
  );
  if (!geoRes.ok) return null;
  const geoData = await geoRes.json();
  const place = geoData?.results?.[0];
  if (!place) return null;

  const forecastRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}` +
      `&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code` +
      `&timezone=auto&forecast_days=5`,
    { next: { revalidate: 60 * 60 } }
  );
  if (!forecastRes.ok) return null;
  const forecast = await forecastRes.json();

  return {
    locationName:
      place.name === place.country ? place.name : [place.name, place.country].filter(Boolean).join(", "),
    latitude: place.latitude,
    longitude: place.longitude,
    current: {
      temperatureC: forecast.current.temperature_2m,
      description: describeWeatherCode(forecast.current.weather_code),
    },
    daily: (forecast.daily.time as string[]).map((date, i) => ({
      date,
      maxC: forecast.daily.temperature_2m_max[i],
      minC: forecast.daily.temperature_2m_min[i],
      description: describeWeatherCode(forecast.daily.weather_code[i]),
    })),
  };
}
