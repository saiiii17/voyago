import { createClient } from "@/lib/supabase/server";
import type { Profile, Trip, TripMember } from "@/lib/types/database";

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (profile as Profile) ?? null;
}

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
export async function getTripAccess(code: string, profile: Profile): Promise<TripAccess | null> {
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
}
