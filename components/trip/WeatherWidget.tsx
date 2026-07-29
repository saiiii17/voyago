import { getDestinationForecast } from "@/lib/weather";
import { Card } from "@/components/ui/Card";
import { WeatherCityEditor } from "@/components/trip/WeatherCityEditor";

export async function WeatherWidget({
  code,
  destination,
  weatherCity,
  canEdit,
}: {
  code: string;
  destination: string;
  weatherCity: string | null;
  canEdit: boolean;
}) {
  const city = weatherCity || destination;
  const forecast = await getDestinationForecast(city).catch(() => null);

  if (!forecast) {
    return (
      <Card>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-stone-900">Weather</h2>
          {canEdit && <WeatherCityEditor code={code} currentCity={weatherCity} placeholder={destination} />}
        </div>
        <p className="text-sm text-stone-500">
          Couldn&apos;t find weather for &quot;{city}&quot; — try setting a specific city{canEdit ? " below" : ""}.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-stone-900">Weather in {forecast.locationName}</h2>
        {canEdit && <WeatherCityEditor code={code} currentCity={weatherCity} placeholder={destination} />}
      </div>
      <div className="mb-5 flex items-baseline gap-2.5">
        <span className="text-4xl font-semibold tracking-tight text-stone-900">
          {Math.round(forecast.current.temperatureC)}°
        </span>
        <span className="text-sm text-stone-500">{forecast.current.description}</span>
      </div>
      <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
        {forecast.daily.map((d, i) => (
          <div
            key={d.date}
            className={`rounded-xl p-2 ${i === 0 ? "bg-brand-50 ring-1 ring-inset ring-brand-100" : "bg-stone-50"}`}
          >
            <p className="mb-1 font-medium text-stone-500">
              {new Date(d.date).toLocaleDateString(undefined, { weekday: "short" })}
            </p>
            <p className="font-semibold text-stone-900">{Math.round(d.maxC)}°</p>
            <p className="text-stone-400">{Math.round(d.minC)}°</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
