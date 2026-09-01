import { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { ChartBar as BarChart3, Users, Wallet, Sparkle as Sparkles, type Icon as LucideIcon } from "phosphor-react-native";
import { Button } from "@/components/ui/Button";
import { hasSeenOnboardingTour, setOnboardingTourShown } from "@/lib/device-flags";

interface Step {
  icon: LucideIcon;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    icon: Sparkles,
    title: "Welcome to SplitEven",
    body: "Split shared expenses with friends and track your own money, all in one app.",
  },
  {
    icon: Users,
    title: "Groups",
    body: "Create a group for a trip or household, add expenses, and SplitEven works out who owes who.",
  },
  {
    icon: Wallet,
    title: "Finances",
    body: "Log your personal income, expenses, and transfers across your own accounts and budgets.",
  },
  {
    icon: BarChart3,
    title: "Insights",
    body: "See where your money's going with category breakdowns and spending trends.",
  },
];

/**
 * One-time, first-launch welcome tour - a simple sequence of full-screen
 * step cards rather than element-anchored coach marks (there's no
 * equivalent of web's react-joyride for React Native without pulling in a
 * heavier native-measurement dependency), gated by a device flag so it
 * only ever shows once per install.
 */
export function OnboardingTour() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    void hasSeenOnboardingTour().then((seen) => {
      if (!seen) setVisible(true);
    });
  }, []);

  function finish() {
    setVisible(false);
    void setOnboardingTourShown();
  }

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const Icon = current.icon;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 items-center justify-center bg-black/60 px-6">
        <View className="w-full max-w-sm items-center gap-5 rounded-3xl bg-surface p-6 dark:bg-surface-dark">
          <Pressable onPress={finish} className="absolute right-4 top-4">
            <Text className="text-sm font-medium text-neutral-500">Skip</Text>
          </Pressable>

          <View className="mt-4 h-16 w-16 items-center justify-center rounded-full bg-primary-light">
            <Icon color="#16A88F" size={28} />
          </View>

          <Text className="text-center text-lg font-bold text-neutral-900 dark:text-neutral-100">
            {current.title}
          </Text>
          <Text className="text-center text-sm text-neutral-500">{current.body}</Text>

          <View className="mt-1 flex-row gap-1.5">
            {STEPS.map((_, i) => (
              <View
                key={i}
                className={i === step ? "h-1.5 w-4 rounded-full bg-primary" : "h-1.5 w-1.5 rounded-full bg-neutral-500/30"}
              />
            ))}
          </View>

          <Button size="lg" className="w-full" onPress={() => (isLast ? finish() : setStep((s) => s + 1))}>
            <Text className="font-semibold text-white">{isLast ? "Get started" : "Next"}</Text>
          </Button>
        </View>
      </View>
    </Modal>
  );
}
