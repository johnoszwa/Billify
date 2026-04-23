import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import React, { useState } from "react";
import {
  Alert,
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
import { formatCurrency, generatePDFHTML } from "@/utils/pdfGenerator";

export default function PreviewScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { invoices, isProUser, defaultCurrency } = useInvoice();
  const [isGenerating, setIsGenerating] = useState(false);

  const invoice = invoices.find((inv) => inv.id === id);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!invoice) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground, marginTop: 100, textAlign: "center" }}>
          Invoice not found
        </Text>
      </View>
    );
  }

  async function handleShare() {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsGenerating(true);
    try {
      const html = generatePDFHTML(invoice!, defaultCurrency, isProUser);
      const { uri } = await Print.printToFileAsync({ html, base64: false });

      if (!isProUser) {
        Alert.alert(
          "Upgrade to Pro",
          "Remove the watermark and unlock unlimited invoices.",
          [
            { text: "Share Anyway", onPress: () => shareFile(uri) },
            {
              text: "Upgrade",
              style: "default",
              onPress: () => {
                router.push("/paywall");
              },
            },
          ]
        );
      } else {
        await shareFile(uri);
      }
    } catch (e) {
      Alert.alert("Error", "Could not generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function shareFile(uri: string) {
    if (Platform.OS === "web") {
      Alert.alert("PDF Ready", "PDF sharing is available on mobile devices.");
      return;
    }
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: `Invoice ${invoice!.invoiceNumber}`,
      });
    } else {
      Alert.alert("Sharing not available on this device.");
    }
  }

  async function handlePrint() {
    if (Platform.OS === "web") {
      Alert.alert("Print available on mobile only.");
      return;
    }
    const html = generatePDFHTML(invoice!, defaultCurrency, isProUser);
    await Print.printAsync({ html });
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Preview</Text>
        <TouchableOpacity
          onPress={() => router.push({ pathname: "/create", params: { id: invoice.id } })}
          style={[styles.editBtn, { backgroundColor: colors.secondary }]}
        >
          <Feather name="edit-2" size={16} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.invoiceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.invoiceHeader}>
            <View>
              <Text style={[styles.appName, { color: colors.primary }]}>SwiftInvoice</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.invoiceLabel, { color: colors.foreground }]}>INVOICE</Text>
              <Text style={[styles.invoiceNum, { color: colors.mutedForeground }]}>{invoice.invoiceNumber}</Text>
              <Text style={[styles.invoiceDate, { color: colors.mutedForeground }]}>{invoice.date}</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.primary }]} />

          <View style={styles.billTo}>
            <Text style={[styles.billLabel, { color: colors.mutedForeground }]}>BILL TO</Text>
            <Text style={[styles.clientName, { color: colors.foreground }]}>{invoice.clientName}</Text>
            {invoice.clientEmail ? (
              <Text style={[styles.clientEmail, { color: colors.mutedForeground }]}>{invoice.clientEmail}</Text>
            ) : null}
          </View>

          <View style={[styles.tableHeader, { backgroundColor: colors.muted }]}>
            <Text style={[styles.colNum, { color: colors.mutedForeground }]}>#</Text>
            <Text style={[styles.colLabel, { color: colors.mutedForeground }]}>DESCRIPTION</Text>
            <Text style={[styles.colLabel, { color: colors.mutedForeground, textAlign: "right" }]}>AMOUNT</Text>
          </View>

          {invoice.items.map((item, i) => (
            <View key={item.id} style={[styles.itemRow, i < invoice.items.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.border } : {}]}>
              <Text style={[styles.itemNum, { color: colors.mutedForeground }]}>{i + 1}</Text>
              <Text style={[styles.itemDesc, { color: colors.foreground }]}>{item.description}</Text>
              <Text style={[styles.itemPrice, { color: colors.foreground }]}>
                {formatCurrency(item.price, defaultCurrency)}
              </Text>
            </View>
          ))}

          <View style={[styles.totalRow, { backgroundColor: colors.accent }]}>
            <Text style={[styles.totalLabel, { color: colors.primary }]}>TOTAL</Text>
            <Text style={[styles.totalAmount, { color: colors.primary }]}>
              {formatCurrency(invoice.total, defaultCurrency)}
            </Text>
          </View>

          {!isProUser && (
            <Text style={[styles.watermark, { color: colors.mutedForeground }]}>
              Generated with SwiftInvoice &bull; Upgrade to Pro to remove watermark
            </Text>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomPad + 16, backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.shareBtn, { backgroundColor: colors.primary }]}
          onPress={handleShare}
          disabled={isGenerating}
        >
          <Feather name="share-2" size={18} color={colors.primaryForeground} />
          <Text style={[styles.shareBtnText, { color: colors.primaryForeground }]}>
            {isGenerating ? "Generating PDF..." : "Share PDF"}
          </Text>
        </TouchableOpacity>
        {Platform.OS !== "web" && (
          <TouchableOpacity
            style={[styles.printBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
            onPress={handlePrint}
          >
            <Feather name="printer" size={18} color={colors.foreground} />
          </TouchableOpacity>
        )}
      </View>
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
  editBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  scrollContent: { padding: 16 },
  invoiceCard: { borderRadius: 20, borderWidth: 1, overflow: "hidden" },
  invoiceHeader: { flexDirection: "row", justifyContent: "space-between", padding: 24, paddingBottom: 16 },
  appName: { fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  invoiceLabel: { fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  invoiceNum: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  invoiceDate: { fontSize: 13, fontFamily: "Inter_400Regular" },
  divider: { height: 2, marginHorizontal: 24, borderRadius: 2 },
  billTo: { padding: 24, paddingBottom: 20, gap: 3 },
  billLabel: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 },
  clientName: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  clientEmail: { fontSize: 14, fontFamily: "Inter_400Regular" },
  tableHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10 },
  colNum: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1, textTransform: "uppercase", width: 32, textAlign: "center" },
  colLabel: { flex: 1, fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1, textTransform: "uppercase" },
  itemRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 14, alignItems: "center" },
  itemNum: { width: 32, fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  itemDesc: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", marginRight: 12 },
  itemPrice: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingVertical: 18 },
  totalLabel: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 1, textTransform: "uppercase" },
  totalAmount: { fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  watermark: { textAlign: "center", fontSize: 11, fontFamily: "Inter_400Regular", padding: 16 },
  footer: {
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
  },
  shareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  shareBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  printBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    alignSelf: "center",
  },
});
