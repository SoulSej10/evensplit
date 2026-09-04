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
 * Real, SplitEven-specific terms of service (not placeholder copy) — shown
 * at the first-run acceptance gate alongside the Privacy Policy, and
 * reachable anytime from Settings for a read-only view.
 */
export function TermsOfServiceContent() {
  return (
    <View className="gap-5">
      <Text className="text-xs text-neutral-500">Last updated: 2026</Text>

      <Section title="What SplitEven is">
        SplitEven is a tool for tracking shared expenses and personal finances between people who trust each
        other. It records what group members say they paid and owe — it does not move money, verify
        payments, or act as a bank, payment processor, or escrow service. Settling up happens outside the
        app (cash, a payment app, a bank transfer); SplitEven just keeps the ledger.
      </Section>

      <Section title="Your data is your responsibility">
        Balances, expenses, and settlements are only as accurate as what you and your group members enter.
        SplitEven doesn't verify that a recorded expense actually happened or that a settlement was actually
        paid. Double-check anything before relying on it for a real financial decision.
      </Section>

      <Section title="No warranty">
        SplitEven is provided "as is," without warranty of any kind. We work to keep balance calculations
        correct and the app available, but we don't guarantee it will be error-free, uninterrupted, or fit
        for any particular purpose.
      </Section>

      <Section title="Limitation of liability">
        To the fullest extent permitted by law, SplitEven and its developer aren't liable for any financial
        loss, dispute between group members, or other damages arising from your use of the app, including
        from inaccurate balances, lost data, or downtime.
      </Section>

      <Section title="Account deletion">
        You can delete your account at any time from Settings. This disables your login permanently and
        removes your personal accounts, transactions, budgets, and categories. Group expenses and
        settlements you were part of stay visible to your former group members (with your profile
        anonymized) so their shared ledger stays accurate — deleting your account doesn't rewrite history
        other people rely on.
      </Section>

      <Section title="Acceptable use">
        Don't use SplitEven to store or share anything illegal, to harass another user, or to try to access
        another account or group you're not a member of.
      </Section>

      <Section title="Changes">
        These terms may be updated as the app changes. Continuing to use SplitEven after an update means you
        accept the revised terms.
      </Section>

      <Section title="Contact">
        Questions about these terms can be sent to jessanthony.tahil10@gmail.com.
      </Section>
    </View>
  );
}
