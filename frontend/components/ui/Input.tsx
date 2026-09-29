"use client";

import { useId, useState, type InputHTMLAttributes } from "react";
import { colors, radius } from "@/lib/theme";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, id, style, required, onFocus, onBlur, ...rest }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [focused, setFocused] = useState(false);
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label htmlFor={inputId} style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
        {label}
        {required && <span style={{ color: colors.danger }}> *</span>}
      </label>
      <input
        id={inputId}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...rest}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={{
          height: 40,
          padding: "0 12px",
          fontSize: 14,
          color: colors.text,
          background: colors.surface,
          border: `1px solid ${error ? colors.danger : focused ? colors.primary : colors.borderStrong}`,
          borderRadius: radius.md,
          outline: "none",
          boxShadow: focused ? `0 0 0 3px ${error ? colors.dangerSoft : colors.primarySoft}` : "none",
          ...style,
        }}
      />
      {error ? (
        <span id={`${inputId}-error`} style={{ fontSize: 12, color: colors.danger }}>
          {error}
        </span>
      ) : hint ? (
        <span id={`${inputId}-hint`} style={{ fontSize: 12, color: colors.textMuted }}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}