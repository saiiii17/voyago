import { cache } from "react";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { VERIFIED_USER_HEADER } from "@/lib/supabase/middleware";
import type { Profile, Trip, TripMember } from "@/lib/types/database";

// Both wrapped in React.cache: a trip page's layout and the page itself each
// independently resolve profile/trip access for their own rendering, which
// without this means every navigation re-runs the same auth + trip + member
// queries twice. React.cache dedupes repeat calls with the same arguments to
// a single execution within one request/render pass — it doesn't persist
// across requests, so there's no staleness risk, just no redundant round trips.
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();

  // proxy.ts already calls supabase.auth.getUser() on every request to
  // verify the session — a real round-trip to Supabase's auth server, not a
  // local check. Reusing its verified result here avoids paying for that
  // same round-trip a second time on every page. Falls back to calling
  // getUser() directly if the header is ever missing (e.g. a request path
  // not covered by the middleware matcher) — its absence is never trusted
  // on its own as "not signed in."
  let userId = (await headers()).get(VERIFIED_USER_HEADER);
  if (!userId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  }
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return (profile as Profile) ?? null;
});

export type TripAccess = {
  trip: Trip;
  member: TripMember | null;
  isOwner: boolean;
  isMaster: boolean;
  /** Owner or master — can approve join requests, edit trip settings, see the QR code. */
  canManage: boolean;
};

/**
 * Resolves a trip by its shareable code and the caller's relationship to it.
 * Returns null if the trip doesn't exist OR isn't visible to this profile —
 * RLS already enforces this at the query level, so a null trip here means
 * "nothing to see," and callers should render/return a 404 either way
 * (never distinguish "doesn't exist" from "you can't see it").
 */
export const getTripAccess = cache(async (code: string, profile: Profile): Promise<TripAccess | null> => {
  const supabase = await createClient();

  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("code", code)
    .single();

  if (!trip) return null;

  const isMaster = profile.is_master;
  const isOwner = trip.owner_id === profile.id;

  const { data: member } = await supabase
    .from("trip_members")
    .select("*")
    .eq("trip_id", trip.id)
    .eq("profile_id", profile.id)
    .maybeSingle();

  return {
    trip,
    member: (member as TripMember) ?? null,
    isOwner,
    isMaster,
    canManage: isOwner || isMaster,
  };
});
