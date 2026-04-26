/**
 * pdfGenerator.ts
 *
 * Exports currency helpers and `generatePDFHTML` used throughout the app.
 *
 * To change how the exported PDF looks, edit:
 *   utils/invoiceTemplate.ts  ← colours, fonts, layout, footer text, etc.
 */

import { Invoice } from "@/context/InvoiceContext";
import { buildInvoiceHTML } from "./invoiceTemplate";

export { CURRENCY_SYMBOLS, formatCurrency } from "./currency";

/**
 * Generates the full HTML string for a PDF invoice.
 * Visual design lives in utils/invoiceTemplate.ts.
 */
export function generatePDFHTML(
  invoice: Invoice,
  currency: string,
  isProUser: boolean
): string {
  return buildInvoiceHTML(invoice, currency, isProUser);
}
