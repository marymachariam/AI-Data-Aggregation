"use client";

import { useEffect, type ReactNode } from "react";
import { colors, shadow } from "@/lib/theme";
import { Icon } from "./Icon";

interface DrawerProps {
  open: boolean;
  title: string;
  subtitle?: ReactNode;
  onClose: () => void;
  width?: number;
  children: ReactNode;
}

export function Drawer({ open, title, subtitle, onClose, width = 640, children }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label={title} style={{ position: "fixed", inset: 0, zIndex: 40 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.45)" }} />
      <aside
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          maxWidth: width,
          display: "flex",
          flexDirection: "column",
          background: colors.surface,
          boxShadow: shadow.overlay,
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            padding: "20px 24px",
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{title}</h2>
            {subtitle && <div style={{ marginTop: 6 }}>{subtitle}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ display: "flex", background: "none", border: "none", cursor: "pointer", color: colors.textMuted }}
          >
            <Icon name="close" />
          </button>
        </header>
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>{children}</div>
      </aside>
    </div>
  );
}