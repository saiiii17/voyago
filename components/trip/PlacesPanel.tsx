"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export function PlacesPanel({
  code,
  homeCurrency,
  initialPlaces,
}: {
  code: string;
  homeCurrency: string;
  initialPlaces: TripPlace[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<PlaceCategory>("activity");
  const [notes, setNotes] = useState("");
  const [estimatedCost, setEstimatedCost] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch(`/api/trips/${code}/places`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        category,
        notes: notes || undefined,
        estimatedCost: estimatedCost ? Number(estimatedCost) : null,
      }),
    });
    setSubmitting(false);
    setName("");
    setNotes("");
    setEstimatedCost("");
    router.refresh();
  }

  async function cycleStatus(place: TripPlace) {
    const next: Record<TripPlace["status"], TripPlace["status"]> = {
      planned: "visited",
      visited: "skipped",
      skipped: "planned",
    };
    await fetch(`/api/trips/${code}/places/${place.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next[place.status] }),
    });
    router.refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/trips/${code}/places/${id}`, { method: "DELETE" });
    router.refresh();
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
          <div>
            <Label htmlFor="placeCost">Estimated cost ({homeCurrency}, optional)</Label>
            <Input id="placeCost" type="number" step="0.01" min="0" value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="placeNotes">Notes</Label>
            <Textarea id="placeNotes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Adding…" : "Add place"}
          </Button>
        </form>
      </Card>

      <div className="space-y-2">
        {initialPlaces.map((p) => (
          <Card key={p.id} className="flex items-start justify-between !p-4">
            <div className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-base">
                {CATEGORY_ICON[p.category]}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-stone-900">{p.name}</p>
                  <button onClick={() => cycleStatus(p)}>
                    <Badge tone={STATUS_TONE[p.status]} className={p.status === "skipped" ? "line-through" : ""}>
                      {p.status}
                    </Badge>
                  </button>
                </div>
                <p className="text-xs text-stone-400 capitalize">{p.category}</p>
                {p.notes && <p className="mt-1 text-sm text-stone-600">{p.notes}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {p.estimated_cost != null && (
                <span className="text-sm text-stone-500">{formatCurrency(p.estimated_cost, p.currency ?? homeCurrency)}</span>
              )}
              <button onClick={() => remove(p.id)} className="text-stone-300 hover:text-red-500">
                ✕
              </button>
            </div>
          </Card>
        ))}
        {initialPlaces.length === 0 && (
          <Card className="text-center text-sm text-stone-500">Nothing planned yet — add your first spot above.</Card>
        )}
      </div>
    </div>
  );
}
