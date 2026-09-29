import type { ReactNode } from "react";
import { colors, radius } from "@/lib/theme";

type AlertTone = "error" | "success" | "info" | "warning";

const TONES: Record<AlertTone, { bg: string; color: string; border: string }> = {
  error: { bg: colors.dangerSoft, color: colors.danger, border: "#fecaca" },
  success: { bg: colors.successSoft, color: colors.success, border: "#bbf7d0" },
  info: { bg: colors.infoSoft, color: colors.info, border: "#bae6fd" },
  warning: { bg: colors.warningSoft, color: colors.warning, border: "#fde68a" },
};

interface AlertProps {
  tone?: AlertTone;
  children: ReactNode;
}

export function Alert({ tone = "info", children }: AlertProps) {
  const palette = TONES[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      style={{
        padding: "10px 14px",
        fontSize: 13,
        lineHeight: 1.5,
        color: palette.color,
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        borderRadius: radius.md,
      }}
    >
      {children}
    </div>
  );
}