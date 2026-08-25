import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import type { User } from "@evensplit/shared";
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
