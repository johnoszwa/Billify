import { Invoice } from "@/context/InvoiceContext";

export const CURRENCY_SYMBOLS: Record<string, string> = {
  // Global / Major
  USD: "$", EUR: "€", GBP: "£", JPY: "¥", CAD: "CA$", AUD: "A$",
  CHF: "CHF", CNY: "¥", HKD: "HK$", SGD: "S$", NZD: "NZ$",
  SEK: "kr", NOK: "kr", DKK: "kr",
  // Asia / Middle East
  INR: "₹", PKR: "Rs", BDT: "৳", LKR: "Rs", AED: "د.إ",
  SAR: "﷼", QAR: "ر.ق", KWD: "KD", BHD: "BD", OMR: "ر.ع.",
  ILS: "₪", TRY: "₺", THB: "฿", MYR: "RM", IDR: "Rp",
  PHP: "₱", VND: "₫", KRW: "₩",
  // Americas
  BRL: "R$", MXN: "MX$", ARS: "$", CLP: "CLP$", COP: "COL$", PEN: "S/",
  // Europe
  PLN: "zł", CZK: "Kč", HUF: "Ft", RON: "lei", RUB: "₽", UAH: "₴",
  // Africa — West
  NGN: "₦", GHS: "₵", XOF: "CFA", SLL: "Le", GMD: "D",
  GNF: "FG", CVE: "$", LRD: "L$", MRU: "UM",
  // Africa — East
  KES: "KSh", TZS: "TSh", UGX: "USh", ETB: "Br", RWF: "RF",
  BIF: "Fr", DJF: "Fdj", ERN: "Nfk", SOS: "Sh", MGA: "Ar",
  SCR: "₨", MUR: "₨", KMF: "CF",
  // Africa — Southern
  ZAR: "R", ZMW: "ZK", BWP: "P", NAD: "N$", MWK: "MK",
  ZWL: "Z$", SZL: "L", LSL: "L", MOZ: "MT", AOA: "Kz",
  // Africa — Central
  XAF: "FCFA", CDF: "FC", STN: "Db",
  // Africa — North
  EGP: "E£", MAD: "MAD", TND: "د.ت", DZD: "دج", LYD: "LD", SDG: "ج.س.",
};

export function formatCurrency(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency + " ";
  return `${symbol}${amount.toFixed(2)}`;
}

export function generatePDFHTML(
  invoice: Invoice,
  currency: string,
  isProUser: boolean
): string {
  const itemsRows = invoice.items
    .map(
      (item, i) => `
    <tr>
      <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b; text-align: center; width: 44px;">${i + 1}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #334155;">${escapeHtml(item.description)}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #334155; text-align: right; white-space: nowrap;">${formatCurrency(item.price, currency)}</td>
    </tr>
  `
    )
    .join("");

  const watermark = !isProUser
    ? `<div style="position: fixed; bottom: 20px; left: 0; right: 0; text-align: center; font-size: 12px; color: #94a3b8; font-family: Inter, sans-serif;">
        Generated with Billify &bull; Upgrade to Pro to remove watermark
      </div>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Inter, -apple-system, Helvetica, sans-serif; background: #fff; color: #0f172a; }
  .page { padding: 48px 56px; max-width: 700px; margin: 0 auto; min-height: 100vh; position: relative; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; }
  .logo { font-size: 22px; font-weight: 700; color: #2563eb; letter-spacing: -0.5px; }
  .invoice-meta { text-align: right; }
  .invoice-title { font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: -1px; margin-bottom: 6px; }
  .invoice-number { font-size: 13px; color: #64748b; margin-bottom: 2px; }
  .invoice-date { font-size: 13px; color: #64748b; }
  .divider { height: 2px; background: #2563eb; margin-bottom: 36px; border-radius: 2px; }
  .bill-to { margin-bottom: 36px; }
  .section-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
  .client-name { font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 2px; }
  .client-email { font-size: 14px; color: #64748b; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
  .table-header th { padding: 10px 16px; background: #f8fafc; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; text-align: left; }
  .table-header th:first-child { text-align: center; width: 44px; }
  .table-header th:last-child { text-align: right; }
  .total-row td { padding: 16px; background: #f8fafc; }
  .total-label { font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
  .total-amount { font-size: 22px; font-weight: 800; color: #2563eb; text-align: right; letter-spacing: -0.5px; }
  .footer { margin-top: 48px; text-align: center; font-size: 12px; color: #cbd5e1; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="logo">Billify</div>
    <div class="invoice-meta">
      <div class="invoice-title">INVOICE</div>
      <div class="invoice-number">${escapeHtml(invoice.invoiceNumber)}</div>
      <div class="invoice-date">${escapeHtml(invoice.date)}</div>
    </div>
  </div>
  <div class="divider"></div>
  <div class="bill-to">
    <div class="section-label">Bill To</div>
    <div class="client-name">${escapeHtml(invoice.clientName)}</div>
    ${invoice.clientEmail ? `<div class="client-email">${escapeHtml(invoice.clientEmail)}</div>` : ""}
  </div>
  <table>
    <thead class="table-header">
      <tr>
        <th>#</th>
        <th>Description</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
      <tr class="total-row">
        <td></td>
        <td class="total-label">Total</td>
        <td class="total-amount">${formatCurrency(invoice.total, currency)}</td>
      </tr>
    </tbody>
  </table>
  <div class="footer">Thank you for your business</div>
</div>
${watermark}
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
