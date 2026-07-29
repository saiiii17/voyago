"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Logo } from "@/components/Logo";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });

    if (error) {
      setSubmitting(false);
      setError(error.message === "User already registered" ? "An account with that email already exists." : error.message);
      return;
    }

    if (data.session) {
      router.push(next);
      router.refresh();
      return;
    }

    // Project still has "Confirm email" enabled in Supabase — the account
    // exists but has no active session until that link is clicked.
    setSubmitting(false);
    setNeedsConfirmation(true);
  }

  if (needsConfirmation) {
    return (
      <div className="rounded-2xl bg-brand-50 p-5 text-center ring-1 ring-inset ring-brand-100">
        <span className="mb-3 mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl shadow-sm">
          ✉️
        </span>
        <p className="text-sm text-stone-600">
          Your account was created, but this project still requires email confirmation. Check your inbox, or turn
          off &quot;Confirm email&quot; in Supabase → Authentication → Sign In / Providers to skip this.
        </p>
      </div>
    );
  }

  return (
    <>
      <h2 className="mb-1.5 text-2xl font-semibold tracking-tight text-stone-900">Create an account</h2>
      <p className="mb-8 text-sm text-stone-500">Set a password — no email confirmation needed.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="displayName">Your name</Label>
          <Input
            id="displayName"
            required
            autoFocus
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Sai"
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
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
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </Button>
        <p className="text-center text-xs text-stone-400">
          Already have an account?{" "}
          <a href={`/login?next=${encodeURIComponent(next)}`} className="font-medium text-brand-600 hover:underline">
            Sign in
          </a>
        </p>
      </form>
    </>
  );
}

export default function SignupPage() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-5 flex justify-center">
          <Logo size="lg" href={null} />
        </div>
        <Suspense fallback={null}>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  );
}
