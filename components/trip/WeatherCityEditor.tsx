"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function WeatherCityEditor({
  code,
  currentCity,
  placeholder,
}: {
  code: string;
  currentCity: string | null;
  placeholder: string;
}) {
  const [editing, setEditing] = useState(false);
  const [city, setCity] = useState(currentCity ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/trips/${code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weatherCity: city.trim() || null }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(typeof body.error === "string" ? body.error : "Could not update city.");
        return;
      }
      window.location.reload();
    } catch {
      setError("Something went wrong — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="shrink-0 text-xs font-medium text-stone-400 hover:text-brand-600"
      >
        📍 Change city
      </button>
    );
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <div className="flex items-center gap-1.5">
        <input
          autoFocus
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder={placeholder}
          className="w-32 rounded-lg border-0 bg-white px-2.5 py-1 text-xs text-stone-900 ring-1 ring-inset ring-stone-200 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500 sm:w-40"
        />
        <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "…" : "Save"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={saving}>
          ✕
        </Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
