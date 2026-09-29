import type { ReactNode } from "react";
import { colors } from "@/lib/theme";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div style={{ padding: "48px 24px", textAlign: "center" }}>
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: colors.text }}>{title}</h3>
      <p style={{ margin: "6px auto 0", maxWidth: 420, fontSize: 14, lineHeight: 1.5, color: colors.textMuted }}>
        {description}
      </p>
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  );
}