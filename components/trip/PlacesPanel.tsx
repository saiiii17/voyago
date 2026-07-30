"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils";
import type { PlaceCategory, TripPlace } from "@/lib/types/database";

const CATEGORIES: PlaceCategory[] = ["food", "attraction", "lodging", "transport", "activity", "other"];
const CATEGORY_ICON: Record<PlaceCategory, string> = {
  food: "🍜",
  attraction: "🗺️",
  lodging: "🏨",
  transport: "🚗",
  activity: "🎟️",
  other: "📍",
};
const STATUS_TONE: Record<TripPlace["status"], "brand" | "stone" | "accent"> = {
  planned: "stone",
  visited: "brand",
  skipped: "stone",
};

function formatDayLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" }).format(date);
}

interface PlaceCardProps {
  place: TripPlace;
  homeCurrency: string;
  busy: boolean;
  onCycleStatus: (place: TripPlace) => void;
  onRemove: (id: string) => void;
}

function PlaceCard({ place: p, homeCurrency, busy, onCycleStatus, onRemove }: PlaceCardProps) {
  return (
    <Card className="flex items-start justify-between !p-4">
      <div className="flex gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-base">
          {CATEGORY_ICON[p.category]}
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-stone-900">{p.name}</p>
            <button onClick={() => onCycleStatus(p)}>
              <Badge tone={STATUS_TONE[p.status]} className={p.status === "skipped" ? "line-through" : ""}>
                {p.status}
              </Badge>
            </button>
          </div>
          <p className="text-xs text-stone-400 capitalize">{p.category}</p>
          {p.notes && <p className="mt-1 text-sm whitespace-pre-line text-stone-600">{p.notes}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {p.estimated_cost != null && (
          <span className="text-sm text-stone-500">{formatCurrency(p.estimated_cost, p.currency ?? homeCurrency)}</span>
        )}
        <button
          onClick={() => onRemove(p.id)}
          disabled={busy}
          className="text-stone-300 hover:text-red-500 disabled:opacity-50"
          aria-label="Remove place"
        >
          {busy ? "…" : "✕"}
        </button>
      </div>
    </Card>
  );
}

export function PlacesPanel({
  code,
  homeCurrency,
  initialPlaces,
}: {
  code: string;
  homeCurrency: string;
  initialPlaces: TripPlace[];
}) {
  const [places, setPlaces] = useState(initialPlaces);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<PlaceCategory>("activity");
  const [notes, setNotes] = useState("");
  const [estimatedCost, setEstimatedCost] = useState<string>("");
  const [visitDate, setVisitDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { sortedDates, byDate, undated } = useMemo(() => {
    const map = new Map<string, TripPlace[]>();
    const undatedItems: TripPlace[] = [];
    for (const p of places) {
      if (!p.visit_date) {
        undatedItems.push(p);
        continue;
      }
      if (!map.has(p.visit_date)) map.set(p.visit_date, []);
      map.get(p.visit_date)!.push(p);
    }
    return { sortedDates: [...map.keys()].sort(), byDate: map, undated: undatedItems };
  }, [places]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/trips/${code}/places`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          notes: notes || undefined,
          estimatedCost: estimatedCost ? Number(estimatedCost) : null,
          visitDate: visitDate || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(typeof body.error === "string" ? body.error : "Could not add that place.");
        return;
      }
      const { place } = await res.json();
      setPlaces((prev) => [place, ...prev]);
      setName("");
      setNotes("");
      setEstimatedCost("");
    } catch {
      setError("Something went wrong — check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function cycleStatus(place: TripPlace) {
    const next: Record<TripPlace["status"], TripPlace["status"]> = {
      planned: "visited",
      visited: "skipped",
      skipped: "planned",
    };
    const newStatus = next[place.status];
    setError(null);
    setPlaces((prev) => prev.map((p) => (p.id === place.id ? { ...p, status: newStatus } : p)));

    try {
      const res = await fetch(`/api/trips/${code}/places/${place.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        setPlaces((prev) => prev.map((p) => (p.id === place.id ? { ...p, status: place.status } : p)));
        const body = await res.json().catch(() => ({}));
        setError(typeof body.error === "string" ? body.error : "Could not update that place.");
      }
    } catch {
      setPlaces((prev) => prev.map((p) => (p.id === place.id ? { ...p, status: place.status } : p)));
      setError("Something went wrong — check your connection and try again.");
    }
  }

  async function remove(id: string) {
    setBusyId(id);
    setError(null);
    const previous = places;
    setPlaces((prev) => prev.filter((p) => p.id !== id));

    try {
      const res = await fetch(`/api/trips/${code}/places/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setPlaces(previous);
        const body = await res.json().catch(() => ({}));
        setError(typeof body.error === "string" ? body.error : "Could not remove that place.");
      }
    } catch {
      setPlaces(previous);
      setError("Something went wrong — check your connection and try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-stone-900">Add a place</h2>
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <Label htmlFor="placeName">Name</Label>
              <Input id="placeName" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ha Long Bay cruise" />
            </div>
            <div>
              <Label htmlFor="placeCategory">Category</Label>
              <Select id="placeCategory" value={category} onChange={(e) => setCategory(e.target.value as PlaceCategory)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c[0].toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <Label htmlFor="placeDate">Date (optional)</Label>
              <Input id="placeDate" type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="placeCost">Estimated cost ({homeCurrency}, optional)</Label>
              <Input id="placeCost" type="number" step="0.01" min="0" value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="placeNotes">Notes</Label>
            <Textarea id="placeNotes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Adding…" : "Add place"}
          </Button>
        </form>
      </Card>

      <div className="space-y-7">
        {sortedDates.map((date, idx) => (
          <div key={date}>
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white shadow-sm shadow-brand-900/20">
                {idx + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-stone-900">{formatDayLabel(date)}</p>
                <p className="text-xs text-stone-400">Day {idx + 1} of the trip</p>
              </div>
            </div>
            <div className="space-y-2 border-l-2 border-brand-100 pl-4">
              {byDate.get(date)!.map((p) => (
                <PlaceCard
                  key={p.id}
                  place={p}
                  homeCurrency={homeCurrency}
                  busy={busyId === p.id}
                  onCycleStatus={cycleStatus}
                  onRemove={remove}
                />
              ))}
            </div>
          </div>
        ))}

        {undated.length > 0 && (
          <div>
            {sortedDates.length > 0 && <p className="mb-3 text-sm font-semibold text-stone-500">Unscheduled</p>}
            <div className="space-y-2">
              {undated.map((p) => (
                <PlaceCard
                  key={p.id}
                  place={p}
                  homeCurrency={homeCurrency}
                  busy={busyId === p.id}
                  onCycleStatus={cycleStatus}
                  onRemove={remove}
                />
              ))}
            </div>
          </div>
        )}

        {places.length === 0 && (
          <Card className="text-center text-sm text-stone-500">Nothing planned yet — add your first spot above.</Card>
        )}
      </div>
    </div>
  );
}
