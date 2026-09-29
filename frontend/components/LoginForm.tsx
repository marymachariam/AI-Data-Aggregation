"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { errorMessage } from "@/lib/format";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface FormState {
  email: string;
  password: string;
}

const EMPTY: FormState = { email: "", password: "" };

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [values, setValues] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onChange = (key: keyof FormState) => (e: ChangeEvent<HTMLInputElement>) =>
    setValues((prev) => ({ ...prev, [key]: e.target.value }));

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);

    const found: Partial<Record<keyof FormState, string>> = {};
    if (!values.email.trim()) found.email = "Enter your email address.";
    if (!values.password) found.password = "Enter your password.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await login(values.email.trim().toLowerCase(), values.password);
      router.replace("/dashboard");
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setValues(EMPTY);
    setErrors({});
    setSubmitError(null);
  }

  return (
    <form onSubmit={handleSubmit} onReset={handleReset} noValidate style={{ display: "grid", gap: 16 }}>
      {submitError && <Alert tone="error">{submitError}</Alert>}
      <Input
        label="Work email"
        type="email"
        autoComplete="email"
        value={values.email}
        onChange={onChange("email")}
        error={errors.email}
        required
      />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        value={values.password}
        onChange={onChange("password")}
        error={errors.password}
        required
      />
      <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
        <Button type="submit" loading={submitting} style={{ flex: 1 }}>
          Sign in
        </Button>
        <Button type="reset" variant="secondary" disabled={submitting}>
          Reset
        </Button>
      </div>
    </form>
  );
}