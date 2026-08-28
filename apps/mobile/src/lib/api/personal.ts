import type {
  CreatePersonalAccountInput,
  CreatePersonalBudgetInput,
  CreatePersonalCategoryInput,
  CreatePersonalTransactionInput,
  PersonalAccount,
  PersonalBudget,
  PersonalCategory,
  PersonalTransaction,
} from "@evensplit/shared";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { ParsedPersonalRow } from "@/lib/csv";

// ─────────────────────────────────────────────────────────────────────────
// Accounts
// ─────────────────────────────────────────────────────────────────────────

export async function fetchPersonalAccounts(userId: string): Promise<PersonalAccount[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("personal_accounts")
    .select("*")
    .eq("user_id", userId)
    .is("archived_at", null)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as PersonalAccount[];
}

export async function createPersonalAccount(
  userId: string,
  input: CreatePersonalAccountInput
): Promise<PersonalAccount> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("personal_accounts")
    .insert({ user_id: userId, ...input })
    .select()
    .single();
  if (error) throw error;
  return data as PersonalAccount;
}

export async function archivePersonalAccount(accountId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("personal_accounts")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", accountId);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────
// Categories
// ─────────────────────────────────────────────────────────────────────────

export async function fetchPersonalCategories(userId: string): Promise<PersonalCategory[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("personal_categories")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as PersonalCategory[];
}

export async function createPersonalCategory(
  userId: string,
  input: CreatePersonalCategoryInput
): Promise<PersonalCategory> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("personal_categories")
    .insert({ user_id: userId, ...input, icon: input.icon ?? null })
    .select()
    .single();
  if (error) throw error;
  return data as PersonalCategory;
}

export async function deletePersonalCategory(categoryId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("personal_categories").delete().eq("id", categoryId);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────
// Transactions
// ─────────────────────────────────────────────────────────────────────────

/** A personal transaction with its linked group's name/icon embedded, when linked_group_id is set. */
export interface PersonalTransactionWithGroup extends PersonalTransaction {
  groups: { name: string; icon: string | null } | null;
}

export async function fetchPersonalTransactions(userId: string): Promise<PersonalTransactionWithGroup[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("personal_transactions")
    .select("*, groups:linked_group_id(name, icon)")
    .eq("user_id", userId)
    .order("occurred_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as PersonalTransactionWithGroup[];
}

export async function createPersonalTransaction(
  userId: string,
  input: CreatePersonalTransactionInput
): Promise<PersonalTransaction> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("personal_transactions")
    .insert({
      user_id: userId,
      account_id: input.account_id,
      transfer_account_id: input.transfer_account_id ?? null,
      category_id: input.category_id ?? null,
      kind: input.kind,
      amount: input.amount,
      note: input.note ?? null,
      occurred_at: input.occurred_at,
    })
    .select()
    .single();
  if (error) throw error;
  return data as PersonalTransaction;
}

export async function deletePersonalTransaction(transactionId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("personal_transactions").delete().eq("id", transactionId);
  if (error) throw error;
}

/**
 * Commits a parsed personal-ledger CSV import: resolves each row's account/
 * category by name (case-insensitive), creating one only when no match
 * exists, then inserts the transaction. Sequential (not Promise.all) so a
 * newly-created account/category is resolved once and reused by later rows
 * instead of racing to create duplicates.
 */
export async function importPersonalLedgerRows(
  userId: string,
  rows: ParsedPersonalRow[],
  accounts: PersonalAccount[],
  categories: PersonalCategory[],
  defaultCurrency: string
): Promise<{ imported: number }> {
  const accountByName = new Map(accounts.map((a) => [a.name.toLowerCase(), a]));
  const categoryByName = new Map(categories.map((c) => [c.name.toLowerCase(), c]));

  async function resolveAccount(name: string): Promise<PersonalAccount> {
    const existing = accountByName.get(name.toLowerCase());
    if (existing) return existing;
    const created = await createPersonalAccount(userId, {
      name,
      type: "cash",
      currency: defaultCurrency,
      starting_balance: 0,
    });
    accountByName.set(name.toLowerCase(), created);
    return created;
  }

  async function resolveCategory(name: string, kind: "income" | "expense"): Promise<PersonalCategory> {
    const existing = categoryByName.get(name.toLowerCase());
    if (existing) return existing;
    const created = await createPersonalCategory(userId, { name, icon: null, kind });
    categoryByName.set(name.toLowerCase(), created);
    return created;
  }

  let imported = 0;
  for (const row of rows) {
    const account = await resolveAccount(row.account);
    let categoryId: string | null = null;
    if (row.category && row.type !== "transfer") {
      const category = await resolveCategory(row.category, row.type);
      categoryId = category.id;
    }
    let transferAccountId: string | null = null;
    if (row.type === "transfer" && row.transferTo) {
      const transferAccount = await resolveAccount(row.transferTo);
      transferAccountId = transferAccount.id;
    }
    await createPersonalTransaction(userId, {
      account_id: account.id,
      transfer_account_id: transferAccountId,
      category_id: categoryId,
      kind: row.type,
      amount: row.amount,
      note: row.note,
      occurred_at: new Date(row.date).toISOString(),
    });
    imported++;
  }
  return { imported };
}

// ─────────────────────────────────────────────────────────────────────────
// Budgets
// ─────────────────────────────────────────────────────────────────────────

export async function fetchPersonalBudgets(userId: string): Promise<PersonalBudget[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("personal_budgets")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as PersonalBudget[];
}

export async function upsertPersonalBudget(
  userId: string,
  input: CreatePersonalBudgetInput
): Promise<PersonalBudget> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("personal_budgets")
    .upsert({ user_id: userId, ...input }, { onConflict: "user_id,category_id" })
    .select()
    .single();
  if (error) throw error;
  return data as PersonalBudget;
}

export async function deletePersonalBudget(budgetId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("personal_budgets").delete().eq("id", budgetId);
  if (error) throw error;
}
