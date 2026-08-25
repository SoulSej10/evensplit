/**
 * Auto-generated from the live Supabase project (opwiuqodrnhkysmbukme) via
 * the Supabase MCP `generate_typescript_types` tool. Regenerate by re-running
 * that tool after schema changes — do not hand-edit.
 *
 * Cross-checked against the hand-written domain types in ./types.ts: field
 * names and nullability match exactly, no drift as of generation time.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      expense_shares: {
        Row: {
          expense_id: string;
          id: string;
          share_amount: number;
          user_id: string;
        };
        Insert: {
          expense_id: string;
          id?: string;
          share_amount: number;
          user_id: string;
        };
        Update: {
          expense_id?: string;
          id?: string;
          share_amount?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expense_shares_expense_id_fkey";
            columns: ["expense_id"];
            isOneToOne: false;
            referencedRelation: "expenses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expense_shares_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      expenses: {
        Row: {
          amount: number;
          category: string | null;
          created_at: string;
          created_by: string;
          currency: string;
          description: string;
          expense_date: string;
          group_id: string;
          id: string;
          is_recurring: boolean;
          paid_by: string;
          receipt_url: string | null;
          recurrence_rule: string | null;
          split_type: Database["public"]["Enums"]["split_type"];
        };
        Insert: {
          amount: number;
          category?: string | null;
          created_at?: string;
          created_by: string;
          currency?: string;
          description: string;
          expense_date?: string;
          group_id: string;
          id?: string;
          is_recurring?: boolean;
          paid_by: string;
          receipt_url?: string | null;
          recurrence_rule?: string | null;
          split_type?: Database["public"]["Enums"]["split_type"];
        };
        Update: {
          amount?: number;
          category?: string | null;
          created_at?: string;
          created_by?: string;
          currency?: string;
          description?: string;
          expense_date?: string;
          group_id?: string;
          id?: string;
          is_recurring?: boolean;
          paid_by?: string;
          receipt_url?: string | null;
          recurrence_rule?: string | null;
          split_type?: Database["public"]["Enums"]["split_type"];
        };
        Relationships: [
          {
            foreignKeyName: "expenses_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_paid_by_fkey";
            columns: ["paid_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      group_members: {
        Row: {
          group_id: string;
          id: string;
          joined_at: string;
          role: Database["public"]["Enums"]["group_member_role"];
          user_id: string;
        };
        Insert: {
          group_id: string;
          id?: string;
          joined_at?: string;
          role?: Database["public"]["Enums"]["group_member_role"];
          user_id: string;
        };
        Update: {
          group_id?: string;
          id?: string;
          joined_at?: string;
          role?: Database["public"]["Enums"]["group_member_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "group_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      groups: {
        Row: {
          archived_at: string | null;
          created_at: string;
          created_by: string;
          currency: string;
          icon: string | null;
          id: string;
          name: string;
        };
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          created_by: string;
          currency?: string;
          icon?: string | null;
          id?: string;
          name: string;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          created_by?: string;
          currency?: string;
          icon?: string | null;
          id?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "groups_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      invites: {
        Row: {
          accepted_by: string | null;
          created_by: string;
          expires_at: string;
          group_id: string;
          id: string;
          invite_code: string;
          invited_email: string | null;
        };
        Insert: {
          accepted_by?: string | null;
          created_by: string;
          expires_at?: string;
          group_id: string;
          id?: string;
          invite_code?: string;
          invited_email?: string | null;
        };
        Update: {
          accepted_by?: string | null;
          created_by?: string;
          expires_at?: string;
          group_id?: string;
          id?: string;
          invite_code?: string;
          invited_email?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "invites_accepted_by_fkey";
            columns: ["accepted_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invites_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invites_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
        ];
      };
      settlements: {
        Row: {
          amount: number;
          from_user: string;
          group_id: string;
          id: string;
          method: string | null;
          note: string | null;
          settled_at: string;
          to_user: string;
        };
        Insert: {
          amount: number;
          from_user: string;
          group_id: string;
          id?: string;
          method?: string | null;
          note?: string | null;
          settled_at?: string;
          to_user: string;
        };
        Update: {
          amount?: number;
          from_user?: string;
          group_id?: string;
          id?: string;
          method?: string | null;
          note?: string | null;
          settled_at?: string;
          to_user?: string;
        };
        Relationships: [
          {
            foreignKeyName: "settlements_from_user_fkey";
            columns: ["from_user"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "settlements_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "settlements_to_user_fkey";
            columns: ["to_user"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          default_currency: string;
          display_name: string;
          id: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          default_currency?: string;
          display_name: string;
          id: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          default_currency?: string;
          display_name?: string;
          id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_group_member: { Args: { target_group_id: string }; Returns: boolean };
      is_group_owner: { Args: { target_group_id: string }; Returns: boolean };
    };
    Enums: {
      group_member_role: "owner" | "member";
      split_type: "equal" | "exact" | "percentage" | "shares";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export const Constants = {
  public: {
    Enums: {
      group_member_role: ["owner", "member"],
      split_type: ["equal", "exact", "percentage", "shares"],
    },
  },
} as const;
