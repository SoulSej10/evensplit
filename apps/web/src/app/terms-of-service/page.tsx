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

/** Public page — real, SplitEven-specific terms of service, linked from Settings and available without signing in. */
export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Terms of Service</h1>
      <p className="mb-8 text-xs text-muted-foreground">Last updated: 2026</p>

      <div className="space-y-6">
        <Section title="What SplitEven is">
          SplitEven is a tool for tracking shared expenses and personal finances between people who trust
          each other. It records what group members say they paid and owe — it does not move money, verify
          payments, or act as a bank, payment processor, or escrow service. Settling up happens outside the
          app (cash, a payment app, a bank transfer); SplitEven just keeps the ledger.
        </Section>

        <Section title="Your data is your responsibility">
          Balances, expenses, and settlements are only as accurate as what you and your group members enter.
          SplitEven doesn&apos;t verify that a recorded expense actually happened or that a settlement was
          actually paid. Double-check anything before relying on it for a real financial decision.
        </Section>

        <Section title="No warranty">
          SplitEven is provided &quot;as is,&quot; without warranty of any kind. We work to keep balance
          calculations correct and the app available, but we don&apos;t guarantee it will be error-free,
          uninterrupted, or fit for any particular purpose.
        </Section>

        <Section title="Limitation of liability">
          To the fullest extent permitted by law, SplitEven and its developer aren&apos;t liable for any
          financial loss, dispute between group members, or other damages arising from your use of the app,
          including from inaccurate balances, lost data, or downtime.
        </Section>

        <Section title="Account deletion">
          You can delete your account at any time from Settings. This disables your login permanently and
          removes your personal accounts, transactions, budgets, and categories. Group expenses and
          settlements you were part of stay visible to your former group members (with your profile
          anonymized) so their shared ledger stays accurate — deleting your account doesn&apos;t rewrite
          history other people rely on.
        </Section>

        <Section title="Acceptable use">
          Don&apos;t use SplitEven to store or share anything illegal, to harass another user, or to try to
          access another account or group you&apos;re not a member of.
        </Section>

        <Section title="Changes">
          These terms may be updated as the app changes. Continuing to use SplitEven after an update means
          you accept the revised terms.
        </Section>

        <Section title="Contact">
          Questions about these terms can be sent to jessanthony.tahil10@gmail.com.
        </Section>
      </div>
    </div>
  );
}
