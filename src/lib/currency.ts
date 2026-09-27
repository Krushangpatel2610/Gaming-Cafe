const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹", 
  USD: "$", 
  EUR: "€", 
  GBP: "£",
};

export function currencySymbol(code?: string): string {
  return CURRENCY_SYMBOLS[(code || "INR").toUpperCase()] || (code || "₹");
}

export function formatCurrency(amount: number | string, code?: string): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return `${currencySymbol(code)}${Number.isFinite(n) ? n.toFixed(2) : "0.00"}`;
}
