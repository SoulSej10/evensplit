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
});
export type SettleUpInput = z.infer<typeof settleUpSchema>;

export const inviteSchema = z.object({
  group_id: uuidSchema,
  invited_email: z.string().trim().email().nullable().optional(),
});
export type InviteInput = z.infer<typeof inviteSchema>;
