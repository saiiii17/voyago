"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { TripMember } from "@/lib/types/database";

export function MembersPanel({
  code,
  members: initialMembers,
  ownerId,
}: {
  code: string;
  members: TripMember[];
  ownerId: string;
}) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function remove(memberId: string) {
    setBusyId(memberId);
    setError(null);
    const previous = members;
    setMembers((prev) => prev.filter((m) => m.id !== memberId));

    try {
      const res = await fetch(`/api/trips/${code}/members/${memberId}`, { method: "DELETE" });
      if (!res.ok) {
        setMembers(previous);
        const body = await res.json().catch(() => ({}));
        setError(typeof body.error === "string" ? body.error : "Could not remove that person.");
        return;
      }
      // This panel's own list is already updated optimistically above; other
      // components on this page (balances, charts) still hold this member's
      // stale server props, so refresh those in the background without a
      // jarring full reload of this panel itself.
      router.refresh();
    } catch {
      setMembers(previous);
      setError("Something went wrong — check your connection and try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold text-stone-900">Members</h2>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <div className="space-y-2">
        {members.map((m) => {
          const isOwner = m.profile_id === ownerId;
          const busy = busyId === m.id;
          return (
            <div
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-stone-50 px-3.5 py-2.5"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                  {m.display_name.slice(0, 1).toUpperCase()}
                </span>
                <p className="text-sm font-medium text-stone-800">
                  {m.display_name}
                  {isOwner && <span className="ml-1.5 text-xs font-normal text-stone-400">(owner)</span>}
                </p>
              </div>
              {!isOwner &&
                (confirmId === m.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-500">Remove {m.display_name}?</span>
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => setConfirmId(null)}>
                      Cancel
                    </Button>
                    <Button size="sm" variant="danger" disabled={busy} onClick={() => remove(m.id)}>
                      {busy ? "…" : "Confirm"}
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="danger" disabled={busy} onClick={() => setConfirmId(m.id)}>
                    Remove
                  </Button>
                ))}
            </div>
          );
        })}
        {members.length === 0 && <p className="text-sm text-stone-500">No members yet.</p>}
      </div>
    </Card>
  );
}
