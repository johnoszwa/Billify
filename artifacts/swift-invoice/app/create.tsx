import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export default function CreateScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { invoices, addInvoice, updateInvoice, generateInvoiceNumber, defaultCurrency } =
    useInvoice();

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: generateId(), description: "", price: 0 },
  ]);

  const isEditing = !!id;
  const editingInvoice = isEditing ? invoices.find((inv) => inv.id === id) : undefined;

  useEffect(() => {
    if (editingInvoice) {
      setClientName(editingInvoice.clientName);
      setClientEmail(editingInvoice.clientEmail);
      setItems(editingInvoice.items);
    }
  }, []);

  const total = items.reduce((sum, item) => sum + (item.price || 0), 0);

  function updateItem(itemId: string, field: keyof InvoiceItem, value: string | number) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  }

  function addItem() {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setItems((prev) => [...prev, { id: generateId(), description: "", price: 0 }]);
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
    const validItems = items.filter((item) => item.description.trim() && item.price > 0);
    if (validItems.length === 0) {
      Alert.alert("Missing Items", "Please add at least one item with a description and price.");
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
      total,
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

  const currencySymbols: Record<string, string> = {
    USD: "$", EUR: "€", GBP: "£", JPY: "¥", CAD: "CA$",
    AUD: "A$", CHF: "CHF", INR: "₹", BRL: "R$", MXN: "MX$",
  };
  const currencySymbol = currencySymbols[defaultCurrency] || defaultCurrency + " ";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
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
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CLIENT</Text>
            <View style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
                style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.itemHeader}>
                  <Text style={[styles.itemNumber, { color: colors.mutedForeground }]}>
                    Item {index + 1}
                  </Text>
                  {items.length > 1 && (
                    <TouchableOpacity onPress={() => removeItem(item.id)}>
                      <Feather name="x" size={16} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  )}
                </View>
                <TextInput
                  style={[styles.itemDesc, { color: colors.foreground, borderColor: colors.border }]}
                  placeholder="Description"
                  placeholderTextColor={colors.mutedForeground}
                  value={item.description}
                  onChangeText={(v) => updateItem(item.id, "description", v)}
                  returnKeyType="next"
                />
                <View style={styles.priceRow}>
                  <Text style={[styles.currencySymbol, { color: colors.mutedForeground }]}>
                    {currencySymbol}
                  </Text>
                  <TextInput
                    style={[styles.priceInput, { color: colors.foreground, borderColor: colors.border }]}
                    placeholder="0.00"
                    placeholderTextColor={colors.mutedForeground}
                    value={item.price > 0 ? item.price.toString() : ""}
                    onChangeText={(v) => updateItem(item.id, "price", parseFloat(v) || 0)}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            ))}
          </View>

          <View style={[styles.totalBar, { backgroundColor: colors.accent, borderColor: colors.primary }]}>
            <Text style={[styles.totalLabel, { color: colors.primary }]}>Total</Text>
            <Text style={[styles.totalAmount, { color: colors.primary }]}>
              {currencySymbol}{total.toFixed(2)}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: bottomPad + 16, backgroundColor: colors.background, borderTopColor: colors.border }]}>
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
  sectionLabel: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1, textTransform: "uppercase" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  addItemBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  addItemText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  inputCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  inputRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, height: 52 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  inputDivider: { height: 1, marginLeft: 16 },
  itemCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  itemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemNumber: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  itemDesc: {
    fontSize: 15, fontFamily: "Inter_400Regular",
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, height: 46,
  },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  currencySymbol: { fontSize: 18, fontFamily: "Inter_600SemiBold", width: 24 },
  priceInput: {
    flex: 1, fontSize: 18, fontFamily: "Inter_700Bold",
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, height: 46,
  },
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
  footer: {
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
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
