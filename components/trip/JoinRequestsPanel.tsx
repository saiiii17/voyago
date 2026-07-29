"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface PendingRequest {
  id: string;
  requested_at: string;
  profiles: { display_name: string; email: string } | null;
}

export function JoinRequestsPanel({ code, requests }: { code: string; requests: PendingRequest[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function decide(requestId: string, action: "approve" | "reject") {
    setBusyId(requestId);
    await fetch(`/api/trips/${code}/join-requests`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action }),
    });
    setBusyId(null);
    router.refresh();
  }

  if (requests.length === 0) return null;

  return (
    <Card className="border-accent-500/30 bg-gradient-to-br from-orange-50 to-white ring-1 ring-inset ring-orange-100">
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-orange-900">
        🔔 Pending join requests
        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700">{requests.length}</span>
      </h2>
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
                Decline
              </Button>
              <Button size="sm" disabled={busyId === r.id} onClick={() => decide(r.id, "approve")}>
                Approve
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
