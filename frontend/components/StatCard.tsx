import { colors, radius, shadow } from "@/lib/theme";

interface StatCardProps {
  label: string;
  value: string | number;
  tone?: "default" | "danger";
}

export function StatCard({ label, value, tone = "default" }: StatCardProps) {
  return (
    <div
      style={{
        padding: 20,
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.lg,
        boxShadow: shadow.card,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 500, color: colors.textMuted }}>{label}</div>
      <div
        style={{
          marginTop: 8,
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: tone === "danger" && Number(value) > 0 ? colors.danger : colors.text,
        }}
      >
        {value}
      </div>
    </div>
  );
}