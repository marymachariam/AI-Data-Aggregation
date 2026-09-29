"use client";

import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/format";
import { getSourceType, SOURCE_TYPES } from "@/lib/sourceTypes";
import { colors } from "@/lib/theme";
import type { Source } from "@/lib/types";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";

interface AddSourceModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (source: Source) => void | Promise<void>;
}

export function AddSourceModal({ open, onClose, onCreated }: AddSourceModalProps) {
  const [typeValue, setTypeValue] = useState(SOURCE_TYPES[0].value);
  const [name, setName] = useState("");
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const definition = getSourceType(typeValue) ?? SOURCE_TYPES[0];

  function reset() {
    setTypeValue(SOURCE_TYPES[0].value);
    setName("");
    setCredentials({});
    setErrors({});
    setSubmitError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleTypeChange(value: string) {
    setTypeValue(value);
    setCredentials({});
    setErrors({});
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);

    const found: Record<string, string> = {};
    if (!name.trim()) found.name = "Give this source a name.";
    for (const field of definition.fields) {
      if (field.required && !(credentials[field.key] ?? "").trim()) {
        found[field.key] = `${field.label} is required.`;
      }
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const cleaned: Record<string, string> = {};
    for (const field of definition.fields) {
      const value = (credentials[field.key] ?? "").trim();
      if (value) cleaned[field.key] = value;
    }

    setSubmitting(true);
    try {
      const created = await api.createSource({
        name: name.trim(),
        type: typeValue,
        credentials: Object.keys(cleaned).length > 0 ? cleaned : undefined,
      });
      reset();
      await onCreated(created);
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} title="Connect a data source" onClose={handleClose}>
      <form onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: 16 }}>
        {submitError && <Alert tone="error">{submitError}</Alert>}
        <Select
          label="Source type"
          value={typeValue}
          onChange={(e) => handleTypeChange(e.target.value)}
          options={SOURCE_TYPES.map((t) => ({ value: t.value, label: t.label }))}
        />
        <p style={{ margin: 0, fontSize: 13, color: colors.textMuted, lineHeight: 1.5 }}>{definition.description}</p>
        <Input
          label="Display name"
          placeholder={`e.g. ${definition.label} – Marketing`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          required
        />
        {definition.fields.map((field) => (
          <Input
            key={field.key}
            label={field.label}
            type={field.type}
            placeholder={field.placeholder}
            hint={field.hint}
            autoComplete="off"
            value={credentials[field.key] ?? ""}
            onChange={(e) => setCredentials((prev) => ({ ...prev, [field.key]: e.target.value }))}
            error={errors[field.key]}
            required={field.required}
          />
        ))}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 4 }}>
          <Button variant="secondary" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            Connect source
          </Button>
        </div>
      </form>
    </Modal>
  );
}