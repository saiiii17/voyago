"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function JoinTripButton({ code, label }: { code: string; label: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/trips/${code}/join`, { method: "POST" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(typeof body.error === "string" ? body.error : "Could not send request.");
      setSubmitting(false);
      return;
    }
    router.refresh();
    setSubmitting(false);
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
