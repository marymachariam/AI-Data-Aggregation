import { colors } from "@/lib/theme";

interface BrandProps {
  light?: boolean;
}

export function Brand({ light = false }: BrandProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <rect width="28" height="28" rx="7" fill={colors.primary} />
        <path d="M8 19l6-11 6 11" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M10.5 15.5h7" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", color: light ? "#ffffff" : colors.text }}>
        Aggre8
      </span>
    </div>
  );
}