import { useState } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";

/** Enter an invite code directly (as opposed to opening a shared invite link) to join a group. */
export function JoinGroupSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [code, setCode] = useState("");

  function onSubmit() {
    const trimmed = code.trim();
    if (!trimmed) {
      Alert.alert("Enter an invite code", "Ask a group member to share their invite code or link.");
      return;
    }
    onClose();
    setCode("");
    router.push(`/invite/${trimmed}`);
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Join a group"
      footer={
        <Button onPress={onSubmit} size="lg">
          Continue
        </Button>
      }
    >
      <TextField
        label="Invite code"
        placeholder="e.g. 4f9a21"
        value={code}
        onChangeText={setCode}
        autoCapitalize="none"
      />
    </BottomSheet>
  );
}
