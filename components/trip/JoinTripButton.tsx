"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function JoinTripButton({ code, label }: { code: string; label: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/trips/${code}/join`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(typeof body.error === "string" ? body.error : "Could not send request.");
        return;
      }
      // Render the pending state directly rather than reloading to let the
      // parent Server Component re-derive it — instant, and this is the only
      // place that state is shown, so there's nothing else to keep in sync.
      setSubmitted(true);
    } catch {
      setError("Something went wrong — check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <p className="rounded-xl bg-orange-50 p-3.5 text-sm text-orange-800 ring-1 ring-inset ring-orange-100">
        Your request to join is waiting for approval.
      </p>
    );
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
