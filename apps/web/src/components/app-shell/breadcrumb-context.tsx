"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

interface BreadcrumbLabelContextValue {
  label: string | null;
  setLabel: (label: string | null) => void;
}

const BreadcrumbLabelContext = createContext<BreadcrumbLabelContextValue | null>(null);

/**
 * Lets a leaf page (e.g. a specific group's detail page) override the last
 * breadcrumb segment with real data ("Baguio Trip 2026") once it loads,
 * instead of the TopBar showing a generic fallback the whole time. Scoped
 * per-AppShell instance, which is fine since each page mounts its own
 * AppShell.
 */
export function BreadcrumbLabelProvider({ children }: { children: ReactNode }) {
  const [label, setLabel] = useState<string | null>(null);
  const value = useMemo(() => ({ label, setLabel }), [label]);
  return <BreadcrumbLabelContext.Provider value={value}>{children}</BreadcrumbLabelContext.Provider>;
}

function useBreadcrumbLabelContext() {
  const ctx = useContext(BreadcrumbLabelContext);
  if (!ctx) throw new Error("useBreadcrumbLabelContext must be used within AppShell");
  return ctx;
}

export function useBreadcrumbLabel() {
  return useBreadcrumbLabelContext().label;
}

/** Call from a page with the real dynamic label once known (or null while loading/absent). */
export function useSetBreadcrumbLabel(label: string | null) {
  const { setLabel } = useBreadcrumbLabelContext();
  useEffect(() => {
    setLabel(label);
    return () => setLabel(null);
  }, [label, setLabel]);
}
