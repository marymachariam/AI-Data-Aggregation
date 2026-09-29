"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { colors } from "@/lib/theme";
import { AuthShell } from "@/components/AuthShell";
import { FullPageLoader } from "@/components/FullPageLoader";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  if (loading || user) return <FullPageLoader />;

  return (
    <AuthShell
      title="Sign in"
      subtitle="Access your company's data workspace."
      footer={
        <>
          New to Aggre8?{" "}
          <Link href="/register" style={{ color: colors.primary, fontWeight: 600, textDecoration: "none" }}>
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}