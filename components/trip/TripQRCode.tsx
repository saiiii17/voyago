"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function TripQRCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  // NEXT_PUBLIC_* vars are inlined at build time and identical on server and
  // client, unlike `window.location.origin` — using that instead caused a
  // hydration mismatch (server render had no `window`, so it rendered blank;
  // the client's first render already had it, so React saw mismatched HTML).
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/trip/${code}/join`;

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Card className="flex flex-col items-center gap-3 text-center">
      <h2 className="text-lg font-semibold text-stone-900">Invite friends</h2>
      <div className="rounded-2xl bg-white p-3 ring-1 ring-stone-200">
        <QRCodeSVG value={url} size={132} fgColor="#0a4a3d" bgColor="transparent" />
      </div>
      <p className="max-w-[220px] truncate text-xs text-stone-400">{url}</p>
      <Button variant="secondary" size="sm" onClick={copyLink}>
        {copied ? "✓ Copied!" : "Copy join link"}
      </Button>
    </Card>
  );
}
