"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function JoinTripButton({ code, label }: { code: string; label: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/trips/${code}/join`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(typeof body.error === "string" ? body.error : "Could not send request.");
        setSubmitting(false);
        return;
      }
      // Hard reload, not router.refresh(): this page's status is decided by
      // which branch its parent Server Component takes (no request yet /
      // pending / rejected), and a soft refresh here was leaving the button
      // showing "Sending…" instead of switching to the "pending" message.
      window.location.reload();
    } catch {
      setSubmitting(false);
      setError("Something went wrong — check your connection and try again.");
    }
  }

  return (
    <div>
      <Button onClick={handleClick} disabled={submitting} className="w-full">
        {submitting ? "Sending…" : label}
      </Button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
