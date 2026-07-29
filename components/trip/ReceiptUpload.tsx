"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { ParsedReceipt } from "@/lib/groq/receipt";

interface Props {
  code: string;
  onScanned: (parsed: ParsedReceipt, receiptImageUrl: string | null) => void;
}

export function ReceiptUpload({ code, onScanned }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  async function handleFile(file: File) {
    setScanning(true);
    setError(null);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/trips/${code}/expenses/scan`, { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(typeof body.error === "string" ? body.error : "Could not read that receipt.");
        return;
      }

      const { parsed, receiptImageUrl } = await res.json();
      onScanned(parsed, receiptImageUrl);
    } catch {
      setError("Something went wrong — check your connection and try again.");
    } finally {
      setScanning(false);
    }
  }

  return (
    <div
      className={`rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
        scanning ? "border-brand-300 bg-brand-50/40" : "border-stone-200 bg-white/60 hover:border-brand-300"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {previewUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt="Receipt preview" className="mx-auto mb-4 max-h-40 rounded-xl object-contain shadow-sm" />
      )}
      <span className="mb-2 block text-2xl">{scanning ? "🔎" : "📷"}</span>
      <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()} disabled={scanning}>
        {scanning ? "Reading receipt…" : "Scan a receipt photo"}
      </Button>
      <p className="mt-2.5 text-xs text-stone-400">
        We&apos;ll pre-fill the items below — double-check them and assign who shared what.
      </p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
