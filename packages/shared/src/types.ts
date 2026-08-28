/**
 * Core domain types for EvenSplit, mirroring the Postgres schema defined in
 * supabase/migrations. Keep in sync with §4.2 of PROJECT_PLAN.md.
 */

export type UUID = string;
export type ISODateString = string;
export type ISODateTimeString = string;

export type GroupMemberRole = "owner" | "member";

export type SplitType = "equal" | "exact" | "percentage" | "shares";

export interface User {
  id: UUID;
  display_name: string;
  avatar_url: string | null;
  default_currency: string;
  created_at: ISODateTimeString;
}

export interface Group {
  id: UUID;
  name: string;
  icon: string | null;
  currency: string;
  created_by: UUID;
  created_at: ISODateTimeString;
  archived_at: ISODateTimeString | null;
}

export interface GroupMember {
  id: UUID;
  group_id: UUID;
  user_id: UUID;
  role: GroupMemberRole;
  joined_at: ISODateTimeString;
}

export interface Expense {
  id: UUID;
  group_id: UUID;
  description: string;
  amount: number;
  currency: string;
  paid_by: UUID;
  split_type: SplitType;
  category: string | null;
  expense_date: ISODateString;
  receipt_url: string | null;
  created_by: UUID;
  created_at: ISODateTimeString;
  is_recurring: boolean;
  recurrence_rule: string | null;
  /** Set when this expense was auto-generated from a recurring template expense. */
  recurrence_parent_id: UUID | null;
  /** For a recurring template expense, the date the next instance is due. */
  next_occurrence_date: ISODateString | null;
  /**
   * The payer's own personal account that fronted this expense's full
   * amount, if any. Only meaningful when the caller is `paid_by` — set via
   * create_group_expense()/update_group_expense(), which also mirrors the
   * payer's own share and any advanced-for-others amount into
   * personal_transactions. Null means this expense has no personal-account
   * linkage (the common case for anyone who isn't the payer, or a payer who
   * didn't choose to link an account).
   */
  paid_from_account_id: UUID | null;
}

export interface ExpenseShare {
  id: UUID;
  expense_id: UUID;
  user_id: UUID;
  share_amount: number;
}

export interface Settlement {
  id: UUID;
  group_id: UUID;
  from_user: UUID;
  to_user: UUID;
  amount: number;
  method: string | null;
  settled_at: ISODateTimeString;
  note: string | null;
  /** from_user's own account this payment was made from, set via record_settlement(). */
  from_account_id: UUID | null;
  /**
   * to_user's own account the reimbursement landed in. Unlike
   * from_account_id (known at settlement time by the payer), this is
   * usually null until to_user later calls confirm_settlement_receipt() —
   * only they can attribute the inbound cash to one of their accounts.
   */
  to_account_id: UUID | null;
}

export interface Invite {
  id: UUID;
  group_id: UUID;
  invited_email: string | null;
  invite_code: string;
  created_by: UUID;
  expires_at: ISODateTimeString;
  accepted_by: UUID | null;
}

/** Input used to build the participant list for a new expense's split. */
export interface SplitParticipantInput {
  user_id: UUID;
  /**
   * Meaning depends on split_type:
   * - equal: ignored
   * - exact: absolute currency amount for this participant
   * - percentage: 0-100 percentage for this participant
   * - shares: relative weight (e.g. 1, 2, 3) for this participant
   */
  value?: number;
}

/** A per-user net balance within a single group. */
export interface UserGroupBalance {
  user_id: UUID;
  /** Positive = the group owes this user. Negative = this user owes the group. */
  balance: number;
}

/** A single suggested/derived payment from one user to another. */
export interface PairwiseDebt {
  from_user: UUID;
  to_user: UUID;
  amount: number;
}

/**
 * A registered Expo push notification token for a user's device (Phase 6
 * stretch). Populated client-side after Expo Notifications permission grant.
 */
export interface PushToken {
  id: UUID;
  user_id: UUID;
  expo_push_token: string;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
}

// ─────────────────────────────────────────────────────────────────────────
// Personal budgeting ("My Money") — a per-user tracker, deliberately
// independent of the group-splitting types above (no group_id anywhere).
// ─────────────────────────────────────────────────────────────────────────

export type PersonalAccountType = "cash" | "card" | "wallet" | "savings" | "investment";
export type PersonalCategoryKind = "income" | "expense";
/**
 * "group_advance" and "group_reimbursement" represent cash movements caused
 * by shared/group expenses rather than the user's own spending or income:
 * - group_advance: money that left an account to cover a portion of a group
 *   expense that other members owe back (a receivable, not personal spend).
 * - group_reimbursement: money that came back in as that receivable gets
 *   repaid (not personal income).
 * Both still move the account balance like expense/income respectively, but
 * are excluded from personal spending/income aggregates
 * (see computeCategoryBreakdown, computeSharedFinanceSummary in personalFinance.ts).
 */
export type PersonalTransactionKind = "income" | "expense" | "transfer" | "group_advance" | "group_reimbursement";

export interface PersonalAccount {
  id: UUID;
  user_id: UUID;
  name: string;
  type: PersonalAccountType;
  currency: string;
  starting_balance: number;
  icon: string | null;
  created_at: ISODateTimeString;
  archived_at: ISODateTimeString | null;
}

export interface PersonalCategory {
  id: UUID;
  user_id: UUID;
  name: string;
  icon: string | null;
  kind: PersonalCategoryKind;
  created_at: ISODateTimeString;
}

export interface PersonalTransaction {
  id: UUID;
  user_id: UUID;
  account_id: UUID;
  /** Destination account — set only when kind is "transfer". */
  transfer_account_id: UUID | null;
  category_id: UUID | null;
  kind: PersonalTransactionKind;
  amount: number;
  note: string | null;
  occurred_at: ISODateTimeString;
  created_at: ISODateTimeString;
  /**
   * The following three fields are set only on rows auto-generated by
   * create_group_expense/update_group_expense/record_settlement/
   * confirm_settlement_receipt (see supabase/migrations/0014). They let the
   * UI show "From <group>" and navigate back to the source expense/
   * settlement, and let deleting/editing that source cascade-clean these
   * rows instead of leaving orphaned personal-account history.
   */
  linked_expense_id: UUID | null;
  linked_settlement_id: UUID | null;
  linked_group_id: UUID | null;
}

export interface PersonalBudget {
  id: UUID;
  user_id: UUID;
  category_id: UUID;
  monthly_limit: number;
  created_at: ISODateTimeString;
}
