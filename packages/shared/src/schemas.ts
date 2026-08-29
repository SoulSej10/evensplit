import { z } from "zod";

/**
 * Zod validation schemas shared by web + mobile forms, and reusable for
 * light runtime validation before writing to Supabase.
 */

export const uuidSchema = z.string().uuid();

export const currencyCodeSchema = z
  .string()
  .length(3)
  .regex(/^[A-Z]{3}$/, "Currency must be a 3-letter ISO 4217 code (e.g. USD)");

export const splitTypeSchema = z.enum(["equal", "exact", "percentage", "shares"]);

export const groupMemberRoleSchema = z.enum(["owner", "member"]);

export const profileSetupSchema = z.object({
  display_name: z.string().trim().min(1, "Name is required").max(80),
  avatar_url: z.string().url().nullable().optional(),
  default_currency: currencyCodeSchema,
});
export type ProfileSetupInput = z.infer<typeof profileSetupSchema>;

export const signUpSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const logInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1, "Password is required"),
});
export type LogInInput = z.infer<typeof logInSchema>;

export const passwordResetRequestSchema = z.object({
  email: z.string().trim().email(),
});
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;

export const passwordResetSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;

export const createGroupSchema = z.object({
  name: z.string().trim().min(1, "Group name is required").max(120),
  icon: z.string().max(16).nullable().optional(),
  currency: currencyCodeSchema,
});
export type CreateGroupInput = z.infer<typeof createGroupSchema>;

export const splitParticipantSchema = z.object({
  user_id: uuidSchema,
  value: z.number().finite().optional(),
});

export const createExpenseSchema = z
  .object({
    group_id: uuidSchema,
    description: z.string().trim().min(1, "Description is required").max(200),
    amount: z.number().positive("Amount must be greater than 0"),
    currency: currencyCodeSchema,
    paid_by: uuidSchema,
    split_type: splitTypeSchema,
    category: z.string().max(60).nullable().optional(),
    expense_date: z.string().min(1, "Date is required"),
    receipt_url: z.string().url().nullable().optional(),
    participants: z.array(splitParticipantSchema).min(1, "At least one participant is required"),
    is_recurring: z.boolean().optional(),
    /** Simple recurrence rule string, e.g. "FREQ=WEEKLY" or "FREQ=MONTHLY". */
    recurrence_rule: z.string().max(100).nullable().optional(),
    /**
     * Which of the payer's own personal accounts fronted this expense, if
     * any. Only meaningful when paid_by is the current user - passed to
     * create_group_expense()/update_group_expense() to mirror the cash
     * movement into personal_transactions.
     */
    paid_from_account_id: uuidSchema.nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.split_type === "exact") {
      const sum = data.participants.reduce((acc, p) => acc + (p.value ?? 0), 0);
      if (Math.abs(sum - data.amount) > 0.01) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Exact split amounts (${sum.toFixed(2)}) must sum to the total (${data.amount.toFixed(2)})`,
          path: ["participants"],
        });
      }
    }
    if (data.split_type === "percentage") {
      const sum = data.participants.reduce((acc, p) => acc + (p.value ?? 0), 0);
      if (Math.abs(sum - 100) > 0.01) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Percentages must sum to 100 (got ${sum.toFixed(2)})`,
          path: ["participants"],
        });
      }
    }
    if (data.split_type === "shares") {
      const sum = data.participants.reduce((acc, p) => acc + (p.value ?? 0), 0);
      if (sum <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Total shares must be greater than 0",
          path: ["participants"],
        });
      }
    }
  });
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const settleUpSchema = z.object({
  group_id: uuidSchema,
  from_user: uuidSchema,
  to_user: uuidSchema,
  amount: z.number().positive("Amount must be greater than 0"),
  method: z.string().max(60).nullable().optional(),
  note: z.string().max(300).nullable().optional(),
  /** The payer's own account this payment left from, if linked. Only settable by from_user. */
  from_account_id: uuidSchema.nullable().optional(),
});
export type SettleUpInput = z.infer<typeof settleUpSchema>;

/** Lets the receiving party attribute an already-recorded settlement's cash to one of their own accounts. */
export const confirmSettlementReceiptSchema = z.object({
  settlement_id: uuidSchema,
  to_account_id: uuidSchema,
});
export type ConfirmSettlementReceiptInput = z.infer<typeof confirmSettlementReceiptSchema>;

export const inviteSchema = z.object({
  group_id: uuidSchema,
  invited_email: z.string().trim().email().nullable().optional(),
});
export type InviteInput = z.infer<typeof inviteSchema>;

// ─────────────────────────────────────────────────────────────────────────
// Personal budgeting ("My Money")
// ─────────────────────────────────────────────────────────────────────────

export const personalAccountTypeSchema = z.enum(["cash", "card", "wallet", "savings", "investment"]);
export const personalCategoryKindSchema = z.enum(["income", "expense"]);
// Manually-created transactions can only ever be income/expense/transfer -
// group_advance/group_reimbursement are exclusively written by the
// create_group_expense/record_settlement/confirm_settlement_receipt RPCs
// (supabase/migrations/0014), never by a user filling out the add-transaction
// form, so they're deliberately excluded from this input-validation schema.
export const personalTransactionKindSchema = z.enum(["income", "expense", "transfer"]);

export const createPersonalAccountSchema = z.object({
  name: z.string().trim().min(1, "Account name is required").max(80),
  type: personalAccountTypeSchema,
  currency: currencyCodeSchema,
  starting_balance: z.number().finite().default(0),
  icon: z.string().max(16).nullable().optional(),
});
export type CreatePersonalAccountInput = z.infer<typeof createPersonalAccountSchema>;

export const createPersonalCategorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(60),
  icon: z.string().max(16).nullable().optional(),
  kind: personalCategoryKindSchema,
});
export type CreatePersonalCategoryInput = z.infer<typeof createPersonalCategorySchema>;

export const updatePersonalAccountSchema = createPersonalAccountSchema.partial();
export type UpdatePersonalAccountInput = z.infer<typeof updatePersonalAccountSchema>;

export const updatePersonalCategorySchema = createPersonalCategorySchema.partial();
export type UpdatePersonalCategoryInput = z.infer<typeof updatePersonalCategorySchema>;

export const createPersonalTransactionSchema = z
  .object({
    account_id: uuidSchema,
    transfer_account_id: uuidSchema.nullable().optional(),
    category_id: uuidSchema.nullable().optional(),
    kind: personalTransactionKindSchema,
    amount: z.number().positive("Amount must be greater than 0"),
    note: z.string().max(300).nullable().optional(),
    occurred_at: z.string().min(1, "Date is required"),
  })
  .superRefine((data, ctx) => {
    if (data.kind === "transfer") {
      if (!data.transfer_account_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Pick a destination account for a transfer",
          path: ["transfer_account_id"],
        });
      } else if (data.transfer_account_id === data.account_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Transfer accounts must be different",
          path: ["transfer_account_id"],
        });
      }
    }
  });
export type CreatePersonalTransactionInput = z.infer<typeof createPersonalTransactionSchema>;

export const createPersonalBudgetSchema = z.object({
  category_id: uuidSchema,
  monthly_limit: z.number().positive("Budget limit must be greater than 0"),
});
export type CreatePersonalBudgetInput = z.infer<typeof createPersonalBudgetSchema>;
