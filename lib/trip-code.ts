const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous I/O/0/1
const DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");

function slugifyDestination(destination: string): string {
  const slug = destination
    .normalize("NFKD")
    .replace(DIACRITICS_RE, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 12);
  return slug || "TRIP";
}

/** e.g. "Vietnam" -> "VIETNAM-7X2K9". Uniqueness is enforced by the DB
 * column constraint; callers should retry a few times on conflict. */
export function generateTripCode(destination: string): string {
  let suffix = "";
  for (let i = 0; i < 5; i++) {
    suffix += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `${slugifyDestination(destination)}-${suffix}`;
}
