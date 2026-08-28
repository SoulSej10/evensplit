import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import type { PersonalAccount, PersonalCategory, PersonalTransaction, User } from "@evensplit/shared";
import type { ExpenseWithShares } from "@/lib/api/expenses";
import type { Settlement } from "@evensplit/shared";

/** Escapes a value for a single CSV field (RFC 4180-ish: quote if it contains a comma, quote, or newline). */
function csvField(value: string | number | null | undefined): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function csvRow(fields: (string | number | null | undefined)[]): string {
  return fields.map(csvField).join(",");
}

/**
 * Builds a CSV string covering a group's full ledger: every expense (one row
 * per expense, with the payer and split type — not one row per share, to
 * keep the export readable) followed by every settlement. Two logical
 * sections separated by a blank row + header, since expenses and
 * settlements have different columns.
 */
export function buildGroupLedgerCsv(
  groupName: string,
  expenses: ExpenseWithShares[],
  settlements: Settlement[],
  memberById: Map<string, User | null>
): string {
  function memberName(userId: string): string {
    return memberById.get(userId)?.display_name ?? "Unknown";
  }

  const lines: string[] = [];
  lines.push(csvRow([`EvenSplit ledger export — ${groupName}`]));
  lines.push("");

  lines.push(csvRow(["Expenses"]));
  lines.push(
    csvRow(["Date", "Description", "Amount", "Currency", "Paid By", "Category", "Split Type", "Recurring"])
  );
  for (const e of expenses) {
    lines.push(
      csvRow([
        e.expense_date,
        e.description,
        e.amount.toFixed(2),
        e.currency,
        memberName(e.paid_by),
        e.category ?? "",
        e.split_type,
        e.is_recurring ? e.recurrence_rule ?? "yes" : "",
      ])
    );
  }

  lines.push("");
  lines.push(csvRow(["Settlements"]));
  lines.push(csvRow(["Date", "From", "To", "Amount", "Method", "Note"]));
  for (const s of settlements) {
    lines.push(
      csvRow([
        s.settled_at,
        memberName(s.from_user),
        memberName(s.to_user),
        s.amount.toFixed(2),
        s.method ?? "",
        s.note ?? "",
      ])
    );
  }

  return lines.join("\n");
}

/**
 * Writes the CSV to a temp file (cache directory) and opens the system
 * share sheet. Returns false (without throwing) if sharing isn't available
 * on this device/platform — the caller should show a friendly message.
 */
export async function exportAndShareCsv(fileName: string, csv: string): Promise<boolean> {
  const available = await Sharing.isAvailableAsync();
  if (!available) return false;

  const dir = new Directory(Paths.cache, "evensplit-exports");
  if (!dir.exists) dir.create({ intermediates: true });

  const file = new File(dir, fileName);
  if (file.exists) file.delete();
  file.create();
  file.write(csv);

  await Sharing.shareAsync(file.uri, {
    mimeType: "text/csv",
    dialogTitle: "Export group ledger",
    UTI: "public.comma-separated-values-text",
  });

  return true;
}

// ─────────────────────────────────────────────────────────────────────────
// Personal ledger (My Money) import/export
// ─────────────────────────────────────────────────────────────────────────

/**
 * Builds a CSV of every personal transaction (excluding group_advance/
 * group_reimbursement, which are auto-generated mirrors of group activity,
 * not user-owned records this app can re-import). One row per transaction;
 * transfers carry their destination account in "Transfer To".
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
  return lines.join("\n");
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
 * Skips/reports invalid rows rather than failing the whole import, so one
 * bad line doesn't block the rest.
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

/** Reads a CSV file (picked via expo-document-picker) as text. */
export async function readCsvFile(uri: string): Promise<string> {
  const file = new File(uri);
  return file.text();
}
