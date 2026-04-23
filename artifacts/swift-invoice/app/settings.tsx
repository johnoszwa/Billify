import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useInvoice } from "@/context/InvoiceContext";
import { useColors } from "@/hooks/useColors";

const CURRENCIES = [
  // Global / Major
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
  { code: "DKK", name: "Danish Krone", symbol: "kr" },
  // Asia / Middle East
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "PKR", name: "Pakistani Rupee", symbol: "Rs" },
  { code: "BDT", name: "Bangladeshi Taka", symbol: "৳" },
  { code: "LKR", name: "Sri Lankan Rupee", symbol: "Rs" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼" },
  { code: "QAR", name: "Qatari Riyal", symbol: "ر.ق" },
  { code: "KWD", name: "Kuwaiti Dinar", symbol: "KD" },
  { code: "BHD", name: "Bahraini Dinar", symbol: "BD" },
  { code: "OMR", name: "Omani Rial", symbol: "ر.ع." },
  { code: "ILS", name: "Israeli Shekel", symbol: "₪" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺" },
  { code: "THB", name: "Thai Baht", symbol: "฿" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱" },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  // Americas
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "MXN", name: "Mexican Peso", symbol: "MX$" },
  { code: "ARS", name: "Argentine Peso", symbol: "$" },
  { code: "CLP", name: "Chilean Peso", symbol: "CLP$" },
  { code: "COP", name: "Colombian Peso", symbol: "COL$" },
  { code: "PEN", name: "Peruvian Sol", symbol: "S/" },
  // Europe
  { code: "PLN", name: "Polish Zloty", symbol: "zł" },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč" },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft" },
  { code: "RON", name: "Romanian Leu", symbol: "lei" },
  { code: "RUB", name: "Russian Ruble", symbol: "₽" },
  { code: "UAH", name: "Ukrainian Hryvnia", symbol: "₴" },
  // Africa — West
  { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "₵" },
  { code: "XOF", name: "West African CFA Franc", symbol: "CFA" },
  { code: "SLL", name: "Sierra Leonean Leone", symbol: "Le" },
  { code: "GMD", name: "Gambian Dalasi", symbol: "D" },
  { code: "GNF", name: "Guinean Franc", symbol: "FG" },
  { code: "CVE", name: "Cape Verdean Escudo", symbol: "$" },
  { code: "LRD", name: "Liberian Dollar", symbol: "L$" },
  { code: "MRU", name: "Mauritanian Ouguiya", symbol: "UM" },
  // Africa — East
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh" },
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh" },
  { code: "UGX", name: "Ugandan Shilling", symbol: "USh" },
  { code: "ETB", name: "Ethiopian Birr", symbol: "Br" },
  { code: "RWF", name: "Rwandan Franc", symbol: "RF" },
  { code: "BIF", name: "Burundian Franc", symbol: "Fr" },
  { code: "DJF", name: "Djiboutian Franc", symbol: "Fdj" },
  { code: "ERN", name: "Eritrean Nakfa", symbol: "Nfk" },
  { code: "SOS", name: "Somali Shilling", symbol: "Sh" },
  { code: "MGA", name: "Malagasy Ariary", symbol: "Ar" },
  { code: "SCR", name: "Seychellois Rupee", symbol: "₨" },
  { code: "MUR", name: "Mauritian Rupee", symbol: "₨" },
  { code: "KMF", name: "Comorian Franc", symbol: "CF" },
  // Africa — Southern
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "ZMW", name: "Zambian Kwacha", symbol: "ZK" },
  { code: "BWP", name: "Botswana Pula", symbol: "P" },
  { code: "NAD", name: "Namibian Dollar", symbol: "N$" },
  { code: "MWK", name: "Malawian Kwacha", symbol: "MK" },
  { code: "ZWL", name: "Zimbabwean Dollar", symbol: "Z$" },
  { code: "SZL", name: "Swazi Lilangeni", symbol: "L" },
  { code: "LSL", name: "Lesotho Loti", symbol: "L" },
  { code: "MOZ", name: "Mozambican Metical", symbol: "MT" },
  { code: "AOA", name: "Angolan Kwanza", symbol: "Kz" },
  // Africa — Central
  { code: "XAF", name: "Central African CFA Franc", symbol: "FCFA" },
  { code: "CDF", name: "Congolese Franc", symbol: "FC" },
  { code: "STN", name: "São Tomé & Príncipe Dobra", symbol: "Db" },
  // Africa — North
  { code: "EGP", name: "Egyptian Pound", symbol: "E£" },
  { code: "MAD", name: "Moroccan Dirham", symbol: "MAD" },
  { code: "TND", name: "Tunisian Dinar", symbol: "د.ت" },
  { code: "DZD", name: "Algerian Dinar", symbol: "دج" },
  { code: "LYD", name: "Libyan Dinar", symbol: "LD" },
  { code: "SDG", name: "Sudanese Pound", symbol: "ج.س." },
];

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isProUser, defaultCurrency, setDefaultCurrency, deleteAllData, invoices } = useInvoice();
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  function handleDeleteAll() {
    Alert.alert(
      "Delete All Data",
      "This will permanently delete all invoices and reset the app. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await deleteAllData();
            Alert.alert("Done", "All data has been deleted.");
          },
        },
      ]
    );
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
            {CURRENCIES.map((currency) => (
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
  currencySymbolText: { width: 36, fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  currencyName: { fontSize: 15, fontFamily: "Inter_500Medium" },
  currencyCode: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
});
