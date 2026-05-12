import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useInvoice } from "@/context/InvoiceContext";
import { useTier } from "@/context/TierContext";
import { useColors } from "@/hooks/useColors";
import { CURRENCY_SYMBOLS } from "@/utils/pdfGenerator";

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isPro } = useTier();
  const { invoices, defaultCurrency } = useInvoice();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const screenWidth = Dimensions.get("window").width;
  const chartWidth = screenWidth - 48;
  const currencySymbol = CURRENCY_SYMBOLS[defaultCurrency] ?? defaultCurrency + " ";

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    let totalInvoiced = 0;
    let paid = 0;
    let pending = 0;
    let overdue = 0;

    for (const inv of invoices) {
      totalInvoiced += inv.total;
      if (inv.status === "paid") paid += inv.total;
      else if (inv.status === "draft" || inv.status === "sent") pending += inv.total;
      else if (inv.status === "overdue") overdue += inv.total;
    }

    const countDraft = invoices.filter((i) => i.status === "draft").length;
    const countSent = invoices.filter((i) => i.status === "sent").length;
    const countPaid = invoices.filter((i) => i.status === "paid").length;
    const countOverdue = invoices.filter((i) => i.status === "overdue").length;

    return { totalInvoiced, paid, pending, overdue, countDraft, countSent, countPaid, countOverdue };
  }, [invoices]);

  // ── Last 6 months bar data ────────────────────────────────────────────────
  const barData = useMemo(() => {
    const now = new Date();
    const months: { month: number; year: number; label: string }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ month: d.getMonth(), year: d.getFullYear(), label: MONTH_ABBR[d.getMonth()] });
    }

    return months.map(({ month, year, label }) => {
      const total = invoices.reduce((sum, inv) => {
        const d = new Date(inv.date);
        if (isNaN(d.getTime())) return sum;
        if (d.getMonth() === month && d.getFullYear() === year) return sum + inv.total;
        return sum;
      }, 0);
      return { value: total, label, frontColor: colors.primary };
    });
  }, [invoices, colors.primary]);

  // ── Pro gate ──────────────────────────────────────────────────────────────
  if (!isPro) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Dashboard</Text>
          </View>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.upsellState}>
          <View style={[styles.upsellIcon, { backgroundColor: colors.accent }]}>
            <Feather name="bar-chart-2" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.upsellTitle, { color: colors.foreground }]}>Pro Feature</Text>
          <Text style={[styles.upsellText, { color: colors.mutedForeground }]}>
            Dashboard analytics is a Pro feature. Upgrade to see your revenue trends and invoice insights.
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

  const maxBarValue = Math.max(...barData.map((b) => b.value), 1);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Dashboard</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {invoices.length} {invoices.length === 1 ? "invoice" : "invoices"} total
          </Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 2×2 stat grid ── */}
        <View style={styles.grid}>
          {/* Total Invoiced */}
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.statIconWrap, { backgroundColor: colors.accent }]}>
              <Feather name="file-text" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total Invoiced</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]} numberOfLines={1} adjustsFontSizeToFit>
              {currencySymbol}{stats.totalInvoiced.toFixed(2)}
            </Text>
            <Text style={[styles.statCount, { color: colors.mutedForeground }]}>
              {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
            </Text>
          </View>

          {/* Paid */}
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.statIconWrap, { backgroundColor: "#dcfce7" }]}>
              <Feather name="check-circle" size={18} color={colors.success} />
            </View>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Paid</Text>
            <Text style={[styles.statValue, { color: colors.success }]} numberOfLines={1} adjustsFontSizeToFit>
              {currencySymbol}{stats.paid.toFixed(2)}
            </Text>
            <Text style={[styles.statCount, { color: colors.mutedForeground }]}>
              {stats.countPaid} invoice{stats.countPaid !== 1 ? "s" : ""}
            </Text>
          </View>

          {/* Pending */}
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.statIconWrap, { backgroundColor: "#fef3c7" }]}>
              <Feather name="clock" size={18} color={colors.warning} />
            </View>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Pending</Text>
            <Text style={[styles.statValue, { color: colors.warning }]} numberOfLines={1} adjustsFontSizeToFit>
              {currencySymbol}{stats.pending.toFixed(2)}
            </Text>
            <Text style={[styles.statCount, { color: colors.mutedForeground }]}>
              {stats.countDraft + stats.countSent} invoice{(stats.countDraft + stats.countSent) !== 1 ? "s" : ""}
            </Text>
          </View>

          {/* Overdue */}
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.statIconWrap, { backgroundColor: "#fee2e2" }]}>
              <Feather name="alert-circle" size={18} color={colors.destructive} />
            </View>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Overdue</Text>
            <Text style={[styles.statValue, { color: colors.destructive }]} numberOfLines={1} adjustsFontSizeToFit>
              {currencySymbol}{stats.overdue.toFixed(2)}
            </Text>
            <Text style={[styles.statCount, { color: colors.mutedForeground }]}>
              {stats.countOverdue} invoice{stats.countOverdue !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {/* ── Revenue chart ── */}
        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.chartTitle, { color: colors.foreground }]}>Revenue — Last 6 Months</Text>
          <Text style={[styles.chartSub, { color: colors.mutedForeground }]}>
            {currencySymbol} {defaultCurrency}
          </Text>

          {maxBarValue === 1 ? (
            <View style={styles.chartEmpty}>
              <Feather name="bar-chart-2" size={40} color={colors.border} />
              <Text style={[styles.chartEmptyText, { color: colors.mutedForeground }]}>
                No invoice data yet
              </Text>
            </View>
          ) : (
            <View style={styles.chartWrap}>
              <BarChart
                data={barData}
                width={chartWidth - 32}
                barWidth={Math.floor((chartWidth - 80) / 6)}
                spacing={Math.floor((chartWidth - 80) / 24)}
                roundedTop
                hideRules={false}
                rulesColor={colors.border}
                rulesType="solid"
                noOfSections={4}
                maxValue={maxBarValue * 1.2}
                yAxisTextStyle={{ color: colors.mutedForeground, fontSize: 10, fontFamily: "Inter_400Regular" }}
                xAxisLabelTextStyle={{ color: colors.mutedForeground, fontSize: 11, fontFamily: "Inter_500Medium" }}
                yAxisColor={colors.border}
                xAxisColor={colors.border}
                yAxisThickness={1}
                xAxisThickness={1}
                hideYAxisText={false}
                showFractionalValues={false}
                yAxisLabelSuffix=""
                isAnimated
              />
            </View>
          )}
        </View>

        {/* ── Status breakdown ── */}
        <View style={[styles.breakdownCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.chartTitle, { color: colors.foreground }]}>Status Breakdown</Text>
          {(
            [
              { label: "Draft", count: stats.countDraft, color: colors.mutedForeground },
              { label: "Sent", count: stats.countSent, color: colors.primary },
              { label: "Paid", count: stats.countPaid, color: colors.success },
              { label: "Overdue", count: stats.countOverdue, color: colors.destructive },
            ] as const
          ).map(({ label, count, color }) => {
            const pct = invoices.length > 0 ? count / invoices.length : 0;
            return (
              <View key={label} style={styles.breakdownRow}>
                <Text style={[styles.breakdownLabel, { color: colors.mutedForeground }]}>{label}</Text>
                <View style={[styles.breakdownBarTrack, { backgroundColor: colors.muted }]}>
                  <View
                    style={[
                      styles.breakdownBarFill,
                      { width: `${Math.round(pct * 100)}%`, backgroundColor: color },
                    ]}
                  />
                </View>
                <Text style={[styles.breakdownCount, { color }]}>{count}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
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

  scrollContent: { padding: 20, gap: 20 },

  // 2×2 grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    width: "47.5%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  statLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.3 },
  statValue: { fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  statCount: { fontSize: 11, fontFamily: "Inter_400Regular" },

  // Chart card
  chartCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 4,
  },
  chartTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  chartSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 16 },
  chartWrap: { marginTop: 8, alignItems: "center" },
  chartEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  chartEmptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },

  // Status breakdown
  breakdownCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  breakdownLabel: { width: 52, fontSize: 13, fontFamily: "Inter_500Medium" },
  breakdownBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  breakdownBarFill: {
    height: 8,
    borderRadius: 4,
    minWidth: 4,
  },
  breakdownCount: { width: 28, textAlign: "right", fontSize: 13, fontFamily: "Inter_700Bold" },
});
