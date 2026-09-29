"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { colors } from "@/lib/theme";
import { AuthShell } from "@/components/AuthShell";
import { FullPageLoader } from "@/components/FullPageLoader";
import { RegisterForm } from "@/components/RegisterForm";

export default function RegisterPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  if (loading || user) return <FullPageLoader />;

  return (
    <AuthShell
      title="Create your company account"
      subtitle="Set up a private workspace for your team's data."
      footer={
        <>
          Already registered?{" "}
          <Link href="/login" style={{ color: colors.primary, fontWeight: 600, textDecoration: "none" }}>
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}