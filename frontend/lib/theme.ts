import type { CSSProperties } from "react";

export const colors = {
  bg: "#f4f6f9",
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  border: "#e2e8f0",
  borderStrong: "#cbd5e1",
  text: "#0f172a",
  textMuted: "#64748b",
  primary: "#2563eb",
  primaryHover: "#1d4ed8",
  primarySoft: "#eff6ff",
  sidebar: "#0b1220",
  sidebarBorder: "#1e293b",
  sidebarText: "#94a3b8",
  sidebarActive: "#1e293b",
  success: "#15803d",
  successSoft: "#dcfce7",
  warning: "#b45309",
  warningSoft: "#fef3c7",
  danger: "#b91c1c",
  dangerHover: "#991b1b",
  dangerSoft: "#fee2e2",
  info: "#0369a1",
  infoSoft: "#e0f2fe",
  neutralSoft: "#f1f5f9",
} as const;

export const font = {
  sans: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  mono: 'var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace',
} as const;

export const radius = { sm: 6, md: 8, lg: 12 } as const;

export const shadow = {
  card: "0 1px 2px rgba(15,23,42,0.05), 0 1px 3px rgba(15,23,42,0.06)",
  overlay: "0 20px 45px rgba(15,23,42,0.25)",
} as const;

export const tableStyles = {
  wrapper: { overflowX: "auto" } satisfies CSSProperties,
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 } satisfies CSSProperties,
  th: {
    textAlign: "left",
    padding: "10px 16px",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: colors.textMuted,
    background: colors.surfaceMuted,
    borderBottom: `1px solid ${colors.border}`,
    whiteSpace: "nowrap",
  } satisfies CSSProperties,
  td: {
    padding: "12px 16px",
    color: colors.text,
    borderBottom: `1px solid ${colors.border}`,
    verticalAlign: "middle",
  } satisfies CSSProperties,
};