import type { PersonalAccount, PersonalCategory, PersonalTransaction, Settlement, User } from "@evensplit/shared";
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

// ─────────────────────────────────────────────────────────────────────────
// Personal ledger (My Money) import/export
// ─────────────────────────────────────────────────────────────────────────

/**
 * Builds a CSV of every personal transaction (excluding group_advance/
 * group_reimbursement, which are auto-generated mirrors of group activity,
 * not user-owned records this app can re-import). Same column shape as the
 * mobile export, so a file exported from one platform imports on the other.
 */
export function buildPersonalLedgerCsv(
  transactions: Pick<PersonalTransaction, "occurred_at" | "kind" | "amount" | "account_id" | "transfer_account_id" | "category_id" | "note">[],
  accounts: PersonalAccount[],
  categories: PersonalCategory[]
): string {
  function accountName(id: string | null): string {
    return accounts.find((a) => a.id === id)?.name ?? "";
  }
  function categoryName(id: string | null): string {
    return categories.find((c) => c.id === id)?.name ?? "";
  }

  const lines: string[] = [];
  lines.push(csvRow(["EvenSplit personal ledger export"]));
  lines.push("");
  lines.push(csvRow(["Date", "Type", "Amount", "Category", "Account", "Transfer To", "Note"]));
  for (const t of transactions) {
    if (t.kind === "group_advance" || t.kind === "group_reimbursement") continue;
    lines.push(
      csvRow([
        t.occurred_at,
        t.kind,
        t.amount.toFixed(2),
        categoryName(t.category_id),
        accountName(t.account_id),
        t.kind === "transfer" ? accountName(t.transfer_account_id) : "",
        t.note ?? "",
      ])
    );
  }
  return lines.join("\r\n");
}

/** Generates the personal ledger CSV and triggers a browser download. */
export function downloadPersonalLedgerCsv(
  transactions: Pick<PersonalTransaction, "occurred_at" | "kind" | "amount" | "account_id" | "transfer_account_id" | "category_id" | "note">[],
  accounts: PersonalAccount[],
  categories: PersonalCategory[]
): void {
  const csv = buildPersonalLedgerCsv(transactions, accounts, categories);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `evensplit-personal-${Date.now()}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/** Parses one CSV line, honoring double-quoted fields (RFC 4180-ish). */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQuotes = false;
      } else cur += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

export interface ParsedPersonalRow {
  date: string;
  type: "expense" | "income" | "transfer";
  amount: number;
  category: string | null;
  account: string;
  transferTo: string | null;
  note: string | null;
}

export interface ParsePersonalLedgerResult {
  rows: ParsedPersonalRow[];
  errors: string[];
}

/**
 * Parses a personal-ledger CSV (this app's own export format — see
 * buildPersonalLedgerCsv - not a generic importer for other apps' exports).
 * Skips/reports invalid rows rather than failing the whole import.
 */
export function parsePersonalLedgerCsv(csvText: string): ParsePersonalLedgerResult {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const headerIndex = lines.findIndex((l) => l.toLowerCase().startsWith("date,type,amount"));
  if (headerIndex === -1) {
    return { rows: [], errors: ["Couldn't find the expected header row (Date, Type, Amount, ...)."] };
  }

  const rows: ParsedPersonalRow[] = [];
  const errors: string[] = [];
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const [date, type, amountStr, category, account, transferTo, note] = parseCsvLine(lines[i]);
    if (!date || !type || !amountStr || !account) {
      errors.push(`Row ${i + 1}: missing a required field.`);
      continue;
    }
    const kind = type.trim().toLowerCase();
    if (kind !== "expense" && kind !== "income" && kind !== "transfer") {
      errors.push(`Row ${i + 1}: unknown type "${type}".`);
      continue;
    }
    const amount = Number(amountStr);
    if (!Number.isFinite(amount) || amount <= 0) {
      errors.push(`Row ${i + 1}: invalid amount "${amountStr}".`);
      continue;
    }
    rows.push({
      date: date.trim(),
      type: kind,
      amount,
      category: category?.trim() || null,
      account: account.trim(),
      transferTo: transferTo?.trim() || null,
      note: note?.trim() || null,
    });
  }
  return { rows, errors };
}

/** Counts of what an import will create, shown to the user before they commit. */
export function summarizePersonalImport(
  rows: ParsedPersonalRow[],
  accounts: PersonalAccount[],
  categories: PersonalCategory[]
): { rowCount: number; newAccounts: string[]; newCategories: string[] } {
  const accountNames = new Set(accounts.map((a) => a.name.toLowerCase()));
  const categoryNames = new Set(categories.map((c) => c.name.toLowerCase()));
  const newAccounts = new Set<string>();
  const newCategories = new Set<string>();
  for (const r of rows) {
    if (!accountNames.has(r.account.toLowerCase())) newAccounts.add(r.account);
    if (r.transferTo && !accountNames.has(r.transferTo.toLowerCase())) newAccounts.add(r.transferTo);
    if (r.category && !categoryNames.has(r.category.toLowerCase())) newCategories.add(r.category);
  }
  return { rowCount: rows.length, newAccounts: [...newAccounts], newCategories: [...newCategories] };
}
