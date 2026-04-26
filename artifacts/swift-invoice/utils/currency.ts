/**
 * currency.ts
 * Shared currency symbol map and formatting helper.
 * Imported by both pdfGenerator.ts and invoiceTemplate.ts.
 */

export const CURRENCY_SYMBOLS: Record<string, string> = {
  // Global / Major
  USD: "$",   EUR: "€",   GBP: "£",   JPY: "¥",   CAD: "CA$", AUD: "A$",
  CHF: "CHF", CNY: "¥",  HKD: "HK$", SGD: "S$",  NZD: "NZ$",
  SEK: "kr",  NOK: "kr",  DKK: "kr",
  // Asia / Middle East
  INR: "₹",  PKR: "Rs",  BDT: "৳",  LKR: "Rs",  AED: "د.إ",
  SAR: "﷼",  QAR: "ر.ق", KWD: "KD",  BHD: "BD",  OMR: "ر.ع.",
  ILS: "₪",  TRY: "₺",  THB: "฿",  MYR: "RM",  IDR: "Rp",
  PHP: "₱",  VND: "₫",  KRW: "₩",
  // Americas
  BRL: "R$", MXN: "MX$", ARS: "$",  CLP: "CLP$", COP: "COL$", PEN: "S/",
  // Europe
  PLN: "zł", CZK: "Kč", HUF: "Ft", RON: "lei",  RUB: "₽",  UAH: "₴",
  // Africa — West
  NGN: "₦",  GHS: "₵",  XOF: "CFA", SLL: "Le",  GMD: "D",
  GNF: "FG", CVE: "$",  LRD: "L$", MRU: "UM",
  // Africa — East
  KES: "KSh", TZS: "TSh", UGX: "USh", ETB: "Br", RWF: "RF",
  BIF: "Fr", DJF: "Fdj", ERN: "Nfk", SOS: "Sh",  MGA: "Ar",
  SCR: "₨",  MUR: "₨",  KMF: "CF",
  // Africa — Southern
  ZAR: "R",  ZMW: "ZK", BWP: "P",  NAD: "N$",  MWK: "MK",
  ZWL: "Z$", SZL: "L",  LSL: "L",  MOZ: "MT",  AOA: "Kz",
  // Africa — Central
  XAF: "FCFA", CDF: "FC", STN: "Db",
  // Africa — North
  EGP: "E£", MAD: "MAD", TND: "د.ت", DZD: "دج", LYD: "LD", SDG: "ج.س.",
};

export function formatCurrency(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency + " ";
  return `${symbol}${amount.toFixed(2)}`;
}
