import type { Settlement, User } from "@evensplit/shared";
import type { ExpenseWithShares } from "@/lib/api/expenses";

/** Escapes a value for a single CSV field (RFC 4180-ish: quote if needed). */
function csvField(value: string | number | null | undefined): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function csvRow(values: (string | number | null | undefined)[]): string {
  return values.map(csvField).join(",");
}

/**
 * Builds a CSV of a group's full ledger — every expense and every
 * settlement, each row tagged with a `type` column so both event kinds can
 * share one file (Phase 6 CSV export).
 */
export function buildGroupLedgerCsv({
  expenses,
  settlements,
  members,
}: {
  expenses: ExpenseWithShares[];
  settlements: Settlement[];
  members: { user_id: string; users: User | null }[];
}): string {
  function name(userId: string) {
    return members.find((m) => m.user_id === userId)?.users?.display_name ?? userId;
  }

  const header = csvRow([
    "type",
    "date",
    "description",
    "amount",
    "currency",
    "paid_by",
    "to",
    "category",
    "split_type",
    "method",
    "note",
  ]);

  const expenseRows = expenses.map((e) =>
    csvRow([
      "expense",
      e.expense_date,
      e.description,
      e.amount,
      e.currency,
      name(e.paid_by),
      "",
      e.category ?? "",
      e.split_type,
      "",
      "",
    ])
  );

  const settlementRows = settlements.map((s) =>
    csvRow([
      "settlement",
      s.settled_at,
      "",
      s.amount,
      "",
      name(s.from_user),
      name(s.to_user),
      "",
      "",
      s.method ?? "",
      s.note ?? "",
    ])
  );

  return [header, ...expenseRows, ...settlementRows].join("\r\n");
}

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "group";
}

/** Generates the CSV and triggers a browser download — no external library. */
export function downloadGroupLedgerCsv({
  groupName,
  expenses,
  settlements,
  members,
}: {
  groupName: string;
  expenses: ExpenseWithShares[];
  settlements: Settlement[];
  members: { user_id: string; users: User | null }[];
}): void {
  const csv = buildGroupLedgerCsv({ expenses, settlements, members });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${slugify(groupName)}-ledger.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
