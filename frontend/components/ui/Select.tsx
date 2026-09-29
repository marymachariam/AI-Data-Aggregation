"use client";

import { useId, useState, type SelectHTMLAttributes } from "react";
import { colors, radius } from "@/lib/theme";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  hint?: string;
}

export function Select({ label, options, hint, id, style, onFocus, onBlur, ...rest }: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label htmlFor={selectId} style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
        {label}
      </label>
      <select
        id={selectId}
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
          border: `1px solid ${focused ? colors.primary : colors.borderStrong}`,
          borderRadius: radius.md,
          outline: "none",
          boxShadow: focused ? `0 0 0 3px ${colors.primarySoft}` : "none",
          ...style,
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && <span style={{ fontSize: 12, color: colors.textMuted }}>{hint}</span>}
    </div>
  );
}