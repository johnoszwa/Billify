import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useInvoice } from "@/context/InvoiceContext";
import { useColors } from "@/hooks/useColors";

const BENEFITS = [
  { icon: "x-circle" as const, label: "Remove PDF watermark" },
  { icon: "file-plus" as const, label: "Unlimited invoices" },
  { icon: "hard-drive" as const, label: "Unlimited local storage" },
  { icon: "wifi-off" as const, label: "Works fully offline" },
  { icon: "lock" as const, label: "GDPR-safe, no tracking" },
];

export default function PaywallScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { upgradeToPro } = useInvoice();
  const [isLoading, setIsLoading] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function handlePurchase(type: "onetime" | "monthly") {
    setIsLoading(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await upgradeToPro();
    setIsLoading(false);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "Welcome to Pro!",
      "All Pro features are now unlocked.",
      [{ text: "Done", onPress: () => router.back() }]
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <View style={[styles.content, { paddingBottom: bottomPad + 24 }]}>
        <View style={styles.top}>
          <View style={[styles.iconBadge, { backgroundColor: colors.accent }]}>
            <Feather name="star" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Upgrade to Pro</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            One-time purchase. No subscriptions required.
          </Text>
        </View>

        <View style={[styles.benefitsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {BENEFITS.map((benefit, i) => (
            <View key={benefit.label}>
              {i > 0 && <View style={[styles.benefitDivider, { backgroundColor: colors.border }]} />}
              <View style={styles.benefitRow}>
                <View style={[styles.benefitIcon, { backgroundColor: colors.accent }]}>
                  <Feather name={benefit.icon} size={16} color={colors.primary} />
                </View>
                <Text style={[styles.benefitText, { color: colors.foreground }]}>
                  {benefit.label}
                </Text>
                <Feather name="check" size={16} color={colors.success} />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => handlePurchase("onetime")}
            disabled={isLoading}
          >
            <Text style={[styles.primaryBtnLabel, { color: colors.primaryForeground }]}>
              {isLoading ? "Processing..." : "Buy Pro — One-time"}
            </Text>
            <Text style={[styles.primaryBtnPrice, { color: colors.primaryForeground, opacity: 0.8 }]}>
              $9.99 forever
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
            onPress={() => handlePurchase("monthly")}
            disabled={isLoading}
          >
            <Text style={[styles.secondaryBtnLabel, { color: colors.foreground }]}>
              Subscribe Monthly
            </Text>
            <Text style={[styles.secondaryBtnPrice, { color: colors.mutedForeground }]}>
              $1.99 / month
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          No ads, no tracking, no cloud sync. Your data stays on your device.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  closeBtn: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  content: { flex: 1, paddingHorizontal: 24, gap: 24, justifyContent: "center" },
  top: { alignItems: "center", gap: 12 },
  iconBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5, textAlign: "center" },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  benefitsCard: { borderRadius: 20, borderWidth: 1, overflow: "hidden" },
  benefitRow: { flexDirection: "row", alignItems: "center", padding: 16, gap: 14 },
  benefitDivider: { height: 1, marginLeft: 62 },
  benefitIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  benefitText: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  buttons: { gap: 12 },
  primaryBtn: {
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
    gap: 4,
  },
  primaryBtnLabel: { fontSize: 17, fontFamily: "Inter_700Bold" },
  primaryBtnPrice: { fontSize: 13, fontFamily: "Inter_400Regular" },
  secondaryBtn: {
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
  },
  secondaryBtnLabel: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  secondaryBtnPrice: { fontSize: 13, fontFamily: "Inter_400Regular" },
  disclaimer: { textAlign: "center", fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
});
