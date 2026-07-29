import Link from "next/link";
import { requireProfile } from "@/lib/auth-page";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { CreateTripForm } from "@/components/trip/CreateTripForm";
import type { Trip } from "@/lib/types/database";

export default async function HomePage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: trips } = await supabase
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false });

  const firstName = profile.display_name.split(" ")[0];

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-8 sm:px-6 sm:py-10">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 px-6 py-9 text-white shadow-lg shadow-brand-900/20 sm:px-10 sm:py-12">
        <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-brand-400/25 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-accent-500/20 blur-3xl" />
        <div className="relative">
          <p className="mb-2 text-sm font-medium text-brand-100/80">Welcome back</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Hey {firstName} 👋</h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-brand-100/80">
            {profile.is_master
              ? "As master, you can see every trip in the app."
              : "Here are the trips you've been approved into."}
          </p>
          {profile.is_master && (
            <a
              href="#create-trip"
              className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-brand-800 shadow-sm transition-transform hover:-translate-y-0.5"
            >
              + Plan a new trip
            </a>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium tracking-wide text-stone-400 uppercase">Your trips</h2>
        <div className="space-y-3">
          {trips && trips.length > 0 ? (
            (trips as Trip[]).map((trip) => (
              <Link key={trip.id} href={`/trip/${trip.code}`}>
                <Card className="flex items-center justify-between transition-all hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50 text-xl ring-1 ring-inset ring-brand-100/60">
                      🌍
                    </span>
                    <div>
                      <p className="font-medium text-stone-900">{trip.name}</p>
                      <p className="text-sm text-stone-500">{trip.destination}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-stone-100 px-2.5 py-1 font-mono text-xs text-stone-500">
                    {trip.code}
                  </span>
                </Card>
              </Link>
            ))
          ) : (
            <Card className="text-center">
              <p className="mb-1 text-3xl">🧭</p>
              <p className="text-sm text-stone-500">
                {profile.is_master
                  ? "No trips yet. Create one below, or ask a friend for their trip's join link."
                  : "No trips yet. Ask your trip organizer for their trip's join link or QR code."}
              </p>
            </Card>
          )}
        </div>
      </div>

      {profile.is_master && (
        <Card id="create-trip" className="scroll-mt-6">
          <h2 className="mb-1 text-lg font-semibold text-stone-900">Plan a new trip</h2>
          <p className="mb-5 text-sm text-stone-500">Pick a destination and invite your friends once it&apos;s created.</p>
          <CreateTripForm suggestedName={profile.display_name} />
        </Card>
      )}
    </div>
  );
}
