import { Text, View } from "react-native";

function Section({ title, children }: { title: string; children: string }) {
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title}</Text>
      <Text className="text-sm leading-5 text-neutral-500">{children}</Text>
    </View>
  );
}

/**
 * Real, SplitEven-specific privacy policy text (not placeholder copy) —
 * shared between the first-run acceptance gate ((auth)/privacy-policy.tsx)
 * and the read-only view reachable from Settings ((app)/privacy-policy.tsx).
 */
export function PrivacyPolicyContent() {
  return (
    <View className="gap-5">
      <Text className="text-xs text-neutral-500">Last updated: 2026</Text>

      <Section title="What we collect">
        Your email address, display name, and profile photo (if you add one); the groups, expenses,
        settlements, and personal accounts/transactions you create; and technical data needed to run the
        app, like your device's push notification token if you enable notifications.
      </Section>

      <Section title="How it's used">
        Solely to run SplitEven: showing your balances, syncing group expenses with the people you split
        with, and calculating your personal budgets. Your financial data is never sold, and it's never used
        for advertising.
      </Section>

      <Section title="Where it's stored">
        All data is stored in a Supabase-hosted database, protected by row-level security so only you and
        the members of your groups can read your groups' data. Personal (non-group) transactions are
        visible only to you.
      </Section>

      <Section title="Sharing with others">
        Group data (expenses, balances, settlements) is visible to the other members of that group — that's
        the point of a shared ledger. Your personal accounts, categories, and budgets are never shared with
        anyone, including other group members.
      </Section>

      <Section title="Your controls">
        You can export your personal ledger as a CSV at any time from Settings, and you can permanently
        delete your account from Settings as well. That disables your login and erases your personal
        accounts, transactions, budgets, and categories. Group expenses and settlements you were part of
        stay visible to your former group members (with your name replaced by "Deleted user") so their
        shared ledger isn't left broken — see Terms of Service for details.
      </Section>

      <Section title="Contact">
        Questions about this policy can be sent to jessanthony.tahil10@gmail.com.
      </Section>
    </View>
  );
}
