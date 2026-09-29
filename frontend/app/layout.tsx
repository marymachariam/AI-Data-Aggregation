import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { colors, font } from "@/lib/theme";
import { AssistantWidget } from "@/components/AssistantWidget";
import { TourProvider } from "@/lib/tour-context";
import { TourOverlay } from "@/components/TourOverlay";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aggre8 — AI-ready data platform",
  description:
    "Connect your company tools and turn their data into AI-ready knowledge.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body
        style={{
          margin: 0,
          background: colors.bg,
          color: colors.text,
          fontFamily: font.sans,
        }}
      >
        <AuthProvider>
          <TourProvider>
            {children}
            <AssistantWidget />
            <TourOverlay />
          </TourProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
