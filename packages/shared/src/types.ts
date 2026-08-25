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
