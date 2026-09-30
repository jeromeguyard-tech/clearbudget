export type Bucket = "needs" | "wants" | "savings";

export const BUCKETS: Bucket[] = ["needs", "wants", "savings"];

export const BUCKET_SHARE: Record<Bucket, number> = {
  needs: 0.5,
  wants: 0.3,
  savings: 0.2,
};

export const SECONDARY_CATEGORIES: Record<Bucket, { value: string; fr: string; en: string }[]> = {
  needs: [
    { value: "housing", fr: "Logement", en: "Housing" },
    { value: "groceries", fr: "Alimentation", en: "Groceries" },
    { value: "transport", fr: "Transport", en: "Transport" },
    { value: "utilities", fr: "Énergie & télécom", en: "Utilities" },
    { value: "health", fr: "Santé", en: "Health" },
    { value: "insurance", fr: "Assurances", en: "Insurance" },
  ],
  wants: [
    { value: "dining", fr: "Restaurants & sorties", en: "Dining & going out" },
    { value: "shopping", fr: "Shopping", en: "Shopping" },
    { value: "travel", fr: "Voyages", en: "Travel" },
    { value: "subscriptions", fr: "Abonnements", en: "Subscriptions" },
    { value: "leisure", fr: "Loisirs", en: "Leisure" },
  ],
  savings: [
    { value: "emergency", fr: "Épargne de précaution", en: "Emergency fund" },
    { value: "investment", fr: "Investissements", en: "Investments" },
    { value: "debt", fr: "Remboursement de dettes", en: "Debt repayment" },
    { value: "projects", fr: "Projets", en: "Projects" },
  ],
};

export function secondaryLabel(value: string | null, lang: "fr" | "en") {
  if (!value) return null;
  for (const bucket of BUCKETS) {
    const found = SECONDARY_CATEGORIES[bucket].find((c) => c.value === value);
    if (found) return found[lang];
  }
  return value;
}

export type IncomeSettings = {
  fixed_annual: number;
  variable_annual: number;
  other_annual: number;
  transport_benefit_annual: number;
  meal_vouchers_annual: number;
  months: number;
};

export function totalAnnual(income: IncomeSettings) {
  return (
    Number(income.fixed_annual || 0) +
    Number(income.variable_annual || 0) +
    Number(income.other_annual || 0) +
    Number(income.transport_benefit_annual || 0) +
    Number(income.meal_vouchers_annual || 0)
  );
}

export function monthlyIncome(income: IncomeSettings) {
  const months = Number(income.months) || 12;
  return totalAnnual(income) / months;
}

export function allocation(monthly: number): Record<Bucket, number> {
  return {
    needs: monthly * BUCKET_SHARE.needs,
    wants: monthly * BUCKET_SHARE.wants,
    savings: monthly * BUCKET_SHARE.savings,
  };
}

export function formatMoney(value: number, currency: string, lang: "fr" | "en") {
  return new Intl.NumberFormat(lang === "fr" ? "fr-FR" : "en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}
