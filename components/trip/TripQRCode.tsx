"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function TripQRCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${location.origin}/trip/${code}/join` : "";

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Card className="flex flex-col items-center gap-3 text-center">
      <h2 className="text-lg font-semibold text-stone-900">Invite friends</h2>
      {url && (
        <div className="rounded-2xl bg-white p-3 ring-1 ring-stone-200">
          <QRCodeSVG value={url} size={132} fgColor="#0a4a3d" bgColor="transparent" />
        </div>
      )}
      <p className="max-w-[220px] truncate text-xs text-stone-400">{url}</p>
      <Button variant="secondary" size="sm" onClick={copyLink}>
        {copied ? "✓ Copied!" : "Copy join link"}
      </Button>
    </Card>
  );
}
