export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      expense_shares: {
        Row: {
          expense_id: string
          id: string
          share_amount: number
          user_id: string
        }
        Insert: {
          expense_id: string
          id?: string
          share_amount: number
          user_id: string
        }
        Update: {
          expense_id?: string
          id?: string
          share_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_shares_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_shares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          created_by: string
          currency: string
          description: string
          expense_date: string
          group_id: string
          id: string
          is_recurring: boolean
          next_occurrence_date: string | null
          paid_by: string
          paid_from_account_id: string | null
          receipt_url: string | null
          recurrence_parent_id: string | null
          recurrence_rule: string | null
          split_type: Database["public"]["Enums"]["split_type"]
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          created_by: string
          currency?: string
          description: string
          expense_date?: string
          group_id: string
          id?: string
          is_recurring?: boolean
          next_occurrence_date?: string | null
          paid_by: string
          paid_from_account_id?: string | null
          receipt_url?: string | null
          recurrence_parent_id?: string | null
          recurrence_rule?: string | null
          split_type?: Database["public"]["Enums"]["split_type"]
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          description?: string
          expense_date?: string
          group_id?: string
          id?: string
          is_recurring?: boolean
          next_occurrence_date?: string | null
          paid_by?: string
          paid_from_account_id?: string | null
          receipt_url?: string | null
          recurrence_parent_id?: string | null
          recurrence_rule?: string | null
          split_type?: Database["public"]["Enums"]["split_type"]
        }
        Relationships: [
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_paid_from_account_id_fkey"
            columns: ["paid_from_account_id"]
            isOneToOne: false
            referencedRelation: "personal_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_recurrence_parent_id_fkey"
            columns: ["recurrence_parent_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["group_member_role"]
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["group_member_role"]
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["group_member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string
          currency: string
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by: string
          currency?: string
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          accepted_by: string | null
          created_by: string
          expires_at: string
          group_id: string
          id: string
          invite_code: string
          invited_email: string | null
        }
        Insert: {
          accepted_by?: string | null
          created_by: string
          expires_at?: string
          group_id: string
          id?: string
          invite_code?: string
          invited_email?: string | null
        }
        Update: {
          accepted_by?: string | null
          created_by?: string
          expires_at?: string
          group_id?: string
          id?: string
          invite_code?: string
          invited_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invites_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_accounts: {
        Row: {
          archived_at: string | null
          created_at: string
          currency: string
          id: string
          name: string
          starting_balance: number
          type: Database["public"]["Enums"]["personal_account_type"]
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          name: string
          starting_balance?: number
          type?: Database["public"]["Enums"]["personal_account_type"]
          user_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          name?: string
          starting_balance?: number
          type?: Database["public"]["Enums"]["personal_account_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_budgets: {
        Row: {
          category_id: string
          created_at: string
          id: string
          monthly_limit: number
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          monthly_limit: number
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          monthly_limit?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "personal_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_budgets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          kind: Database["public"]["Enums"]["personal_category_kind"]
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          kind: Database["public"]["Enums"]["personal_category_kind"]
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["personal_category_kind"]
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_transactions: {
        Row: {
          account_id: string
          amount: number
          category_id: string | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["personal_transaction_kind"]
          linked_expense_id: string | null
          linked_group_id: string | null
          linked_settlement_id: string | null
          note: string | null
          occurred_at: string
          transfer_account_id: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          category_id?: string | null
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["personal_transaction_kind"]
          linked_expense_id?: string | null
          linked_group_id?: string | null
          linked_settlement_id?: string | null
          note?: string | null
          occurred_at?: string
          transfer_account_id?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          category_id?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["personal_transaction_kind"]
          linked_expense_id?: string | null
          linked_group_id?: string | null
          linked_settlement_id?: string | null
          note?: string | null
          occurred_at?: string
          transfer_account_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "personal_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "personal_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_transactions_linked_expense_id_fkey"
            columns: ["linked_expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_transactions_linked_group_id_fkey"
            columns: ["linked_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_transactions_linked_settlement_id_fkey"
            columns: ["linked_settlement_id"]
            isOneToOne: false
            referencedRelation: "settlements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_transactions_transfer_account_id_fkey"
            columns: ["transfer_account_id"]
            isOneToOne: false
            referencedRelation: "personal_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          created_at: string
          expo_push_token: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expo_push_token: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expo_push_token?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      settlements: {
        Row: {
          amount: number
          from_account_id: string | null
          from_user: string
          group_id: string
          id: string
          method: string | null
          note: string | null
          settled_at: string
          to_account_id: string | null
          to_user: string
        }
        Insert: {
          amount: number
          from_account_id?: string | null
          from_user: string
          group_id: string
          id?: string
          method?: string | null
          note?: string | null
          settled_at?: string
          to_account_id?: string | null
          to_user: string
        }
        Update: {
          amount?: number
          from_account_id?: string | null
          from_user?: string
          group_id?: string
          id?: string
          method?: string | null
          note?: string | null
          settled_at?: string
          to_account_id?: string | null
          to_user?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlements_from_account_id_fkey"
            columns: ["from_account_id"]
            isOneToOne: false
            referencedRelation: "personal_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_from_user_fkey"
            columns: ["from_user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "personal_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_to_user_fkey"
            columns: ["to_user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          default_currency: string
          display_name: string
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          default_currency?: string
          display_name: string
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          default_currency?: string
          display_name?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_group_invite: { Args: { p_invite_id: string }; Returns: string }
      confirm_settlement_receipt: {
        Args: { p_settlement_id: string; p_to_account_id: string }
        Returns: undefined
      }
      create_group_expense: {
        Args: {
          p_amount: number
          p_category: string
          p_currency: string
          p_description: string
          p_expense_date: string
          p_group_id: string
          p_is_recurring: boolean
          p_paid_by: string
          p_paid_from_account_id?: string
          p_receipt_url: string
          p_recurrence_rule: string
          p_shares: Json
          p_split_type: Database["public"]["Enums"]["split_type"]
        }
        Returns: string
      }
      is_group_member: { Args: { target_group_id: string }; Returns: boolean }
      is_group_owner: { Args: { target_group_id: string }; Returns: boolean }
      preview_invite: {
        Args: { p_invite_code: string }
        Returns: {
          group_id: string
          group_name: string
          invite_id: string
          is_valid: boolean
        }[]
      }
      record_settlement: {
        Args: {
          p_amount: number
          p_from_account_id?: string
          p_from_user: string
          p_group_id: string
          p_method: string
          p_note: string
          p_to_user: string
        }
        Returns: string
      }
      update_group_expense: {
        Args: {
          p_amount: number
          p_category: string
          p_currency: string
          p_description: string
          p_expense_date: string
          p_expense_id: string
          p_paid_by: string
          p_paid_from_account_id?: string
          p_receipt_url: string
          p_shares: Json
          p_split_type: Database["public"]["Enums"]["split_type"]
        }
        Returns: undefined
      }
    }
    Enums: {
      group_member_role: "owner" | "member"
      personal_account_type:
        | "cash"
        | "card"
        | "wallet"
        | "savings"
        | "investment"
      personal_category_kind: "income" | "expense"
      personal_transaction_kind:
        | "income"
        | "expense"
        | "transfer"
        | "group_advance"
        | "group_reimbursement"
      split_type: "equal" | "exact" | "percentage" | "shares"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      group_member_role: ["owner", "member"],
      personal_account_type: [
        "cash",
        "card",
        "wallet",
        "savings",
        "investment",
      ],
      personal_category_kind: ["income", "expense"],
      personal_transaction_kind: [
        "income",
        "expense",
        "transfer",
        "group_advance",
        "group_reimbursement",
      ],
      split_type: ["equal", "exact", "percentage", "shares"],
    },
  },
} as const
