/**
 * Minimal Template
 * Black and white, no decorative elements, compact layout.
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

export function buildMinimalHTML(
  invoice: Invoice,
  currency: string,
  isProUser: boolean
): string {
  const itemRows = invoice.items
    .map(
      (item, i) => `
      <tr>
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
      color: #000000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page { width: 100%; min-height: 100vh; padding: 48px 52px 40px; position: relative; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 2px solid #000000; padding-bottom: 20px; }
    .logo { font-size: 22px; font-weight: 800; color: #000000; letter-spacing: -0.5px; }
    .invoice-meta { text-align: right; }
    .invoice-title { font-size: 28px; font-weight: 800; color: #000000; letter-spacing: -1px; line-height: 1; margin-bottom: 6px; }
    .invoice-number { font-size: 13px; color: #555555; margin-bottom: 2px; }
    .invoice-date   { font-size: 13px; color: #555555; }
    .bill-to { margin-bottom: 28px; }
    .section-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #888888; margin-bottom: 6px; }
    .client-name  { font-size: 18px; font-weight: 700; color: #000000; margin-bottom: 3px; }
    .client-email { font-size: 13px; color: #555555; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
    thead tr { border-bottom: 2px solid #000000; }
    thead th { padding: 10px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #000000; text-align: left; background: #ffffff; }
    .col-num    { width: 40px;  text-align: center; }
    .col-qty    { width: 60px;  text-align: center; }
    .col-unit   { width: 110px; text-align: right;  }
    .col-amount { width: 120px; text-align: right;  }
    tbody td { padding: 11px 12px; font-size: 13px; color: #222222; border-bottom: 1px solid #dddddd; vertical-align: middle; }
    .col-qty, .col-unit { color: #666666; }
    .col-amount { font-weight: 600; color: #000000; }
    .total-row td { padding: 16px 12px; border-bottom: none; border-top: 2px solid #000000; background: #ffffff; }
    .total-label  { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #000000; }
    .total-amount { font-size: 22px; font-weight: 800; color: #000000; text-align: right; letter-spacing: -0.5px; }
    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #888888; border-top: 1px solid #dddddd; padding-top: 16px; }
    .watermark { margin-top: 20px; text-align: center; font-size: 11px; color: #cccccc; }
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
