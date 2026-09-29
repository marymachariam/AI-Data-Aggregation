"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { TOUR_STEPS } from "./tour";

const STORAGE_KEY = "aggre8_tour_completed";

function hasCompletedTour(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(STORAGE_KEY) === "true";
}

interface TourContextValue {
  active: boolean;
  stepIndex: number;
  completed: boolean;
  start: () => void;
  next: () => void;
  prev: () => void;
  skip: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [completed, setCompleted] = useState<boolean>(hasCompletedTour());

  const finish = useCallback(() => {
    setActive(false);
    setCompleted(true);
    window.localStorage.setItem(STORAGE_KEY, "true");
  }, []);

  const start = useCallback(() => {
    setStepIndex(0);
    setActive(true);
  }, []);

  const next = useCallback(() => {
    setStepIndex((i) => {
      if (i + 1 >= TOUR_STEPS.length) {
        finish();
        return i;
      }
      return i + 1;
    });
  }, [finish]);

  const prev = useCallback(() => setStepIndex((i) => Math.max(0, i - 1)), []);
  const skip = useCallback(() => finish(), [finish]);

  const value = useMemo(
    () => ({ active, stepIndex, completed, start, next, prev, skip }),
    [active, stepIndex, completed, start, next, prev, skip],
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used inside TourProvider");
  return ctx;
}