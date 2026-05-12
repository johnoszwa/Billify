import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useInvoice } from "@/context/InvoiceContext";
import { useTier } from "@/context/TierContext";
import { useColors } from "@/hooks/useColors";
import { CURRENCIES, CURRENCY_SECTIONS } from "@/utils/currencies";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isProUser, defaultCurrency, setDefaultCurrency, deleteAllData, invoices } = useInvoice();
  const { isPro } = useTier();
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [logoSet, setLogoSet] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [showNameEditor, setShowNameEditor] = useState(false);
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    AsyncStorage.multiGet(["@swift_invoice_logo", "@swift_invoice_business_name"]).then(
      ([[, logo], [, name]]) => {
        setLogoSet(!!logo);
        if (name) setBusinessName(name);
      }
    );
  }, []);

  async function handleLogoUpload() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to your photo library to upload a logo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.5,
    });
    if (result.canceled) return;
    const b64 = result.assets?.[0]?.base64;
    if (!b64) return;
    const dataUri = `data:image/jpeg;base64,${b64}`;
    await AsyncStorage.setItem("@swift_invoice_logo", dataUri);
    setLogoSet(true);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function handleRemoveLogo() {
    await AsyncStorage.removeItem("@swift_invoice_logo");
    setLogoSet(false);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  async function saveBusinessName() {
    const trimmed = nameInput.trim();
    if (trimmed) {
      await AsyncStorage.setItem("@swift_invoice_business_name", trimmed);
      setBusinessName(trimmed);
    } else {
      await AsyncStorage.removeItem("@swift_invoice_business_name");
      setBusinessName("");
    }
    setShowNameEditor(false);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function handleDeleteAll() {
    const confirmed =
      Platform.OS === "web"
        ? window.confirm(
            "This will permanently delete all invoices and reset the app. This cannot be undone."
          )
        : await new Promise<boolean>((resolve) => {
            Alert.alert(
              "Delete All Data",
              "This will permanently delete all invoices and reset the app. This action cannot be undone.",
              [
                { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
                { text: "Delete All", style: "destructive", onPress: () => resolve(true) },
              ],
              { cancelable: true, onDismiss: () => resolve(false) }
            );
          });

    if (!confirmed) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await deleteAllData();
  }

  const selectedCurrency = CURRENCIES.find((c) => c.code === defaultCurrency);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Settings</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {!isProUser && (
          <TouchableOpacity
            style={[styles.proCard, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/paywall")}
          >
            <View>
              <Text style={[styles.proTitle, { color: colors.primaryForeground }]}>Upgrade to Pro</Text>
              <Text style={[styles.proSub, { color: colors.primaryForeground, opacity: 0.8 }]}>
                Remove watermark &bull; Unlimited invoices
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.primaryForeground} />
          </TouchableOpacity>
        )}

        {isProUser && (
          <View style={[styles.proBadge, { backgroundColor: colors.accent, borderColor: colors.primary }]}>
            <Feather name="star" size={16} color={colors.primary} />
            <Text style={[styles.proBadgeText, { color: colors.primary }]}>Pro Member</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PREFERENCES</Text>
          <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setShowCurrencyPicker(true)}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.accent }]}>
                  <Feather name="dollar-sign" size={16} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.settingTitle, { color: colors.foreground }]}>Default Currency</Text>
                  <Text style={[styles.settingValue, { color: colors.mutedForeground }]}>
                    {selectedCurrency?.symbol} {selectedCurrency?.code}
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>

            <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={styles.settingRow}
              onPress={isPro ? handleLogoUpload : () => router.push("/paywall")}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.accent }]}>
                  <Feather name="image" size={16} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.settingTitle, { color: colors.foreground }]}>Business Logo</Text>
                  <Text style={[styles.settingValue, { color: colors.mutedForeground }]}>
                    {isPro ? (logoSet ? "Logo set ✓" : "Tap to upload") : "Pro feature"}
                  </Text>
                </View>
              </View>
              {isPro
                ? <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                : <Feather name="lock" size={16} color={colors.mutedForeground} />
              }
            </TouchableOpacity>

            {isPro && logoSet && (
              <>
                <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
                <TouchableOpacity style={styles.settingRow} onPress={handleRemoveLogo}>
                  <View style={styles.settingLeft}>
                    <View style={[styles.settingIcon, { backgroundColor: "#fef2f2" }]}>
                      <Feather name="x-circle" size={16} color={colors.destructive} />
                    </View>
                    <View>
                      <Text style={[styles.settingTitle, { color: colors.destructive }]}>Remove Logo</Text>
                      <Text style={[styles.settingValue, { color: colors.mutedForeground }]}>
                        Clear logo from all invoices
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </>
            )}

            <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={styles.settingRow}
              onPress={isPro
                ? () => { setNameInput(businessName); setShowNameEditor(true); }
                : () => router.push("/paywall")}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.accent }]}>
                  <Feather name="briefcase" size={16} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.settingTitle, { color: colors.foreground }]}>Business Name</Text>
                  <Text style={[styles.settingValue, { color: colors.mutedForeground }]}>
                    {isPro ? (businessName || "Tap to set (replaces Billify)") : "Pro feature"}
                  </Text>
                </View>
              </View>
              {isPro
                ? <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                : <Feather name="lock" size={16} color={colors.mutedForeground} />
              }
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DATA</Text>
          <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.accent }]}>
                  <Feather name="file-text" size={16} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.settingTitle, { color: colors.foreground }]}>Total Invoices</Text>
                  <Text style={[styles.settingValue, { color: colors.mutedForeground }]}>{invoices.length} invoices</Text>
                </View>
              </View>
            </View>

            <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity style={styles.settingRow} onPress={handleDeleteAll}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: "#fef2f2" }]}>
                  <Feather name="trash-2" size={16} color={colors.destructive} />
                </View>
                <View>
                  <Text style={[styles.settingTitle, { color: colors.destructive }]}>Delete All Data</Text>
                  <Text style={[styles.settingValue, { color: colors.mutedForeground }]}>GDPR: clear all local data</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ABOUT</Text>
          <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.accent }]}>
                  <Feather name="lock" size={16} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.settingTitle, { color: colors.foreground }]}>Privacy First</Text>
                  <Text style={[styles.settingValue, { color: colors.mutedForeground }]}>All data stored locally only</Text>
                </View>
              </View>
            </View>
            <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.accent }]}>
                  <Feather name="wifi-off" size={16} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.settingTitle, { color: colors.foreground }]}>Works Offline</Text>
                  <Text style={[styles.settingValue, { color: colors.mutedForeground }]}>No internet required</Text>
                </View>
              </View>
            </View>
            <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.accent }]}>
                  <Feather name="info" size={16} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.settingTitle, { color: colors.foreground }]}>Version</Text>
                  <Text style={[styles.settingValue, { color: colors.mutedForeground }]}>1.0.0</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Business Name editor modal */}
      <Modal
        visible={showNameEditor}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNameEditor(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowNameEditor(false)}
        />
        <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>Business Name</Text>
          <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
            Replaces "Billify" on your PDF invoices
          </Text>
          <TextInput
            style={[
              styles.nameInput,
              {
                color: colors.foreground,
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
            placeholder="e.g. Acme Studio"
            placeholderTextColor={colors.mutedForeground}
            value={nameInput}
            onChangeText={setNameInput}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={saveBusinessName}
            autoFocus
          />
          <View style={styles.nameActions}>
            <TouchableOpacity
              style={[styles.nameBtn, { backgroundColor: colors.muted }]}
              onPress={() => setShowNameEditor(false)}
            >
              <Text style={[styles.nameBtnText, { color: colors.foreground }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.nameBtn, { backgroundColor: colors.primary, flex: 1.5 }]}
              onPress={saveBusinessName}
            >
              <Text style={[styles.nameBtnText, { color: colors.primaryForeground }]}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
        <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
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
                      currency.code === defaultCurrency && { backgroundColor: colors.accent },
                    ]}
                    onPress={() => {
                      setDefaultCurrency(currency.code);
                      setShowCurrencyPicker(false);
                      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={[styles.currencySymbolText, { color: colors.primary }]}>{currency.symbol}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.currencyName, { color: colors.foreground }]}>{currency.name}</Text>
                      <Text style={[styles.currencyCode, { color: colors.mutedForeground }]}>{currency.code}</Text>
                    </View>
                    {currency.code === defaultCurrency && (
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  scrollContent: { padding: 20, gap: 24 },
  proCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderRadius: 20,
  },
  proTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 4 },
  proSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  proBadgeText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  section: { gap: 10 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1, textTransform: "uppercase" },
  settingsCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  settingLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  settingIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  settingTitle: { fontSize: 15, fontFamily: "Inter_500Medium" },
  settingValue: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  rowDivider: { height: 1, marginLeft: 66 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "70%" },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 16 },
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
  currencyName: { fontSize: 15, fontFamily: "Inter_500Medium" },
  currencyCode: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  modalSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 16 },
  nameInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    marginBottom: 16,
  },
  nameActions: { flexDirection: "row", gap: 10 },
  nameBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
  },
  nameBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
