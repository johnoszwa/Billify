import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { Invoice } from "@/context/InvoiceContext";
import { formatCurrency } from "@/utils/pdfGenerator";

interface Props {
  invoice: Invoice;
  currency: string;
  onPress: () => void;
  onDelete: () => void;
}

export function InvoiceCard({ invoice, currency, onPress, onDelete }: Props) {
  const colors = useColors();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  }

  function handlePressOut() {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  }

  function handlePress() {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  function handleDelete() {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDelete();
  }

  const initials = invoice.clientName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, transform: [{ scale: scaleAnim }] },
      ]}
    >
      {/* Main press area — NOT wrapping the delete button */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={styles.pressArea}
      >
        <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
        </View>

        <View style={styles.content}>
          <Text style={[styles.clientName, { color: colors.foreground }]} numberOfLines={1}>
            {invoice.clientName}
          </Text>
          <Text style={[styles.invoiceNum, { color: colors.mutedForeground }]}>
            {invoice.invoiceNumber} &bull; {invoice.date}
          </Text>
        </View>

        <Text style={[styles.amount, { color: colors.primary }]}>
          {formatCurrency(invoice.total, currency)}
        </Text>
      </TouchableOpacity>

      {/* Delete button — sibling of pressArea, NOT nested inside it */}
      <TouchableOpacity
        onPress={handleDelete}
        style={styles.deleteBtn}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 4 }}
      >
        <Feather name="trash-2" size={16} color={colors.mutedForeground} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  pressArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  content: {
    flex: 1,
    gap: 3,
  },
  clientName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  invoiceNum: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  amount: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    flexShrink: 0,
  },
  deleteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
