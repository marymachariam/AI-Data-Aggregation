"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTour } from "@/lib/tour-context";
import { TOUR_STEPS } from "@/lib/tour";
import { colors, radius, shadow } from "@/lib/theme";
import { Button } from "@/components/ui/Button";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function TourOverlay() {
  const { active, stepIndex, next, prev, skip } = useTour();
  const router = useRouter();
  const pathname = usePathname();
  const [rect, setRect] = useState<Rect | null>(null);

  const step = TOUR_STEPS[stepIndex];

  useEffect(() => {
    if (!active || !step) return;
    if (pathname !== step.route) router.push(step.route);
  }, [active, step, pathname, router]);

  useEffect(() => {
    if (!active || !step || pathname !== step.route) {
      setRect(null);
      return;
    }

    let attempts = 0;
    let timer: number;

    const locate = () => {
      const el = document.querySelector(step.selector);
      if (el) {
        const box = el.getBoundingClientRect();
        setRect({ top: box.top, left: box.left, width: box.width, height: box.height });
        return;
      }
      attempts += 1;
      if (attempts < 40) timer = window.setTimeout(locate, 100);
    };
    locate();

    const onViewportChange = () => {
      const el = document.querySelector(step.selector);
      if (el) {
        const box = el.getBoundingClientRect();
        setRect({ top: box.top, left: box.left, width: box.width, height: box.height });
      }
    };
    window.addEventListener("scroll", onViewportChange, true);
    window.addEventListener("resize", onViewportChange);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onViewportChange, true);
      window.removeEventListener("resize", onViewportChange);
    };
  }, [active, step, pathname]);

  if (!active || !step) return null;

  const padding = 8;
  const highlightStyle = rect
    ? {
        position: "fixed" as const,
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
        borderRadius: radius.md,
        boxShadow: `0 0 0 4px ${colors.primary}, 0 0 0 9999px rgba(15,23,42,0.55)`,
        pointerEvents: "none" as const,
        zIndex: 90,
        transition: "top 150ms ease, left 150ms ease, width 150ms ease, height 150ms ease",
      }
    : { position: "fixed" as const, inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 90 };

  const tooltipTop = rect
    ? Math.min(rect.top + rect.height + padding + 12, window.innerHeight - 200)
    : window.innerHeight / 2 - 80;
  const tooltipLeft = rect
    ? Math.min(Math.max(rect.left, 16), window.innerWidth - 336)
    : window.innerWidth / 2 - 160;

  return (
    <>
      <div style={highlightStyle} />
      <div
        role="dialog"
        aria-label={step.title}
        style={{
          position: "fixed",
          zIndex: 91,
          top: tooltipTop,
          left: tooltipLeft,
          width: 320,
          padding: 20,
          background: colors.surface,
          borderRadius: radius.lg,
          boxShadow: shadow.overlay,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600, color: colors.primary, marginBottom: 6 }}>
          Step {stepIndex + 1} of {TOUR_STEPS.length}
        </div>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{step.title}</h3>
        <p style={{ margin: "8px 0 20px", fontSize: 14, lineHeight: 1.5, color: colors.textMuted }}>{step.body}</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Button variant="ghost" size="sm" onClick={skip}>
            Skip tour
          </Button>
          <div style={{ display: "flex", gap: 8 }}>
            {stepIndex > 0 && (
              <Button variant="secondary" size="sm" onClick={prev}>
                Back
              </Button>
            )}
            <Button size="sm" onClick={next}>
              {stepIndex + 1 === TOUR_STEPS.length ? "Done" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}