"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { errorMessage } from "@/lib/format";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface FormState {
  companyName: string;
  email: string;
  password: string;
  confirm: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const EMPTY: FormState = { companyName: "", email: "", password: "", confirm: "" };

function validate(v: FormState): FormErrors {
  const errors: FormErrors = {};
  if (v.companyName.trim().length < 2) errors.companyName = "Enter your company name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) errors.email = "Enter a valid work email address.";

  if (v.password.length < 10) errors.password = "Use at least 10 characters.";
  else if (!/[A-Z]/.test(v.password)) errors.password = "Include an uppercase letter.";
  else if (!/[a-z]/.test(v.password)) errors.password = "Include a lowercase letter.";
  else if (!/\d/.test(v.password)) errors.password = "Include a digit.";

  if (v.confirm !== v.password) errors.confirm = "Passwords do not match.";
  return errors;
}

export function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();
  const [values, setValues] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onChange = (key: keyof FormState) => (e: ChangeEvent<HTMLInputElement>) =>
    setValues((prev) => ({ ...prev, [key]: e.target.value }));

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);

    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await register({
        email: values.email.trim().toLowerCase(),
        password: values.password,
        company_name: values.companyName.trim(),
      });
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
        label="Company name"
        autoComplete="organization"
        value={values.companyName}
        onChange={onChange("companyName")}
        error={errors.companyName}
        required
      />
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
        autoComplete="new-password"
        value={values.password}
        onChange={onChange("password")}
        error={errors.password}
        hint="At least 10 characters with upper case, lower case, and a digit."
        required
      />
      <Input
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        value={values.confirm}
        onChange={onChange("confirm")}
        error={errors.confirm}
        required
      />
      <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
        <Button type="submit" loading={submitting} style={{ flex: 1 }}>
          Create account
        </Button>
        <Button type="reset" variant="secondary" disabled={submitting}>
          Reset
        </Button>
      </div>
    </form>
  );
}