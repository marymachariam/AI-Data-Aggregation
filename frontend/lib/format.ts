export type Tone = "neutral" | "success" | "warning" | "danger" | "info";

// The backend returns UTC timestamps without a timezone marker; treat them as UTC.
export function parseDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(iso);
  const date = new Date(hasZone ? iso : `${iso}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTime(iso: string | null | undefined): string {
  const date = parseDate(iso);
  if (!date) return "—";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function timeAgo(iso: string | null | undefined): string {
  const date = parseDate(iso);
  if (!date) return "Never";
  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} d ago`;
  return formatDateTime(iso);
}

export function formatDuration(start: string | null, end: string | null): string {
  const a = parseDate(start);
  const b = parseDate(end);
  if (!a || !b) return "—";
  const seconds = Math.max(0, Math.round((b.getTime() - a.getTime()) / 1000));
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export function fileStatusTone(status: string): Tone {
  if (status === "processed") return "success";
  if (status === "failed") return "danger";
  if (status === "processing") return "warning";
  return "neutral";
}

export function syncStatusTone(status: string): Tone {
  if (status === "success") return "success";
  if (status === "partial") return "warning";
  if (status === "failed") return "danger";
  if (status === "running") return "info";
  return "neutral";
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}