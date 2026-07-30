"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function DeleteExpenseButton({ code, id }: { code: string; id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm("Delete this expense? This can't be undone.")) return;
    setBusy(true);
    setError(null);

    try {
      const res = await fetch(`/api/trips/${code}/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(typeof body.error === "string" ? body.error : "Could not delete this expense.");
        return;
      }
      router.push(`/trip/${code}/expenses`);
      router.refresh();
    } catch {
      setError("Something went wrong — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Button variant="danger" onClick={handleDelete} disabled={busy}>
        {busy ? "Deleting…" : "Delete"}
      </Button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
