"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export function DeleteExpenseButton({ code, id }: { code: string; id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
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
      setConfirming(false);
    }
  }

  return (
    <div>
      <Button variant="danger" onClick={() => setConfirming(true)} disabled={busy}>
        {busy ? "Deleting…" : "Delete"}
      </Button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <ConfirmDialog
        open={confirming}
        title="Delete this expense?"
        description="This can't be undone — the expense and its item split will be permanently removed."
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={handleDelete}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
