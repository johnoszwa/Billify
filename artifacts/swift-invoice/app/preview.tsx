import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useInvoice } from "@/context/InvoiceContext";
import { useTier } from "@/context/TierContext";
import { useColors } from "@/hooks/useColors";
import {
  formatCurrency,
  generatePDFHTMLWithTemplate,
  InvoiceTemplate,
} from "@/utils/pdfGenerator";

export default function PreviewScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { invoices, defaultCurrency } = useInvoice();
  const { isPro } = useTier();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [template, setTemplate] = useState<InvoiceTemplate>("professional");
  const [logoBase64, setLogoBase64] = useState<string | undefined>();

  useEffect(() => {
    AsyncStorage.multiGet(["@swift_invoice_template", "@swift_invoice_logo"]).then(
      ([[, tpl], [, logo]]) => {
        if (tpl === "minimal" || tpl === "professional" || tpl === "branded") {
          setTemplate(tpl);
        }
        if (logo) setLogoBase64(logo);
      }
    );
  }, []);

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

  async function generatePDF(): Promise<string | null> {
    setIsGenerating(true);
    try {
      const html = generatePDFHTMLWithTemplate(invoice!, defaultCurrency, isPro, template, logoBase64);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      setPdfUri(uri);
      return uri;
    } catch {
      Alert.alert("Error", "Could not generate PDF. Please try again.");
      return null;
    } finally {
      setIsGenerating(false);
    }
  }

  function selectTemplate(t: InvoiceTemplate) {
    setTemplate(t);
    setPdfUri(null);
    AsyncStorage.setItem("@swift_invoice_template", t);
  }

  function handleOpenShareSheet() {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowShareSheet(true);
  }

  async function shareViaWhatsApp() {
    setShowShareSheet(false);
    const uri = pdfUri ?? (await generatePDF());
    if (!uri) return;

    if (Platform.OS === "web") {
      window.alert("PDF sharing is available on the Billify mobile app.");
      return;
    }

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Alert.alert("Sharing not available", "Your device does not support sharing.");
      return;
    }

    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: `Share Invoice ${invoice!.invoiceNumber} via WhatsApp`,
      UTI: "com.adobe.pdf",
    });
  }

  async function shareViaEmail() {
    setShowShareSheet(false);
    const uri = pdfUri ?? (await generatePDF());
    if (!uri) return;

    if (Platform.OS === "web") {
      const subject = encodeURIComponent(`Invoice ${invoice!.invoiceNumber}`);
      const body = encodeURIComponent(
        `Hi ${invoice!.clientName},\n\nPlease find your invoice ${invoice!.invoiceNumber} attached.\n\nTotal: ${formatCurrency(invoice!.total, defaultCurrency)}\n\nThank you for your business.`
      );
      const to = invoice!.clientEmail ? encodeURIComponent(invoice!.clientEmail) : "";
      Linking.openURL(`mailto:${to}?subject=${subject}&body=${body}`);
      return;
    }

    // On mobile: open email app with details pre-filled, then share PDF
    const subject = encodeURIComponent(`Invoice ${invoice!.invoiceNumber}`);
    const body = encodeURIComponent(
      `Hi ${invoice!.clientName},\n\nPlease find your invoice ${invoice!.invoiceNumber} attached.\n\nTotal: ${formatCurrency(invoice!.total, defaultCurrency)}\n\nThank you for your business.`
    );
    const to = invoice!.clientEmail ? encodeURIComponent(invoice!.clientEmail) : "";

    const canOpenMail = await Linking.canOpenURL("mailto:");
    if (canOpenMail) {
      await Linking.openURL(`mailto:${to}?subject=${subject}&body=${body}`);
    }

    // Also share the PDF so they can attach it
    await new Promise((r) => setTimeout(r, 600));
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: `Attach Invoice ${invoice!.invoiceNumber} to email`,
        UTI: "com.adobe.pdf",
      });
    }
  }

  async function downloadPDF() {
    setShowShareSheet(false);

    if (Platform.OS === "web") {
      window.alert("PDF download is available on the Billify mobile app.");
      return;
    }

    const uri = pdfUri ?? (await generatePDF());
    if (!uri) return;

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Alert.alert("Not available", "File saving is not supported on this device.");
      return;
    }

    // Share with save-to-files / download intent
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: `Save Invoice ${invoice!.invoiceNumber}.pdf`,
      UTI: "com.adobe.pdf",
    });
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
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

      {/* Invoice preview */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.invoiceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.invoiceHeader}>
            <View>
              <Text style={[styles.appName, { color: colors.primary }]}>Billify</Text>
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
            <Text style={[styles.colLabel, { color: colors.mutedForeground, flex: 2 }]}>DESCRIPTION</Text>
            <Text style={[styles.colSmall, { color: colors.mutedForeground }]}>QTY</Text>
            <Text style={[styles.colSmall, { color: colors.mutedForeground }]}>UNIT</Text>
            <Text style={[styles.colAmount, { color: colors.mutedForeground }]}>AMOUNT</Text>
          </View>

          {invoice.items.map((item, i) => (
            <View
              key={item.id}
              style={[
                styles.itemRow,
                i < invoice.items.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.border } : {},
              ]}
            >
              <Text style={[styles.itemNum, { color: colors.mutedForeground }]}>{i + 1}</Text>
              <Text style={[styles.itemDesc, { color: colors.foreground, flex: 2 }]}>{item.description}</Text>
              <Text style={[styles.itemSmall, { color: colors.mutedForeground }]}>
                {(item.quantity ?? 1).toString()}
              </Text>
              <Text style={[styles.itemSmall, { color: colors.mutedForeground }]}>
                {formatCurrency(item.unitPrice ?? item.price, defaultCurrency)}
              </Text>
              <Text style={[styles.itemAmount, { color: colors.foreground }]}>
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

          {!isPro && (
            <Text style={[styles.watermark, { color: colors.mutedForeground }]}>
              Generated with Billify &bull; Upgrade to Pro to remove watermark
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: bottomPad + 16, backgroundColor: colors.background, borderTopColor: colors.border }]}>
        {isPro && (
          <View style={styles.templateRow}>
            {(["minimal", "professional", "branded"] as InvoiceTemplate[]).map((t) => {
              const active = template === t;
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => selectTemplate(t)}
                  style={[
                    styles.templatePill,
                    {
                      backgroundColor: active ? colors.primary : colors.secondary,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.templatePillText,
                      { color: active ? colors.primaryForeground : colors.foreground },
                    ]}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        <TouchableOpacity
          style={[styles.shareBtn, { backgroundColor: colors.primary }]}
          onPress={handleOpenShareSheet}
          disabled={isGenerating}
        >
          <Feather name="share-2" size={18} color={colors.primaryForeground} />
          <Text style={[styles.shareBtnText, { color: colors.primaryForeground }]}>
            {isGenerating ? "Generating PDF…" : "Share / Export"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Share bottom sheet */}
      <Modal
        visible={showShareSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShareSheet(false)}
      >
        <Pressable style={styles.sheetOverlay} onPress={() => setShowShareSheet(false)} />
        <View style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: bottomPad + 16 }]}>
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Share Invoice</Text>
          <Text style={[styles.sheetSub, { color: colors.mutedForeground }]}>
            {invoice.invoiceNumber} &bull; {formatCurrency(invoice.total, defaultCurrency)}
          </Text>

          <View style={styles.sheetOptions}>
            {/* WhatsApp */}
            <TouchableOpacity
              style={[styles.sheetOption, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={shareViaWhatsApp}
            >
              <View style={[styles.sheetOptionIcon, { backgroundColor: "#dcfce7" }]}>
                <Feather name="message-circle" size={22} color="#16a34a" />
              </View>
              <View style={styles.sheetOptionText}>
                <Text style={[styles.sheetOptionTitle, { color: colors.foreground }]}>WhatsApp</Text>
                <Text style={[styles.sheetOptionSub, { color: colors.mutedForeground }]}>
                  Share PDF via WhatsApp
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>

            {/* Email */}
            <TouchableOpacity
              style={[styles.sheetOption, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={shareViaEmail}
            >
              <View style={[styles.sheetOptionIcon, { backgroundColor: "#dbeafe" }]}>
                <Feather name="mail" size={22} color="#2563eb" />
              </View>
              <View style={styles.sheetOptionText}>
                <Text style={[styles.sheetOptionTitle, { color: colors.foreground }]}>Email</Text>
                <Text style={[styles.sheetOptionSub, { color: colors.mutedForeground }]}>
                  {invoice.clientEmail
                    ? `Send to ${invoice.clientEmail}`
                    : "Open email client"}
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>

            {/* Download / Save */}
            <TouchableOpacity
              style={[styles.sheetOption, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={downloadPDF}
            >
              <View style={[styles.sheetOptionIcon, { backgroundColor: "#fef3c7" }]}>
                <Feather name="download" size={22} color="#d97706" />
              </View>
              <View style={styles.sheetOptionText}>
                <Text style={[styles.sheetOptionTitle, { color: colors.foreground }]}>Download PDF</Text>
                <Text style={[styles.sheetOptionSub, { color: colors.mutedForeground }]}>
                  Save to Files / Downloads
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.sheetCancel, { backgroundColor: colors.muted }]}
            onPress={() => setShowShareSheet(false)}
          >
            <Text style={[styles.sheetCancelText, { color: colors.foreground }]}>Cancel</Text>
          </TouchableOpacity>
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
  tableHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, gap: 4 },
  colNum: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1, textTransform: "uppercase", width: 24, textAlign: "center" },
  colLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1, textTransform: "uppercase" },
  colSmall: { width: 48, fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1, textTransform: "uppercase", textAlign: "right" },
  colAmount: { width: 64, fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1, textTransform: "uppercase", textAlign: "right" },
  itemRow: { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 12, alignItems: "center", gap: 4 },
  itemNum: { width: 24, fontSize: 12, fontFamily: "Inter_600SemiBold", textAlign: "center", color: "#64748b" },
  itemDesc: { fontSize: 13, fontFamily: "Inter_400Regular" },
  itemSmall: { width: 48, fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "right" },
  itemAmount: { width: 64, fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "right" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingVertical: 18 },
  totalLabel: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 1, textTransform: "uppercase" },
  totalAmount: { fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  watermark: { textAlign: "center", fontSize: 11, fontFamily: "Inter_400Regular", padding: 16 },
  footer: {
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  shareBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  templateRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  templatePill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  templatePillText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  // Share sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingTop: 12,
    gap: 4,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  sheetSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 16,
  },
  sheetOptions: { gap: 10, marginBottom: 12 },
  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  sheetOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetOptionText: { flex: 1 },
  sheetOptionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  sheetOptionSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  sheetCancel: {
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 4,
  },
  sheetCancelText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
