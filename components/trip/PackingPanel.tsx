"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { PackingItem, TripMember } from "@/lib/types/database";

export function PackingPanel({
  code,
  initialItems,
  members,
}: {
  code: string;
  initialItems: PackingItem[];
  members: TripMember[];
}) {
  const [items, setItems] = useState(initialItems);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nameById = new Map(members.map((m) => [m.id, m.display_name]));
  const checkedCount = items.filter((i) => i.is_checked).length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const itemName = name.trim();
    if (!itemName) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/trips/${code}/packing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: itemName }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(typeof body.error === "string" ? body.error : "Could not add that item.");
        return;
      }
      // Server returns the created row (with its real id) — appending it
      // directly means the list updates instantly, no page reload needed.
      const { packingItem } = await res.json();
      setItems((prev) => [...prev, packingItem]);
      setName("");
    } catch {
      setError("Something went wrong — check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggle(item: PackingItem) {
    setError(null);
    // Optimistic: flip it immediately, no waiting on the network for feedback.
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_checked: !item.is_checked } : i)));

    try {
      const res = await fetch(`/api/trips/${code}/packing/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isChecked: !item.is_checked }),
      });
      if (!res.ok) {
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_checked: item.is_checked } : i)));
        const body = await res.json().catch(() => ({}));
        setError(typeof body.error === "string" ? body.error : "Could not update that item.");
      }
    } catch {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_checked: item.is_checked } : i)));
      setError("Something went wrong — check your connection and try again.");
    }
  }

  async function remove(id: string) {
    setBusyId(id);
    setError(null);
    const previous = items;
    setItems((prev) => prev.filter((i) => i.id !== id));

    try {
      const res = await fetch(`/api/trips/${code}/packing/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setItems(previous);
        const body = await res.json().catch(() => ({}));
        setError(typeof body.error === "string" ? body.error : "Could not remove that item.");
      }
    } catch {
      setItems(previous);
      setError("Something went wrong — check your connection and try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Add a packing item…" />
        <Button type="submit" disabled={submitting || !name.trim()}>
          {submitting ? "Adding…" : "Add"}
        </Button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <Card>
        {items.length > 0 && (
          <div className="mb-4 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full bg-brand-500 transition-all"
                style={{ width: `${(checkedCount / items.length) * 100}%` }}
              />
            </div>
            <span className="shrink-0 text-xs text-stone-400">
              {checkedCount}/{items.length} packed
            </span>
          </div>
        )}
        <ul className="divide-y divide-stone-100">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between py-2.5">
              <label className="flex flex-1 cursor-pointer items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={item.is_checked}
                  onChange={() => toggle(item)}
                  className="h-4 w-4 accent-brand-600"
                />
                <span className={item.is_checked ? "text-stone-400 line-through" : "text-stone-800"}>{item.name}</span>
                {item.assigned_to && (
                  <span className="text-xs text-stone-400">({nameById.get(item.assigned_to) ?? "?"})</span>
                )}
              </label>
              <button
                onClick={() => remove(item.id)}
                disabled={busyId === item.id}
                className="text-stone-300 hover:text-red-500 disabled:opacity-50"
                aria-label="Remove item"
              >
                {busyId === item.id ? "…" : "✕"}
              </button>
            </li>
          ))}
          {items.length === 0 && <p className="py-2 text-sm text-stone-400">Nothing on the list yet.</p>}
        </ul>
      </Card>
    </div>
  );
}
