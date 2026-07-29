"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const nameById = new Map(members.map((m) => [m.id, m.display_name]));
  const checkedCount = initialItems.filter((i) => i.is_checked).length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch(`/api/trips/${code}/packing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setSubmitting(false);
    setName("");
    router.refresh();
  }

  async function toggle(item: PackingItem) {
    await fetch(`/api/trips/${code}/packing/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isChecked: !item.is_checked }),
    });
    router.refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/trips/${code}/packing/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Add a packing item…" />
        <Button type="submit" disabled={submitting || !name.trim()}>
          Add
        </Button>
      </form>

      <Card>
        {initialItems.length > 0 && (
          <div className="mb-4 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full bg-brand-500 transition-all"
                style={{ width: `${(checkedCount / initialItems.length) * 100}%` }}
              />
            </div>
            <span className="shrink-0 text-xs text-stone-400">
              {checkedCount}/{initialItems.length} packed
            </span>
          </div>
        )}
        <ul className="divide-y divide-stone-100">
          {initialItems.map((item) => (
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
              <button onClick={() => remove(item.id)} className="text-stone-300 hover:text-red-500">
                ✕
              </button>
            </li>
          ))}
          {initialItems.length === 0 && <p className="py-2 text-sm text-stone-400">Nothing on the list yet.</p>}
        </ul>
      </Card>
    </div>
  );
}
