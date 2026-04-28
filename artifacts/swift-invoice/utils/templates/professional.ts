/**
 * Professional Template
 * The default Billify invoice: blue accent bar, colored table header, brand colours.
 * This is the original buildInvoiceHTML logic, moved here unchanged.
 */

import { Invoice } from "@/context/InvoiceContext";
import { formatCurrency } from "@/utils/currency";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildProfessionalHTML(
  invoice: Invoice,
  currency: string,
  isProUser: boolean
): string {
  const itemRows = invoice.items
    .map(
      (item, i) => `
      <tr class="${i % 2 === 0 ? "row-even" : "row-odd"}">
        <td class="col-num">${i + 1}</td>
        <td class="col-desc">${escapeHtml(item.description)}</td>
        <td class="col-qty">${item.quantity ?? 1}</td>
        <td class="col-unit">${formatCurrency(item.unitPrice ?? item.price, currency)}</td>
        <td class="col-amount">${formatCurrency(item.price, currency)}</td>
      </tr>`
    )
    .join("");

  const watermark = isProUser
    ? ""
    : `<p class="watermark">Generated with Billify &bull; Upgrade to Pro to remove this watermark</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice ${escapeHtml(invoice.invoiceNumber)}</title>
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4; margin: 0; }
    body {
      font-family: -apple-system, "Helvetica Neue", Arial, sans-serif;
      background: #ffffff;
      color: #0f172a;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page { width: 100%; min-height: 100vh; padding: 52px 56px 48px; position: relative; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
    .logo { font-size: 26px; font-weight: 800; color: #2563eb; letter-spacing: -0.5px; }
    .invoice-meta { text-align: right; }
    .invoice-title { font-size: 32px; font-weight: 800; color: #0f172a; letter-spacing: -1px; line-height: 1; margin-bottom: 8px; }
    .invoice-number { font-size: 14px; color: #64748b; margin-bottom: 3px; }
    .invoice-date   { font-size: 14px; color: #64748b; }
    .accent-bar { height: 3px; background: #2563eb; border-radius: 2px; margin-bottom: 36px; }
    .bill-to { margin-bottom: 36px; }
    .section-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #94a3b8; margin-bottom: 8px; }
    .client-name  { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
    .client-email { font-size: 14px; color: #64748b; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
    thead tr { background: #2563eb; }
    thead th { padding: 12px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #ffffff; text-align: left; border: none; }
    .col-num    { width: 40px;  text-align: center; }
    .col-qty    { width: 60px;  text-align: center; }
    .col-unit   { width: 110px; text-align: right;  }
    .col-amount { width: 120px; text-align: right;  }
    tbody td { padding: 13px 14px; font-size: 14px; color: #334155; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
    .row-even { background: #ffffff; }
    .row-odd  { background: #f8fafc; }
    .col-qty, .col-unit { color: #64748b; }
    .col-amount { font-weight: 600; color: #0f172a; }
    .total-row td { padding: 18px 14px; background: #eff6ff; border-bottom: none; border-top: 2px solid #2563eb; }
    .total-label  { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #2563eb; }
    .total-amount { font-size: 24px; font-weight: 800; color: #2563eb; text-align: right; letter-spacing: -0.5px; }
    .footer { margin-top: 52px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 13px; color: #94a3b8; }
    .watermark { margin-top: 24px; text-align: center; font-size: 11px; color: #cbd5e1; }
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
  <div class="accent-bar"></div>
  <div class="bill-to">
    <div class="section-label">Bill To</div>
    <div class="client-name">${escapeHtml(invoice.clientName)}</div>
    ${invoice.clientEmail ? `<div class="client-email">${escapeHtml(invoice.clientEmail)}</div>` : ""}
  </div>
  <table>
    <thead>
      <tr>
        <th class="col-num">#</th>
        <th class="col-desc">Description</th>
        <th class="col-qty">Qty</th>
        <th class="col-unit">Unit Price</th>
        <th class="col-amount">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
      <tr class="total-row">
        <td colspan="3"></td>
        <td class="total-label">Total</td>
        <td class="total-amount">${formatCurrency(invoice.total, currency)}</td>
      </tr>
    </tbody>
  </table>
  <div class="footer">Thank you for your business</div>
  ${watermark}
</div>
</body>
</html>`;
}
