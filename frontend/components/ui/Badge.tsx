import type { ReactNode } from "react";
import { colors } from "@/lib/theme";
import type { Tone } from "@/lib/format";

const TONES: Record<Tone, { bg: string; color: string }> = {
  neutral: { bg: colors.neutralSoft, color: colors.textMuted },
  success: { bg: colors.successSoft, color: colors.success },
  warning: { bg: colors.warningSoft, color: colors.warning },
  danger: { bg: colors.dangerSoft, color: colors.danger },
  info: { bg: colors.infoSoft, color: colors.info },
};

interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
}

export function Badge({ tone = "neutral", children }: BadgeProps) {
  const palette = TONES[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 10px",
        fontSize: 12,
        fontWeight: 600,
        textTransform: "capitalize",
        color: palette.color,
        background: palette.bg,
        borderRadius: 999,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}