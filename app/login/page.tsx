"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Logo } from "@/components/Logo";

const FEATURES = [
  {
    icon: "🗺️",
    title: "Plan the trip",
    body: "Itinerary and places, a shared packing list, trip documents, and a destination chatbot for questions.",
  },
  {
    icon: "🧾",
    title: "Split it fairly",
    body: "Scan a receipt or enter it by hand, tag who had what — tax, tip, and discounts split by actual usage.",
  },
  {
    icon: "🤝",
    title: "Settle up once",
    body: "Every expense rolls up into one simplified list of who owes who, not a tangle of individual debts.",
  },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setSubmitting(false);
      setError(error.message === "Invalid login credentials" ? "Wrong email or password." : error.message);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <>
      <h2 className="mb-1.5 text-2xl font-semibold tracking-tight text-stone-900">Welcome back</h2>
      <p className="mb-8 text-sm text-stone-500">Sign in to plan trips and split bills with your friends.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
        <p className="text-center text-xs text-stone-400">
          New here?{" "}
          <a href={`/signup?next=${encodeURIComponent(next)}`} className="font-medium text-brand-600 hover:underline">
            Create an account
          </a>
        </p>
      </form>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="grid min-h-[calc(100vh-64px)] lg:grid-cols-2">
      {/* Branding panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 lg:flex lg:flex-col lg:justify-center lg:px-14 lg:py-16">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-brand-400/25 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-accent-500/15 blur-3xl" />

        <div className="relative max-w-md">
          <div className="mb-7">
            <Logo size="lg" theme="ghost" href={null} />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-[2.15rem]">
            Plan the trip. Split the bill.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-brand-100/75">
            One place for the itinerary, the packing list, and the group chat about where to eat — and for working
            out exactly who owes who when the bills come in.
          </p>

          <ul className="mt-10 space-y-6">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-base ring-1 ring-white/15">
                  {f.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-brand-100/65">{f.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-5 lg:hidden">
            <Logo size="lg" href={null} showText={false} />
          </div>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
