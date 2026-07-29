"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function DeleteExpenseButton({ code, id }: { code: string; id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this expense? This can't be undone.")) return;
    setBusy(true);
    await fetch(`/api/trips/${code}/expenses/${id}`, { method: "DELETE" });
    router.push(`/trip/${code}/expenses`);
    router.refresh();
  }

  return (
    <Button variant="danger" onClick={handleDelete} disabled={busy}>
      {busy ? "Deleting…" : "Delete"}
    </Button>
  );
}
