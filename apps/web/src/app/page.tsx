import Link from "next/link";
import { ArrowRight, Receipt, Users, Wallet, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Users,
    title: "Groups for every crew",
    description: "Trips, roommates, couples — keep every group's expenses in one clean ledger.",
  },
  {
    icon: Receipt,
    title: "Split it your way",
    description: "Equal, exact amounts, percentages, or weighted shares — whatever's fair.",
  },
  {
    icon: Zap,
    title: "Real-time balances",
    description: "Everyone sees who owes whom the second an expense is added — no math required.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-6">
        <div className="flex items-center gap-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Wallet className="h-4 w-4" />
          </span>
          <span className="text-lg tracking-tight">EvenSplit</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link href="/login">Get started</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-20 text-center">
          <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-medium text-primary">
            The friendly ledger for shared expenses
          </span>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Split costs. See who owes whom.
            <br /> Settle up without the awkwardness.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            EvenSplit tracks shared expenses for roommates, trips, and households — in real time,
            with a settle-up flow that actually feels good to use.
          </p>
          <Button size="lg" asChild className="rounded-full px-8">
            <Link href="/login">
              Start splitting <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </section>

        <section className="mx-auto grid max-w-5xl gap-4 px-4 pb-24 sm:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="rounded-2xl border-border/60 shadow-sm">
              <CardContent className="flex flex-col gap-3 pt-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="font-medium">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>

      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        Built with Next.js, Supabase, and shadcn/ui.
      </footer>
    </div>
  );
}
