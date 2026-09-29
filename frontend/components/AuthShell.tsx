"use client";

import type { ReactNode } from "react";
import { colors, font } from "@/lib/theme";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Brand } from "@/components/Brand";

interface AuthShellProps {
  title: string;
  subtitle: string;
  footer: ReactNode;
  children: ReactNode;
}

const POINTS = [
  "Connect the tools your company already uses",
  "Data is cleaned, chunked, and indexed automatically",
  "Every company's data stays isolated and private",
];

export function AuthShell({ title, subtitle, footer, children }: AuthShellProps) {
  const narrow = useMediaQuery("(max-width: 900px)");

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: font.sans, background: colors.bg }}>
      {!narrow && (
        <aside
          style={{
            flex: "0 0 42%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 64,
            background: colors.sidebar,
            color: "#ffffff",
          }}
        >
          <Brand light />
          <div>
            <h2 style={{ margin: 0, fontSize: 32, lineHeight: 1.2, fontWeight: 700, letterSpacing: "-0.02em" }}>
              Turn scattered company data into AI-ready knowledge.
            </h2>
            <ul style={{ margin: "32px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 14 }}>
              {POINTS.map((point) => (
                <li key={point} style={{ display: "flex", gap: 12, fontSize: 15, color: colors.sidebarText }}>
                  <span style={{ color: colors.primary }}>●</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <span style={{ fontSize: 12, color: colors.sidebarText }}>© {new Date().getFullYear()} Aggre8</span>
        </aside>
      )}
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 440 }}>
          {narrow && (
            <div style={{ marginBottom: 32 }}>
              <Brand />
            </div>
          )}
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>{title}</h1>
          <p style={{ margin: "6px 0 28px", fontSize: 14, color: colors.textMuted }}>{subtitle}</p>
          {children}
          <div style={{ marginTop: 24, fontSize: 14, color: colors.textMuted, textAlign: "center" }}>{footer}</div>
        </div>
      </main>
    </div>
  );
}