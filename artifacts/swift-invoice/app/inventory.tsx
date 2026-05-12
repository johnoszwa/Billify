import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useInvoice } from "@/context/InvoiceContext";
import { InventoryItem, useInventory } from "@/context/InventoryContext";
import { useTier } from "@/context/TierContext";
import { useColors } from "@/hooks/useColors";
import { CURRENCIES, CURRENCY_SECTIONS } from "@/utils/currencies";
import { CURRENCY_SYMBOLS } from "@/utils/pdfGenerator";

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function freshForm(defaultCurrency: string) {
  return { name: "", description: "", unitPrice: "", currency: defaultCurrency };
}

type FormState = { name: string; description: string; unitPrice: string; currency: string };

// ── Main screen ────────────────────────────────────────────────────────────
export default function InventoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isPro } = useTier();
  const { items, addInventoryItem, updateInventoryItem, deleteInventoryItem } = useInventory();
  const { defaultCurrency } = useInvoice();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState<FormState>(freshForm(defaultCurrency));
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  // ── Pro gate ──────────────────────────────────────────────────────────────
  if (!isPro) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Inventory</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.accent }]}>
            <Feather name="package" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Inventory is a Pro feature</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Save your products and services for fast invoice creation.
          </Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/paywall")}
          >
            <Feather name="star" size={16} color={colors.primaryForeground} />
            <Text style={[styles.emptyButtonText, { color: colors.primaryForeground }]}>
              Upgrade to Pro
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function openCreate() {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingItem(null);
    setForm(freshForm(defaultCurrency));
    setShowModal(true);
  }

  function openEdit(item: InventoryItem) {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingItem(item);
    setForm({
      name: item.name,
      description: item.description,
      unitPrice: item.unitPrice > 0 ? item.unitPrice.toString() : "",
      currency: item.currency,
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingItem(null);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      Alert.alert("Missing Info", "Please enter a name for this item.");
      return;
    }
    const unitPrice = parseFloat(form.unitPrice);
    if (!form.unitPrice || isNaN(unitPrice) || unitPrice <= 0) {
      Alert.alert("Missing Info", "Please enter a valid unit price.");
      return;
    }
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (editingItem) {
      await updateInventoryItem({
        ...editingItem,
        name: form.name.trim(),
        description: form.description.trim(),
        unitPrice,
        currency: form.currency,
      });
    } else {
      await addInventoryItem({
        id: generateId(),
        name: form.name.trim(),
        description: form.description.trim(),
        unitPrice,
        currency: form.currency,
      });
    }
    closeModal();
  }

  function handleDelete(id: string) {
    closeModal();
    if (Platform.OS === "web") {
      if (window.confirm("Delete this item? This cannot be undone.")) {
        deleteInventoryItem(id);
      }
      return;
    }
    Alert.alert("Delete Item", "Are you sure you want to delete this item?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteInventoryItem(id) },
    ]);
  }

  const selectedCurrencyMeta = CURRENCIES.find((c) => c.code === form.currency);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Inventory</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {items.length} {items.length === 1 ? "item" : "items"}
          </Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* Empty state */}
      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.accent }]}>
            <Feather name="package" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No items yet</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Add your products and services to reuse them on invoices
          </Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: colors.primary }]}
            onPress={openCreate}
          >
            <Feather name="plus" size={16} color={colors.primaryForeground} />
            <Text style={[styles.emptyButtonText, { color: colors.primaryForeground }]}>
              Add Item
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 100 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const sym = CURRENCY_SYMBOLS[item.currency] ?? item.currency + " ";
            return (
              <TouchableOpacity
                style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => openEdit(item)}
                activeOpacity={0.7}
              >
                <View style={[styles.itemIconWrap, { backgroundColor: colors.accent }]}>
                  <Feather name="package" size={18} color={colors.primary} />
                </View>
                <View style={styles.itemContent}>
                  <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.description ? (
                    <Text style={[styles.itemDesc, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {item.description}
                    </Text>
                  ) : null}
                </View>
                <Text style={[styles.itemPrice, { color: colors.primary }]}>
                  {sym}{item.unitPrice.toFixed(2)}
                </Text>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* FAB */}
      {items.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary, bottom: bottomPad + 24 }]}
          onPress={openCreate}
        >
          <Feather name="plus" size={22} color={colors.primaryForeground} />
        </TouchableOpacity>
      )}

      {/* ── Item create/edit modal ── */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeModal} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalKAV}
        >
          <View style={[styles.modalSheet, { backgroundColor: colors.card, paddingBottom: bottomPad + 8 }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {editingItem ? "Edit Item" : "New Item"}
              </Text>
              {editingItem && (
                <TouchableOpacity onPress={() => handleDelete(editingItem.id)}>
                  <Feather name="trash-2" size={18} color={colors.destructive} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Name */}
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>NAME *</Text>
              <TextInput
                style={[styles.fieldInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                placeholder="e.g. Logo Design"
                placeholderTextColor={colors.mutedForeground}
                value={form.name}
                onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                autoCapitalize="words"
                returnKeyType="next"
              />

              {/* Description */}
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>DESCRIPTION</Text>
              <TextInput
                style={[styles.fieldInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                placeholder="Optional details"
                placeholderTextColor={colors.mutedForeground}
                value={form.description}
                onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                returnKeyType="next"
              />

              {/* Unit Price */}
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>UNIT PRICE *</Text>
              <View style={[styles.priceRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <Text style={[styles.currencyBadge, { color: colors.primary }]}>
                  {CURRENCY_SYMBOLS[form.currency] ?? form.currency}
                </Text>
                <TextInput
                  style={[styles.priceInput, { color: colors.foreground }]}
                  placeholder="0.00"
                  placeholderTextColor={colors.mutedForeground}
                  value={form.unitPrice}
                  onChangeText={(v) => setForm((f) => ({ ...f, unitPrice: v }))}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Currency */}
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>CURRENCY</Text>
              <TouchableOpacity
                style={[styles.fieldInput, styles.currencyField, { borderColor: colors.border, backgroundColor: colors.background }]}
                onPress={() => setShowCurrencyPicker(true)}
              >
                <Text style={[styles.currencyFieldText, { color: colors.foreground }]}>
                  {selectedCurrencyMeta?.symbol}{"  "}{form.currency} — {selectedCurrencyMeta?.name}
                </Text>
                <Feather name="chevron-down" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>

              {/* Action buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: colors.border }]}
                  onPress={closeModal}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.foreground }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                  onPress={handleSave}
                >
                  <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>
                    {editingItem ? "Save Changes" : "Add Item"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Currency picker modal ── */}
      <Modal
        visible={showCurrencyPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCurrencyPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCurrencyPicker(false)}
        />
        <View style={[styles.modalSheet, { backgroundColor: colors.card, paddingBottom: bottomPad + 8, maxHeight: "70%" }]}>
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>Select Currency</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {CURRENCY_SECTIONS.map((section) => (
              <React.Fragment key={section.region}>
                <View style={[styles.currencyRegion, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.currencyRegionText, { color: colors.mutedForeground }]}>
                    {section.region.toUpperCase()}
                  </Text>
                </View>
                {section.currencies.map((currency) => (
                  <TouchableOpacity
                    key={currency.code}
                    style={[
                      styles.currencyRow,
                      { borderBottomColor: colors.border },
                      currency.code === form.currency && { backgroundColor: colors.accent },
                    ]}
                    onPress={() => {
                      setForm((f) => ({ ...f, currency: currency.code }));
                      setShowCurrencyPicker(false);
                      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={[styles.currencySymbolText, { color: colors.primary }]}>{currency.symbol}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.currencyName, { color: colors.foreground }]}>{currency.name}</Text>
                      <Text style={[styles.currencyCode, { color: colors.mutedForeground }]}>{currency.code}</Text>
                    </View>
                    {currency.code === form.currency && (
                      <Feather name="check" size={18} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </React.Fragment>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header (matches index.tsx)
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  headerSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },

  // Empty state (matches index.tsx)
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_600SemiBold", letterSpacing: -0.3 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyButtonText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },

  // List
  list: { paddingTop: 16, paddingHorizontal: 16 },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  itemIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  itemContent: { flex: 1 },
  itemName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  itemDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  itemPrice: { fontSize: 15, fontFamily: "Inter_700Bold", flexShrink: 0 },

  // FAB (matches index.tsx)
  fab: {
    position: "absolute",
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  // Modal (matches settings.tsx currency picker style)
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  modalKAV: { justifyContent: "flex-end" },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingTop: 12,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },

  // Form fields
  fieldLabel: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
    marginTop: 16,
  },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  currencyBadge: { fontSize: 16, fontFamily: "Inter_700Bold", marginRight: 8 },
  priceInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  currencyField: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 48,
  },
  currencyFieldText: { fontSize: 15, fontFamily: "Inter_400Regular" },

  // Modal action buttons
  modalActions: { flexDirection: "row", gap: 10, marginTop: 24, marginBottom: 8 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },

  // Currency picker (matches settings.tsx)
  currencyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginBottom: 2,
  },
  currencyRegion: { paddingHorizontal: 12, paddingVertical: 6 },
  currencyRegionText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  currencySymbolText: { width: 36, fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  currencyName: { fontSize: 14, fontFamily: "Inter_500Medium" },
  currencyCode: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
});
