"use client";

import { useState } from "react";
import { BarChart3, Sparkles, Users, Wallet, type LucideIcon } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "evensplit:onboarding-tour-shown";

interface Step {
  icon: LucideIcon;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    icon: Sparkles,
    title: "Welcome to SplitEven",
    body: "Split shared expenses with friends and track your own money, all in one place.",
  },
  {
    icon: Users,
    title: "Groups",
    body: "Create a group for a trip or household, add expenses, and SplitEven works out who owes who.",
  },
  {
    icon: Wallet,
    title: "Finances",
    body: "Log your personal income, expenses, and transfers across your own accounts and budgets.",
  },
  {
    icon: BarChart3,
    title: "Insights",
    body: "See where your money's going with category breakdowns and spending trends.",
  },
];

/**
 * One-time, first-visit welcome tour - a simple sequence of step cards
 * rather than element-anchored coach marks (a react-joyride-style tour
 * needs stable target selectors on every page it points at, which the
 * still-evolving SaaS shell doesn't have yet), gated by localStorage so it
 * only ever shows once per browser.
 */
export function OnboardingTour() {
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(STORAGE_KEY) !== "true";
    } catch {
      // localStorage unavailable (e.g. privacy mode) - just skip the tour.
      return false;
    }
  });
  const [step, setStep] = useState(0);

  function finish() {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Best-effort only.
    }
  }

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const Icon = current.icon;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && finish()}>
      <DialogContent className="max-w-sm text-center" showCloseButton>
        <div className="flex flex-col items-center gap-4 py-2">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-light text-primary">
            <Icon className="h-6 w-6" />
          </span>
          <h2 className="text-lg font-semibold">{current.title}</h2>
          <p className="text-sm text-muted-foreground">{current.body}</p>
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={i === step ? "h-1.5 w-4 rounded-full bg-primary" : "h-1.5 w-1.5 rounded-full bg-muted-foreground/30"}
              />
            ))}
          </div>
          <Button className="w-full" onClick={() => (isLast ? finish() : setStep((s) => s + 1))}>
            {isLast ? "Get started" : "Next"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
