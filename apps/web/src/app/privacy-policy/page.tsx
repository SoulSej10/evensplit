"use client";

import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react";

function Section({ title, children }: { title: string; children: string }) {
  return (
    <div className="space-y-1.5">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="text-sm leading-6 text-muted-foreground">{children}</p>
    </div>
  );
}

/** Public page — real, SplitEven-specific privacy policy, linked from Settings and available without signing in. */
export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mb-8 text-xs text-muted-foreground">Last updated: 2026</p>

      <div className="space-y-6">
        <Section title="What we collect">
          Your email address, display name, and profile photo (if you add one); the groups, expenses,
          settlements, and personal accounts/transactions you create; and technical data needed to run the
          app, like your device&apos;s push notification token if you enable notifications.
        </Section>

        <Section title="How it's used">
          Solely to run SplitEven: showing your balances, syncing group expenses with the people you split
          with, and calculating your personal budgets. Your financial data is never sold, and it&apos;s
          never used for advertising.
        </Section>

        <Section title="Where it's stored">
          All data is stored in a Supabase-hosted database, protected by row-level security so only you and
          the members of your groups can read your groups&apos; data. Personal (non-group) transactions are
          visible only to you.
        </Section>

        <Section title="Sharing with others">
          Group data (expenses, balances, settlements) is visible to the other members of that group -
          that&apos;s the point of a shared ledger. Your personal accounts, categories, and budgets are
          never shared with anyone, including other group members.
        </Section>

        <Section title="Your controls">
          You can export your personal ledger as a CSV at any time from Settings, and you can permanently
          delete your account from Settings as well. That disables your login and erases your personal
          accounts, transactions, budgets, and categories. Group expenses and settlements you were part of
          stay visible to your former group members (with your name replaced by &quot;Deleted user&quot;) so
          their shared ledger isn&apos;t left broken — see Terms of Service for details.
        </Section>

        <Section title="Contact">
          Questions about this policy can be sent to jessanthony.tahil10@gmail.com.
        </Section>
      </div>
    </div>
  );
}
