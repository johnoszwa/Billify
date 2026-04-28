/**
 * ─────────────────────────────────────────────────────────────────────────────
 * BILLIFY — PDF Invoice Template (compatibility re-export)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The actual templates now live in utils/templates/:
 *   minimal.ts      — black & white, compact, no decoration
 *   professional.ts — original design (blue accents, coloured header)
 *   branded.ts      — professional + logo section at top
 *
 * This file keeps `buildInvoiceHTML` available so existing callers continue
 * to work without changes. It delegates to the Professional template.
 *
 * To customise the default PDF look, edit utils/templates/professional.ts.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Invoice } from "@/context/InvoiceContext";
import { buildProfessionalHTML } from "./templates/professional";

export function buildInvoiceHTML(
  invoice: Invoice,
  currency: string,
  isProUser: boolean
): string {
  return buildProfessionalHTML(invoice, currency, isProUser);
}
