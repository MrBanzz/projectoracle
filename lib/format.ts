/**
 * Format an ISO 8601 timestamp as a short relative-time string suitable for
 * a dashboard "last analyzed" badge.
 *
 * The reference "now" defaults to the current time at render; passing a
 * fixed `now` is useful for tests.
 *
 * @example
 *   formatRelativeTime("2026-06-12T17:00:00Z")
 *   // → "23h ago" (when the current time is 2026-06-13T16:00:00Z)
 */
export function formatRelativeTime(
  iso: string,
  now: Date = new Date(),
): string {
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();

  if (Number.isNaN(diffMs)) return "—";

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

/**
 * Format an integer with thousands separators (e.g. 4182 → "4,182").
 * Returns "—" for non-finite inputs.
 */
export function formatCount(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US");
}
