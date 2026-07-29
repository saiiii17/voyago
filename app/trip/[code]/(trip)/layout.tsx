import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth-page";
import { getTripAccess } from "@/lib/auth";
import { TripNav } from "@/components/trip/TripNav";

export default async function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const profile = await requireProfile();
  const access = await getTripAccess(code, profile);

  if (!access) {
    redirect(`/trip/${code}/join`);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 px-6 py-7 text-white shadow-lg shadow-brand-900/15 sm:px-8">
        <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-accent-500/20 blur-3xl" />
        <div className="relative flex items-center gap-3.5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-xl ring-1 ring-white/20 backdrop-blur-sm">
            🌴
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight">{access.trip.name}</h1>
            <p className="text-sm text-brand-100/80">
              {access.trip.destination} <span className="text-brand-100/40">·</span>{" "}
              <span className="font-mono text-xs text-brand-100/60">{code}</span>
            </p>
          </div>
        </div>
      </div>

      <TripNav code={code} />

      {children}
    </div>
  );
}
