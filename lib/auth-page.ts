import { redirect, notFound } from "next/navigation";
import { getCurrentProfile, getTripAccess } from "@/lib/auth";

// Server Component / page helpers — these redirect/404 directly, which only
// works in the render path (not in Route Handlers; see lib/auth.ts for the
// pure versions those use).

export async function requireProfile() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function requireTripPageAccess(code: string) {
  const profile = await requireProfile();
  const access = await getTripAccess(code, profile);
  if (!access) notFound();
  return { ...access, profile };
}

export async function requireTripManagePageAccess(code: string) {
  const access = await requireTripPageAccess(code);
  if (!access.canManage) notFound();
  return access;
}
