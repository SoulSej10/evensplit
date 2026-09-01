"use client";

import { useMemo } from "react";
import { computeAllAccountBalances, filterTransactionsForCurrentMonth } from "@evensplit/shared";
import { ArrowDownLeft, ArrowUpRight } from "@phosphor-icons/react";
import { usePersonalAccounts, usePersonalTransactions } from "@/hooks/use-personal";
import { formatMoney } from "@/lib/format";

/**
 * Always-visible hero summary at the top of Finances - total balance across
 * every account plus this month's income/expense, mirroring the mobile app
 * so the section reads as a real financial overview, not just CRUD tabs.
 */
export function FinancesSummaryCard() {
  const { data: accounts } = usePersonalAccounts();
  const { data: transactions } = usePersonalTransactions();

  const { total, currency, monthIncome, monthExpense } = useMemo(() => {
    const balances = computeAllAccountBalances(accounts ?? [], transactions ?? []);
    const total = balances.reduce((sum, b) => sum + b.balance, 0);

    let monthIncome = 0;
    let monthExpense = 0;
    for (const tx of filterTransactionsForCurrentMonth(transactions ?? [])) {
      if (tx.kind === "income") monthIncome += tx.amount;
      if (tx.kind === "expense") monthExpense += tx.amount;
    }

    return { total, currency: accounts?.[0]?.currency ?? "PHP", monthIncome, monthExpense };
  }, [accounts, transactions]);

  if (!accounts || accounts.length === 0) return null;

  return (
    <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-primary-deep to-primary px-6 py-5 text-primary-foreground shadow-sm">
      <p className="text-xs font-medium text-primary-foreground/70">Total balance</p>
      <p className="mt-1 text-3xl font-extrabold">{formatMoney(total, currency)}</p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-sm">
        <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">
            <ArrowDownLeft className="h-3.5 w-3.5" />
          </span>
          <span>
            <span className="block text-[10px] text-primary-foreground/70">Income (mo.)</span>
            <span className="block text-sm font-bold">{formatMoney(monthIncome, currency)}</span>
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
          <span>
            <span className="block text-[10px] text-primary-foreground/70">Expense (mo.)</span>
            <span className="block text-sm font-bold">{formatMoney(monthExpense, currency)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
