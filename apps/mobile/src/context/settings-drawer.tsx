import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface SettingsDrawerContextValue {
  visible: boolean;
  open: () => void;
  close: () => void;
}

const SettingsDrawerContext = createContext<SettingsDrawerContextValue | null>(null);

/**
 * One provider mounted at the tabs-layout root so every top-level screen's
 * avatar can open the same settings panel without each owning its own open
 * state — settings is reached from four different screens (Home, Groups,
 * Finances, Insights) and used to require a dedicated route per PROJECT_PLAN;
 * now it's a slide-in panel over whichever screen is active.
 */
export function SettingsDrawerProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const open = useCallback(() => setVisible(true), []);
  const close = useCallback(() => setVisible(false), []);
  const value = useMemo(() => ({ visible, open, close }), [visible, open, close]);
  return <SettingsDrawerContext.Provider value={value}>{children}</SettingsDrawerContext.Provider>;
}

export function useSettingsDrawer(): SettingsDrawerContextValue {
  const ctx = useContext(SettingsDrawerContext);
  if (!ctx) throw new Error("useSettingsDrawer must be used within SettingsDrawerProvider");
  return ctx;
}
