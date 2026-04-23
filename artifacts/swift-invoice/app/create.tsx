import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Invoice, InvoiceItem, useInvoice } from "@/context/InvoiceContext";
import { useColors } from "@/hooks/useColors";
import { CURRENCY_SYMBOLS } from "@/utils/pdfGenerator";

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function freshItem(): InvoiceItem {
  return { id: generateId(), description: "", quantity: 1, unitPrice: 0, price: 0 };
}

export default function CreateScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { invoices, addInvoice, updateInvoice, generateInvoiceNumber, defaultCurrency } =
    useInvoice();

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([freshItem()]);

  const isEditing = !!id;
  const editingInvoice = isEditing ? invoices.find((inv) => inv.id === id) : undefined;

  useEffect(() => {
    if (editingInvoice) {
      setClientName(editingInvoice.clientName);
      setClientEmail(editingInvoice.clientEmail);
      // Support invoices created before quantity was added
      setItems(
        editingInvoice.items.map((item) => ({
          ...item,
          quantity: item.quantity ?? 1,
          unitPrice: item.unitPrice ?? item.price,
          price: item.price,
        }))
      );
    }
  }, []);

  const total = items.reduce((sum, item) => sum + (item.price || 0), 0);

  function updateItem(
    itemId: string,
    field: "description" | "quantity" | "unitPrice",
    raw: string
  ) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        if (field === "description") return { ...item, description: raw };
        const num = parseFloat(raw) || 0;
        const next = { ...item, [field]: num };
        next.price = (next.quantity || 0) * (next.unitPrice || 0);
        return next;
      })
    );
  }

  function addItem() {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setItems((prev) => [...prev, freshItem()]);
  }

  function removeItem(itemId: string) {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  }

  function handlePreview() {
    if (!clientName.trim()) {
      Alert.alert("Missing Info", "Please enter a client name.");
      return;
    }
    const validItems = items.filter(
      (item) => item.description.trim() && item.quantity > 0 && item.unitPrice > 0
    );
    if (validItems.length === 0) {
      Alert.alert(
        "Missing Items",
        "Please add at least one item with a description, quantity, and unit price."
      );
      return;
    }
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    const invoice: Invoice = {
      id: editingInvoice?.id ?? generateId(),
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim(),
      items: validItems,
      total: validItems.reduce((s, i) => s + i.price, 0),
      date: dateStr,
      invoiceNumber: editingInvoice?.invoiceNumber ?? generateInvoiceNumber(),
      status: "draft",
    };

    if (isEditing) {
      updateInvoice(invoice);
    } else {
      addInvoice(invoice);
    }

    router.push({ pathname: "/preview", params: { id: invoice.id } });
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const currencySymbol = CURRENCY_SYMBOLS[defaultCurrency] ?? defaultCurrency + " ";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {isEditing ? "Edit Invoice" : "New Invoice"}
        </Text>
        <View style={{ width: 34 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 100 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* CLIENT */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CLIENT</Text>
            <View
              style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.inputRow}>
                <Feather name="user" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Client Name *"
                  placeholderTextColor={colors.mutedForeground}
                  value={clientName}
                  onChangeText={setClientName}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
              <View style={[styles.inputDivider, { backgroundColor: colors.border }]} />
              <View style={styles.inputRow}>
                <Feather name="mail" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Email (optional)"
                  placeholderTextColor={colors.mutedForeground}
                  value={clientEmail}
                  onChangeText={setClientEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="next"
                />
              </View>
            </View>
          </View>

          {/* ITEMS */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ITEMS</Text>
              <TouchableOpacity onPress={addItem} style={styles.addItemBtn}>
                <Feather name="plus" size={14} color={colors.primary} />
                <Text style={[styles.addItemText, { color: colors.primary }]}>Add Item</Text>
              </TouchableOpacity>
            </View>

            {items.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.itemCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                {/* Item header */}
                <View style={styles.itemHeader}>
                  <View style={[styles.itemBadge, { backgroundColor: colors.accent }]}>
                    <Text style={[styles.itemBadgeText, { color: colors.primary }]}>
                      {index + 1}
                    </Text>
                  </View>
                  <Text style={[styles.itemTitle, { color: colors.foreground }]}>
                    Item {index + 1}
                  </Text>
                  {items.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeItem(item.id)}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <Feather name="x" size={16} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Description */}
                <TextInput
                  style={[
                    styles.itemDesc,
                    { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background },
                  ]}
                  placeholder="Description"
                  placeholderTextColor={colors.mutedForeground}
                  value={item.description}
                  onChangeText={(v) => updateItem(item.id, "description", v)}
                  returnKeyType="next"
                />

                {/* Qty × Unit Price row */}
                <View style={styles.calcRow}>
                  <View style={styles.calcField}>
                    <Text style={[styles.calcLabel, { color: colors.mutedForeground }]}>QTY</Text>
                    <TextInput
                      style={[
                        styles.calcInput,
                        { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background },
                      ]}
                      placeholder="1"
                      placeholderTextColor={colors.mutedForeground}
                      value={item.quantity > 0 ? item.quantity.toString() : ""}
                      onChangeText={(v) => updateItem(item.id, "quantity", v)}
                      keyboardType="decimal-pad"
                    />
                  </View>

                  <Text style={[styles.timesSign, { color: colors.mutedForeground }]}>×</Text>

                  <View style={[styles.calcField, { flex: 2 }]}>
                    <Text style={[styles.calcLabel, { color: colors.mutedForeground }]}>
                      UNIT PRICE ({currencySymbol})
                    </Text>
                    <TextInput
                      style={[
                        styles.calcInput,
                        { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background },
                      ]}
                      placeholder="0.00"
                      placeholderTextColor={colors.mutedForeground}
                      value={item.unitPrice > 0 ? item.unitPrice.toString() : ""}
                      onChangeText={(v) => updateItem(item.id, "unitPrice", v)}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                {/* Line total */}
                <View style={[styles.lineTotalRow, { backgroundColor: colors.muted, borderRadius: 10 }]}>
                  <Text style={[styles.lineTotalLabel, { color: colors.mutedForeground }]}>
                    Line Total
                  </Text>
                  <Text style={[styles.lineTotalValue, { color: colors.primary }]}>
                    {currencySymbol}{item.price.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Grand total */}
          <View
            style={[
              styles.totalBar,
              { backgroundColor: colors.accent, borderColor: colors.primary },
            ]}
          >
            <Text style={[styles.totalLabel, { color: colors.primary }]}>Total</Text>
            <Text style={[styles.totalAmount, { color: colors.primary }]}>
              {currencySymbol}{total.toFixed(2)}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: bottomPad + 16,
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.previewBtn, { backgroundColor: colors.primary }]}
          onPress={handlePreview}
        >
          <Feather name="eye" size={18} color={colors.primaryForeground} />
          <Text style={[styles.previewBtnText, { color: colors.primaryForeground }]}>
            Preview Invoice
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    justifyContent: "space-between",
  },
  backBtn: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  scrollContent: { padding: 20, gap: 24 },
  section: { gap: 10 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  addItemBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  addItemText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  inputCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  inputRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, height: 52 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  inputDivider: { height: 1, marginLeft: 16 },
  itemCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  itemHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  itemBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  itemBadgeText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  itemTitle: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold", letterSpacing: 0.3 },
  itemDesc: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    height: 46,
  },
  calcRow: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  calcField: { flex: 1, gap: 6 },
  calcLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.8, textTransform: "uppercase" },
  calcInput: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    height: 46,
  },
  timesSign: { fontSize: 20, fontFamily: "Inter_400Regular", paddingBottom: 12 },
  lineTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  lineTotalLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 0.3 },
  lineTotalValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  totalBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  totalLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  totalAmount: { fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  footer: { padding: 20, paddingTop: 12, borderTopWidth: 1 },
  previewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  previewBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
