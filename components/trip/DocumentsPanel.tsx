"use client";

import { useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import type { TripDocument } from "@/lib/types/database";

export function DocumentsPanel({ code, initialDocuments }: { code: string; initialDocuments: TripDocument[] }) {
  const [documents, setDocuments] = useState(initialDocuments);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/trips/${code}/documents`, { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(typeof body.error === "string" ? body.error : "Upload failed.");
        return;
      }
      const { document } = await res.json();
      setDocuments((prev) => [document, ...prev]);
    } catch {
      setError("Something went wrong — check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: string) {
    setRemovingId(id);
    setError(null);
    const previous = documents;
    setDocuments((prev) => prev.filter((d) => d.id !== id));

    try {
      const res = await fetch(`/api/trips/${code}/documents/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setDocuments(previous);
        const body = await res.json().catch(() => ({}));
        setError(typeof body.error === "string" ? body.error : "Could not remove that document.");
      }
    } catch {
      setDocuments(previous);
      setError("Something went wrong — check your connection and try again.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-2 border-dashed border-stone-200 bg-white/60 text-center">
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <span className="mb-2 block text-2xl">📎</span>
        <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? "Uploading…" : "Upload a document"}
        </Button>
        <p className="mt-2.5 text-xs text-stone-400">
          Flight tickets, hotel bookings, visas, insurance — anything worth keeping in one place.
        </p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </Card>

      <div className="space-y-2">
        {documents.map((doc) => (
          <Card key={doc.id} className="flex items-center justify-between !p-4">
            <a
              href={doc.file_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 text-sm font-medium text-stone-800 hover:text-brand-700"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 text-sm">📄</span>
              {doc.name}
            </a>
            <div className="flex items-center gap-3">
              <span className="text-xs text-stone-400">{formatDate(doc.created_at)}</span>
              <button
                onClick={() => remove(doc.id)}
                disabled={removingId === doc.id}
                className="text-stone-300 hover:text-red-500 disabled:opacity-50"
                aria-label="Remove document"
              >
                {removingId === doc.id ? "…" : "✕"}
              </button>
            </div>
          </Card>
        ))}
        {documents.length === 0 && <p className="text-sm text-stone-400">No documents yet.</p>}
      </div>
    </div>
  );
}
