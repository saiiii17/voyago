"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";

const COMMON_CURRENCIES = ["USD", "EUR", "GBP", "INR", "VND", "THB", "SGD", "AUD", "CAD", "JPY"];

export function CreateTripForm({ suggestedName }: { suggestedName: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [homeCurrency, setHomeCurrency] = useState("USD");
  const [yourDisplayName, setYourDisplayName] = useState(suggestedName);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, destination, homeCurrency, yourDisplayName }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(typeof body.error === "string" ? body.error : "Could not create trip.");
      setSubmitting(false);
      return;
    }

    const { trip } = await res.json();
    router.push(`/trip/${trip.code}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="destination">Destination</Label>
        <Input
          id="destination"
          required
          placeholder="Vietnam"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="name">Trip name</Label>
        <Input
          id="name"
          required
          placeholder="Vietnam with the crew"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="homeCurrency">Your currency</Label>
          <Select id="homeCurrency" value={homeCurrency} onChange={(e) => setHomeCurrency(e.target.value)}>
            {COMMON_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="yourDisplayName">Your name on this trip</Label>
          <Input
            id="yourDisplayName"
            required
            value={yourDisplayName}
            onChange={(e) => setYourDisplayName(e.target.value)}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Creating…" : "Create trip"}
      </Button>
    </form>
  );
}
