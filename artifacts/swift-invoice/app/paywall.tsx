import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTier } from "@/context/TierContext";
import { useColors } from "@/hooks/useColors";

const PRO_DEVICE_FEATURES = [
  "Unlimited invoices, no watermark",
  "3 invoice templates + logo upload",
  "All currencies",
  "Inventory management",
  "Client address book",
  "Revenue dashboard",
  "Manual data export & import",
];

const PRO_CLOUD_FEATURES = [
  "Everything in Pro",
  "Cloud backup & multi-device sync",
  "Send invoices by email",
  "Payment links (Stripe, Paystack, Flutterwave)",
  "Apple Pay & Google Pay via Stripe",
  "Invoice viewed tracking",
  "Recurring invoices",
];

export default function PaywallScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setTier } = useTier();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  // TODO: replace setTier stub with RevenueCat purchase
  async function handleBuyPro() {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setTier("pro_device");
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "Pro Unlocked",
      "All Pro features are now active.",
      [{ text: "Done", onPress: () => router.back() }]
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Close button */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon + heading */}
        <View style={styles.top}>
          <View style={[styles.iconBadge, { backgroundColor: colors.accent }]}>
            <Feather name="star" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Go Pro</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Choose the plan that fits you
          </Text>
        </View>

        {/* ── Card 1: Pro Device ── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Card header */}
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Pro</Text>
            <View style={[styles.priceBadge, { backgroundColor: colors.accent }]}>
              <Text style={[styles.priceBadgeText, { color: colors.primary }]}>$9.99 one-time</Text>
            </View>
          </View>

          {/* Feature list */}
          <View style={styles.featureList}>
            {PRO_DEVICE_FEATURES.map((feat) => (
              <View key={feat} style={styles.featureRow}>
                <Feather name="check" size={15} color={colors.success} />
                <Text style={[styles.featureText, { color: colors.foreground }]}>{feat}</Text>
              </View>
            ))}
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={[styles.ctaBtn, { backgroundColor: colors.secondary }]}
            onPress={handleBuyPro}
            activeOpacity={0.8}
          >
            <Text style={[styles.ctaBtnLabel, { color: colors.foreground }]}>
              Buy Pro — $9.99
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Card 2: Pro Cloud ── */}
        <View style={[styles.card, styles.cloudCard, { backgroundColor: colors.primary }]}>
          {/* Most popular pill */}
          <View style={styles.popularPill}>
            <Text style={[styles.popularText, { color: colors.primary }]}>MOST POPULAR</Text>
          </View>

          {/* Card header */}
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: "#ffffff" }]}>Pro Cloud</Text>
            <View style={styles.cloudPriceBadge}>
              <Text style={[styles.priceBadgeText, { color: "#ffffff" }]}>$4.99/mo</Text>
            </View>
          </View>

          {/* Feature list */}
          <View style={styles.featureList}>
            {PRO_CLOUD_FEATURES.map((feat) => (
              <View key={feat} style={styles.featureRow}>
                <Feather name="check" size={15} color="#ffffff" />
                <Text style={[styles.featureText, { color: "#ffffff" }]}>{feat}</Text>
              </View>
            ))}
          </View>

          {/* CTA — disabled */}
          <TouchableOpacity
            style={[styles.ctaBtn, styles.cloudCtaBtn]}
            disabled
            activeOpacity={0.8}
          >
            <Text style={[styles.ctaBtnLabel, { color: colors.primary }]}>Coming Soon</Text>
          </TouchableOpacity>

          {/* Waitlist link */}
          <TouchableOpacity
            onPress={() => Linking.openURL("mailto:support@billify.app")}
            style={styles.waitlistRow}
          >
            <Text style={styles.waitlistText}>Join the waitlist →</Text>
          </TouchableOpacity>
        </View>

        {/* Disclaimer */}
        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          No ads • No tracking • Cancel anytime
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  closeBtn: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },

  content: { paddingHorizontal: 24, gap: 20 },

  top: { alignItems: "center", gap: 12, paddingVertical: 8 },
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

  // Cards
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 18,
  },
  cloudCard: {
    borderWidth: 0,
    position: "relative",
    overflow: "hidden",
  },

  // Most popular pill
  popularPill: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  popularText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },

  // Card header
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 90,
  },
  cardTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  priceBadge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  cloudPriceBadge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  priceBadgeText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  // Features
  featureList: { gap: 12 },
  featureRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  featureText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },

  // CTA buttons
  ctaBtn: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cloudCtaBtn: {
    backgroundColor: "#ffffff",
    opacity: 0.7,
  },
  ctaBtnLabel: { fontSize: 17, fontFamily: "Inter_700Bold" },

  // Waitlist
  waitlistRow: { alignItems: "center", paddingBottom: 4 },
  waitlistText: {
    color: "#ffffff",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },

  disclaimer: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    paddingVertical: 4,
  },
});
