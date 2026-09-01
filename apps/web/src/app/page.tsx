"use client";

import Link from "next/link";
import { ArrowRight, ArrowsLeftRight as ArrowLeftRight, Receipt, SlidersHorizontal, Users } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Logo } from "@/components/brand/logo";

const splitTypes = [
  { label: "Equal", detail: "Split evenly across everyone" },
  { label: "Exact", detail: "Set each person's amount" },
  { label: "Percentage", detail: "Divide by custom percentages" },
  { label: "Shares", detail: "Weighted by shares, like 2:1:1" },
];

const steps = [
  {
    number: "1",
    title: "Start a group",
    detail: "Name it, add an icon, invite people with a link. No app store required to join.",
  },
  {
    number: "2",
    title: "Log an expense",
    detail: "Enter the amount and pick who paid. Split it equal, exact, by percentage, or by shares.",
  },
  {
    number: "3",
    title: "Settle up",
    detail: "SplitEven works out the minimum number of payments needed to zero everyone out.",
  },
];

const faqs = [
  {
    question: "Does everyone in the group need the app?",
    answer:
      "No. You can invite people by link, and they can view and settle their balance from a browser without installing anything.",
  },
  {
    question: "Can a group use more than one currency?",
    answer:
      "Each group has a default currency, and individual expenses can override it if someone paid in something else.",
  },
  {
    question: "How does the minimum-payments settle-up work?",
    answer:
      "Instead of everyone paying everyone, SplitEven simplifies the group's debts down to the fewest transactions that get everyone back to even.",
  },
  {
    question: "Is it free?",
    answer: "Yes, SplitEven is free to use for any group size.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <div className="flex items-center gap-2">
          <Logo size={32} />
          <span className="text-lg font-semibold tracking-tight">SplitEven</span>
        </div>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild className="rounded-full px-5">
            <Link href="/login">Get started</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero: asymmetric split, real product preview on the right */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pb-20 pt-10 sm:px-6 sm:pt-16 lg:grid-cols-[1.1fr_1fr] lg:gap-8 lg:pb-28">
          <div
            className="animate-in fade-in slide-in-from-bottom-3 flex flex-col items-start gap-5 duration-700"
            style={{ animationFillMode: "backwards" }}
          >
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Shared expenses, sorted
            </span>
            <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
              Split costs. See who owes whom.
            </h1>
            <p className="max-w-md text-lg text-muted-foreground">
              SplitEven keeps every shared expense in one ledger and settles the math in real
              time, so nobody has to be the one who brings it up.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button size="lg" asChild className="rounded-full px-7">
                <Link href="/login">
                  Get started <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Link
                href="#how-it-works"
                className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                See how splitting works
              </Link>
            </div>
          </div>

          {/* Real product preview: a live-styled balance card, not a fake screenshot */}
          <div
            className="animate-in fade-in slide-in-from-bottom-4 relative mx-auto w-full max-w-sm duration-700"
            style={{ animationDelay: "120ms", animationFillMode: "backwards" }}
          >
            <div className="absolute -right-4 -top-4 w-[85%] rotate-[4deg] rounded-lg border border-border/60 bg-card p-4 opacity-70 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-lg">
                  🏔️
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">Baguio Trip</p>
                </div>
              </div>
            </div>

            <div className="relative rounded-lg border border-border/60 bg-card p-5 shadow-md">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-light text-xl">
                  🏠
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">Apartment 4B</p>
                  <div className="mt-1.5 flex -space-x-2">
                    {["MJ", "RC", "AT", "KP"].map((name) => (
                      <Avatar key={name} className="h-6 w-6 border-2 border-card">
                        <AvatarFallback className="text-[10px]">{name}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-lg font-semibold tabular-nums text-positive">
                    +₱1,240.00
                  </p>
                  <p className="text-xs text-muted-foreground">you&apos;re owed</p>
                </div>
              </div>

              <div className="mt-4 space-y-2 border-t border-border/60 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Groceries (Robinsons)</span>
                  <span className="font-mono tabular-nums">₱860.00</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Wifi, June</span>
                  <span className="font-mono tabular-nums">₱1,499.00</span>
                </div>
              </div>

              <Button size="sm" className="mt-4 w-full rounded-full">
                Settle up
              </Button>
            </div>
          </div>
        </section>

        {/* How it works: numbered steps, a layout family distinct from the bento/chip/CTA sections below */}
        <section id="how-it-works" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="max-w-md text-2xl font-semibold tracking-tight sm:text-3xl">
            Three steps, start to settled
          </h2>
          <div className="mt-10 grid gap-10 sm:grid-cols-3 sm:gap-6">
            {steps.map((step, i) => (
              <div key={step.number} className="relative flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-sm font-semibold text-primary-foreground">
                    {step.number}
                  </span>
                  {i < steps.length - 1 && (
                    <span className="hidden h-px flex-1 bg-border sm:block" aria-hidden />
                  )}
                </div>
                <h3 className="font-medium">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features: asymmetric 3-cell bento, not three equal cards */}
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="max-w-md text-2xl font-semibold tracking-tight sm:text-3xl">
            Everything a group needs to stay square
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="flex flex-col justify-between gap-6 rounded-lg border border-border/60 bg-primary p-8 text-primary-foreground md:row-span-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
                <ArrowLeftRight className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-xl font-semibold">Real-time balances</h3>
                <p className="mt-2 text-sm text-primary-foreground/80">
                  Add an expense and every member sees the updated balance instantly. No group
                  chat spreadsheet, no chasing people down.
                </p>
              </div>
              <div className="rounded-lg bg-white/10 p-4 font-mono text-sm">
                <div className="flex justify-between tabular-nums">
                  <span className="text-primary-foreground/70">Mika owes Reg</span>
                  <span>₱620.00</span>
                </div>
                <div className="mt-2 flex justify-between tabular-nums">
                  <span className="text-primary-foreground/70">Ken owes Reg</span>
                  <span>₱310.00</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-card p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-primary">
                <Users className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-medium">Groups for every crew</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Trips, roommates, couples. Keep each group&apos;s expenses in its own ledger.
              </p>
            </div>

            <div className="rounded-lg border border-border/60 bg-card p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-primary">
                <Receipt className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-medium">Receipts and categories</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Attach a photo, tag the category, and filter your ledger later.
              </p>
            </div>
          </div>
        </section>

        {/* Split types: chip row, a different layout family from the bento above */}
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <div className="rounded-lg border border-border/60 bg-card p-8">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-primary">
              <SlidersHorizontal className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">Split it your way</h2>
            <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
              Not every cost divides evenly. Pick the method that fits.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {splitTypes.map((type) => (
                <div
                  key={type.label}
                  className="rounded-lg border border-border/60 bg-background p-4"
                >
                  <p className="font-medium">{type.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{type.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ: 2-column list, a layout family distinct from every section above */}
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="max-w-md text-2xl font-semibold tracking-tight sm:text-3xl">
            Questions people actually ask
          </h2>
          <div className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {faqs.map((faq) => (
              <div key={faq.question} className="border-t border-border/60 pt-4">
                <h3 className="font-medium">{faq.question}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Closing CTA band: full-width, distinct layout family */}
        <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
          <div className="flex flex-col items-start gap-5 rounded-lg border border-border/60 bg-primary-light p-10 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Start your first group in a minute
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Free to use. No card required.
              </p>
            </div>
            <Button size="lg" asChild className="shrink-0 rounded-full px-7">
              <Link href="/login">
                Get started <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        Built with Next.js, Supabase, and shadcn/ui.
      </footer>
    </div>
  );
}
