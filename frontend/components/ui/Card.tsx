import type { CSSProperties, ReactNode } from "react";
import { colors, radius, shadow } from "@/lib/theme";

interface CardProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  padded?: boolean;
  style?: CSSProperties;
  children: ReactNode;
}

export function Card({ title, description, action, padded = true, style, children }: CardProps) {
  return (
    <section
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.lg,
        boxShadow: shadow.card,
        overflow: "hidden",
        ...style,
      }}
    >
      {(title || action) && (
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            padding: "16px 20px",
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <div>
            {title && <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: colors.text }}>{title}</h2>}
            {description && (
              <p style={{ margin: "2px 0 0", fontSize: 13, color: colors.textMuted }}>{description}</p>
            )}
          </div>
          {action}
        </header>
      )}
      <div style={{ padding: padded ? 20 : 0 }}>{children}</div>
    </section>
  );
}