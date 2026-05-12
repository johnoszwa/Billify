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
import { Client, useClients } from "@/context/ClientContext";
import { useTier } from "@/context/TierContext";
import { useColors } from "@/hooks/useColors";

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

interface ClientForm {
  name: string;
  email: string;
  address: string;
  phone: string;
}

const emptyForm = (): ClientForm => ({ name: "", email: "", address: "", phone: "" });

export default function ClientsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isPro } = useTier();
  const { clients, addClient, updateClient, deleteClient } = useClients();

  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientForm>(emptyForm());

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  function openCreate() {
    setEditingClient(null);
    setForm(emptyForm());
    setShowModal(true);
  }

  function openEdit(client: Client) {
    setEditingClient(client);
    setForm({
      name: client.name,
      email: client.email,
      address: client.address,
      phone: client.phone,
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingClient(null);
    setForm(emptyForm());
  }

  async function handleSave() {
    if (!form.name.trim()) {
      Alert.alert("Missing Info", "Please enter a client name.");
      return;
    }
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (editingClient) {
      await updateClient({
        ...editingClient,
        name: form.name.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
      });
    } else {
      await addClient({
        id: generateId(),
        name: form.name.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
      });
    }
    closeModal();
  }

  function handleDelete(id: string) {
    closeModal();
    if (Platform.OS === "web") {
      if (window.confirm("Delete this client? This cannot be undone.")) {
        deleteClient(id);
      }
      return;
    }
    Alert.alert("Delete Client", "Are you sure you want to delete this client?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteClient(id) },
    ]);
  }

  // ── Pro gate ──────────────────────────────────────────────────────────────
  if (!isPro) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Clients</Text>
          </View>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.upsellState}>
          <View style={[styles.upsellIcon, { backgroundColor: colors.accent }]}>
            <Feather name="users" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.upsellTitle, { color: colors.foreground }]}>Pro Feature</Text>
          <Text style={[styles.upsellText, { color: colors.mutedForeground }]}>
            Clients is a Pro feature. Upgrade to save your client address book and pre-fill invoices in seconds.
          </Text>
          <TouchableOpacity
            style={[styles.upsellButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/paywall")}
          >
            <Feather name="zap" size={16} color={colors.primaryForeground} />
            <Text style={[styles.upsellButtonText, { color: colors.primaryForeground }]}>Upgrade to Pro</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Clients</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {clients.length} {clients.length === 1 ? "client" : "clients"}
          </Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* Empty state */}
      {clients.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.accent }]}>
            <Feather name="users" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No clients yet</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Save your clients here to pre-fill invoices faster
          </Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: colors.primary }]}
            onPress={openCreate}
          >
            <Feather name="plus" size={16} color={colors.primaryForeground} />
            <Text style={[styles.emptyButtonText, { color: colors.primaryForeground }]}>
              Add Client
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={clients}
          keyExtractor={(c) => c.id}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 100 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => openEdit(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.itemIconWrap, { backgroundColor: colors.accent }]}>
                <Feather name="user" size={18} color={colors.primary} />
              </View>
              <View style={styles.itemContent}>
                <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.email ? (
                  <Text style={[styles.itemMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {item.email}
                  </Text>
                ) : null}
                {item.address ? (
                  <Text style={[styles.itemMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {item.address}
                  </Text>
                ) : null}
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        />
      )}

      {/* FAB */}
      {clients.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary, bottom: bottomPad + 24 }]}
          onPress={openCreate}
        >
          <Feather name="plus" size={22} color={colors.primaryForeground} />
        </TouchableOpacity>
      )}

      {/* ── Client create/edit modal ── */}
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
                {editingClient ? "Edit Client" : "New Client"}
              </Text>
              {editingClient && (
                <TouchableOpacity onPress={() => handleDelete(editingClient.id)}>
                  <Feather name="trash-2" size={18} color={colors.destructive} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Name */}
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>NAME *</Text>
              <TextInput
                style={[styles.fieldInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                placeholder="e.g. Acme Corp"
                placeholderTextColor={colors.mutedForeground}
                value={form.name}
                onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                autoCapitalize="words"
                returnKeyType="next"
              />

              {/* Email */}
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>EMAIL</Text>
              <TextInput
                style={[styles.fieldInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                placeholder="client@example.com"
                placeholderTextColor={colors.mutedForeground}
                value={form.email}
                onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
              />

              {/* Address */}
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>ADDRESS</Text>
              <TextInput
                style={[styles.fieldInput, styles.fieldInputMultiline, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                placeholder="123 Main St, City, Country"
                placeholderTextColor={colors.mutedForeground}
                value={form.address}
                onChangeText={(v) => setForm((f) => ({ ...f, address: v }))}
                multiline
                numberOfLines={3}
                returnKeyType="next"
              />

              {/* Phone */}
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>PHONE</Text>
              <TextInput
                style={[styles.fieldInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                placeholder="+1 555 000 0000"
                placeholderTextColor={colors.mutedForeground}
                value={form.phone}
                onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
                keyboardType="phone-pad"
                returnKeyType="done"
              />

              {/* Actions */}
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
                    {editingClient ? "Save Changes" : "Add Client"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

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

  // Empty state
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

  // Upsell state
  upsellState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  upsellIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  upsellTitle: { fontSize: 20, fontFamily: "Inter_600SemiBold", letterSpacing: -0.3 },
  upsellText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  upsellButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  upsellButtonText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },

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
  itemMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },

  // FAB
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

  // Modal
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
  fieldInputMultiline: {
    minHeight: 72,
    textAlignVertical: "top",
  },

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
});
