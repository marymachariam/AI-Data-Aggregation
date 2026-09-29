"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTour } from "@/lib/tour-context";
import { colors, font } from "@/lib/theme";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Brand } from "@/components/Brand";
import { FullPageLoader } from "@/components/FullPageLoader";
import { Icon, type IconName } from "@/components/ui/Icon";

interface AppShellProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

const NAV: { href: string; label: string; icon: IconName; tourId?: string }[] = [
  { href: "/dashboard", label: "Overview", icon: "overview", tourId: "nav-overview" },
  { href: "/sources", label: "Data sources", icon: "database", tourId: "nav-sources" },
];

export function AppShell({ title, subtitle, actions, children }: AppShellProps) {
  const { user, loading, logout } = useAuth();
  const { start: startTour } = useTour();
  const router = useRouter();
  const pathname = usePathname();
  const narrow = useMediaQuery("(max-width: 900px)");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) return <FullPageLoader />;

  const links = NAV.map((item) => {
    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        {...(item.tourId ? { "data-tour": item.tourId } : {})}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          fontSize: 14,
          fontWeight: 500,
          textDecoration: "none",
          whiteSpace: "nowrap",
          color: active ? "#ffffff" : colors.sidebarText,
          background: active ? colors.sidebarActive : "transparent",
          borderRadius: 8,
        }}
      >
        <Icon name={item.icon} />
        {item.label}
      </Link>
    );
  });

  const signOut = (
    <button
      type="button"
      onClick={logout}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: 0,
        fontSize: 13,
        color: colors.sidebarText,
        background: "none",
        border: "none",
        cursor: "pointer",
      }}
    >
      <Icon name="logout" size={16} />
      Sign out
    </button>
  );

  const tourLink = (
    <button
      type="button"
      onClick={startTour}
      style={{
        padding: 0,
        fontSize: 13,
        color: colors.sidebarText,
        background: "none",
        border: "none",
        cursor: "pointer",
      }}
    >
      Take the tour
    </button>
  );

  const header = (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 16,
        padding: narrow ? "20px 16px 0" : "32px 40px 0",
      }}
    >
      <div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>{title}</h1>
        {subtitle && <p style={{ margin: "4px 0 0", fontSize: 14, color: colors.textMuted }}>{subtitle}</p>}
      </div>
      {actions}
    </header>
  );

  const content = (
    <main style={{ padding: narrow ? "20px 16px 40px" : "24px 40px 48px", maxWidth: 1240, display: "grid", gap: 24 }}>
      {children}
    </main>
  );

  if (narrow) {
    return (
      <div style={{ minHeight: "100vh", fontFamily: font.sans, background: colors.bg }}>
        <div style={{ background: colors.sidebar, padding: "14px 16px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Brand light />
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {tourLink}
              {signOut}
            </div>
          </div>
          <nav style={{ display: "flex", gap: 4, marginTop: 12, overflowX: "auto" }}>{links}</nav>
        </div>
        {header}
        {content}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: font.sans, background: colors.bg }}>
      <aside
        style={{
          position: "sticky",
          top: 0,
          alignSelf: "flex-start",
          width: 248,
          height: "100vh",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          padding: 20,
          background: colors.sidebar,
        }}
      >
        <div style={{ padding: "4px 8px 24px" }}>
          <Brand light />
        </div>
        <nav style={{ display: "grid", gap: 4 }}>{links}</nav>
        <div style={{ marginTop: "auto", padding: 12, borderTop: `1px solid ${colors.sidebarBorder}` }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#ffffff" }}>{user.company_name}</div>
          <div style={{ margin: "2px 0 12px", fontSize: 12, color: colors.sidebarText, wordBreak: "break-all" }}>
            {user.email}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {tourLink}
            {signOut}
          </div>
        </div>
      </aside>
      <div style={{ flex: 1, minWidth: 0 }}>
        {header}
        {content}
      </div>
    </div>
  );
}