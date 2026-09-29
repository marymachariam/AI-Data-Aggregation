"use client";

import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { colors, radius } from "@/lib/theme";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

const PALETTE: Record<Variant, { bg: string; hover: string; color: string; border: string }> = {
  primary: { bg: colors.primary, hover: colors.primaryHover, color: "#ffffff", border: colors.primary },
  secondary: { bg: colors.surface, hover: colors.neutralSoft, color: colors.text, border: colors.borderStrong },
  danger: { bg: colors.danger, hover: colors.dangerHover, color: "#ffffff", border: colors.danger },
  ghost: { bg: "transparent", hover: colors.neutralSoft, color: colors.textMuted, border: "transparent" },
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  disabled,
  type = "button",
  style,
  children,
  onMouseEnter,
  onMouseLeave,
  ...rest
}: ButtonProps) {
  const [hover, setHover] = useState(false);
  const palette = PALETTE[variant];
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      {...rest}
      onMouseEnter={(e) => {
        setHover(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setHover(false);
        onMouseLeave?.(e);
      }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        width: fullWidth ? "100%" : undefined,
        height: size === "sm" ? 32 : 40,
        padding: size === "sm" ? "0 12px" : "0 16px",
        fontSize: size === "sm" ? 13 : 14,
        fontWeight: 600,
        color: palette.color,
        background: hover && !isDisabled ? palette.hover : palette.bg,
        border: `1px solid ${palette.border}`,
        borderRadius: radius.md,
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: isDisabled ? 0.6 : 1,
        transition: "background 120ms ease",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {loading && <Spinner size={14} />}
      {children}
    </button>
  );
}