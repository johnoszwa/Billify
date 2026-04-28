/**
 * pdfGenerator.ts
 *
 * Exports currency helpers, `generatePDFHTML` (default/Professional template),
 * and `generatePDFHTMLWithTemplate` for template-aware PDF generation.
 *
 * Templates live in utils/templates/:
 *   minimal.ts      — black & white, compact
 *   professional.ts — original blue-accented design
 *   branded.ts      — professional + logo at top
 */

import { Invoice } from "@/context/InvoiceContext";
import { buildInvoiceHTML } from "./invoiceTemplate";
import { buildMinimalHTML } from "./templates/minimal";
import { buildProfessionalHTML } from "./templates/professional";
import { buildBrandedHTML } from "./templates/branded";

export { CURRENCY_SYMBOLS, formatCurrency } from "./currency";

export type InvoiceTemplate = "minimal" | "professional" | "branded";

/**
 * Generates the full HTML string using the default Professional template.
 * Visual design lives in utils/templates/professional.ts.
 */
export function generatePDFHTML(
  invoice: Invoice,
  currency: string,
  isProUser: boolean
): string {
  return buildInvoiceHTML(invoice, currency, isProUser);
}

/**
 * Generates the full HTML string for a PDF invoice using the chosen template.
 * Pro users can pick any template; free users always get Professional.
 */
export function generatePDFHTMLWithTemplate(
  invoice: Invoice,
  currency: string,
  isProUser: boolean,
  template: InvoiceTemplate,
  logoBase64?: string
): string {
  if (!isProUser) {
    return buildProfessionalHTML(invoice, currency, isProUser);
  }
  switch (template) {
    case "minimal":
      return buildMinimalHTML(invoice, currency, isProUser);
    case "branded":
      return buildBrandedHTML(invoice, currency, isProUser, logoBase64);
    case "professional":
    default:
      return buildProfessionalHTML(invoice, currency, isProUser);
  }
}
