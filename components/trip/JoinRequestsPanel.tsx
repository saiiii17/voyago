"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface PendingRequest {
  id: string;
  requested_at: string;
  profiles: { display_name: string; email: string } | null;
}

export function JoinRequestsPanel({ code, requests: initialRequests }: { code: string; requests: PendingRequest[] }) {
  const router = useRouter();
  const [requests, setRequests] = useState(initialRequests);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(requestId: string, action: "approve" | "reject") {
    setBusyId(requestId);
    setError(null);
    const previous = requests;
    // Optimistic: drop it from this panel immediately rather than waiting on
    // a refresh — this list is a self-contained prop snapshot, so it doesn't
    // need to wait for the rest of the page (e.g. the members list, which is
    // synced separately below) to know its own job here is done.
    setRequests((prev) => prev.filter((r) => r.id !== requestId));

    try {
      const res = await fetch(`/api/trips/${code}/join-requests`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      if (!res.ok) {
        setRequests(previous);
        const body = await res.json().catch(() => ({}));
        setError(typeof body.error === "string" ? body.error : "Could not update that request.");
        return;
      }
      if (action === "approve") {
        // Only needed to bring the new member into the Members panel /
        // balances elsewhere on this page — this panel's own state is
        // already correct without it.
        router.refresh();
      }
    } catch {
      setRequests(previous);
      setError("Something went wrong — check your connection and try again.");
    } finally {
      setBusyId(null);
    }
  }

  if (requests.length === 0) return null;

  return (
    <Card className="border-accent-500/30 bg-gradient-to-br from-orange-50 to-white ring-1 ring-inset ring-orange-100">
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-orange-900">
        🔔 Pending join requests
        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700">{requests.length}</span>
      </h2>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <div className="space-y-2">
        {requests.map((r) => (
          <div
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-3.5 py-2.5 ring-1 ring-stone-100"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-700">
                {(r.profiles?.display_name ?? "?").slice(0, 1).toUpperCase()}
              </span>
              <div>
                <p className="text-sm font-medium text-stone-800">{r.profiles?.display_name ?? "Unknown"}</p>
                <p className="text-xs text-stone-400">{r.profiles?.email}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={busyId === r.id} onClick={() => decide(r.id, "reject")}>
                {busyId === r.id ? "…" : "Decline"}
              </Button>
              <Button size="sm" disabled={busyId === r.id} onClick={() => decide(r.id, "approve")}>
                {busyId === r.id ? "…" : "Approve"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
