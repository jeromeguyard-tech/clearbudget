import { formatMoney, type Bucket } from "./budget";

type SpendingRow = {
  primary_category: Bucket;
  secondary_category: string | null;
  amount: number | string;
};

type TransactionRow = SpendingRow & {
  occurred_on: string;
  description?: string | null;
};

export type ReportInput = {
  lang: "fr" | "en";
  currency: string;
  year: number;
  monthIndex: number;
  monthNames: string[];
  income: number;
  targets: Record<Bucket, number>;
  actuals: Record<Bucket, number>;
  bucketLabels: Record<Bucket, string>;
  categories: { label: string; bucket: Bucket; amount: number }[];
  recurring: SpendingRow[];
  transactions: TransactionRow[];
  catLabel: (id: string | null) => string | undefined;
};

const BUCKETS: Bucket[] = ["needs", "wants", "savings"];
const COLORS: Record<Bucket, [number, number, number]> = {
  needs: [59, 130, 160],
  wants: [214, 120, 80],
  savings: [70, 160, 110],
};

const clean = (s: string) => s.replace(/[\u202f\u00a0]/g, " ").replace(/\u2212/g, "-");

/** Per-month totals by bucket for the report year (recurring counted every month). */
function monthly(input: ReportInput) {
  const rows = Array.from({ length: 12 }, () => ({ needs: 0, wants: 0, savings: 0 }) as Record<Bucket, number>);
  for (const r of input.recurring) for (const m of rows) m[r.primary_category] += Number(r.amount);
  for (const t of input.transactions) {
    const d = new Date(`${t.occurred_on}T00:00:00`);
    if (d.getFullYear() === input.year) rows[d.getMonth()]![t.primary_category] += Number(t.amount);
  }
  return rows;
}

function monthTx(input: ReportInput) {
  return input.transactions.filter((t) => {
    const d = new Date(`${t.occurred_on}T00:00:00`);
    return d.getFullYear() === input.year && d.getMonth() === input.monthIndex;
  });
}

const fileBase = (i: ReportInput) =>
  `clearbudget-bilan-${i.year}-${String(i.monthIndex + 1).padStart(2, "0")}`;

export async function exportMonthlyPdf(input: ReportInput) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const fr = input.lang === "fr";
  const money = (n: number) => clean(formatMoney(n, input.currency, input.lang));
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const period = `${input.monthNames[input.monthIndex]} ${input.year}`;

  doc.setFont("helvetica", "bold").setFontSize(20).text("ClearBudget", 15, 20);
  doc.setFont("helvetica", "normal").setFontSize(11).setTextColor(110);
  doc.text(`${fr ? "Bilan budgétaire mensuel" : "Monthly budget report"} · ${period}`, 15, 27);
  doc.setTextColor(0);

  const spent = BUCKETS.reduce((s, b) => s + input.actuals[b], 0);
  doc.setFontSize(11);
  doc.text(`${fr ? "Revenu mensuel" : "Monthly income"} : ${money(input.income)}`, 15, 38);
  doc.text(`${fr ? "Total dépensé" : "Total spent"} : ${money(spent)}`, 15, 44);
  doc.text(`${fr ? "Solde" : "Balance"} : ${money(input.income - spent)}`, 15, 50);

  doc.setFont("helvetica", "bold").setFontSize(13).text(fr ? "Répartition 50/30/20" : "50/30/20 split", 15, 62);
  autoTable(doc, {
    startY: 66,
    head: [[fr ? "Enveloppe" : "Envelope", fr ? "Cible" : "Target", fr ? "Réel" : "Actual", "%", fr ? "Écart" : "Diff"]],
    body: BUCKETS.map((b) => {
      const t = input.targets[b], a = input.actuals[b];
      return [input.bucketLabels[b], money(t), money(a), t > 0 ? `${Math.round((a / t) * 100)}%` : "-", money(t - a)];
    }),
    headStyles: { fillColor: [40, 40, 48] },
    didParseCell: (d) => {
      if (d.section === "body" && d.column.index === 0) d.cell.styles.textColor = COLORS[BUCKETS[d.row.index]!];
    },
  });

  // Evolution chart
  let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
  doc.setFont("helvetica", "bold").setFontSize(13).text(
    `${fr ? "Évolution des dépenses" : "Spending evolution"} · ${input.year}`, 15, y);
  const data = monthly(input);
  const max = Math.max(1, ...data.map((m) => m.needs + m.wants + m.savings));
  const chartH = 55, top = y + 6, base = top + chartH, slot = (W - 30) / 12;
  doc.setDrawColor(200).line(15, base, W - 15, base);
  doc.setFont("helvetica", "normal").setFontSize(7);
  data.forEach((m, i) => {
    let yy = base;
    const x = 15 + i * slot + slot * 0.2;
    for (const b of BUCKETS) {
      const h = (m[b] / max) * chartH;
      if (h > 0) {
        doc.setFillColor(...COLORS[b]).rect(x, yy - h, slot * 0.6, h, "F");
        yy -= h;
      }
    }
    if (i === input.monthIndex) doc.setFont("helvetica", "bold");
    doc.text(input.monthNames[i]!.slice(0, 3), x + slot * 0.3, base + 4, { align: "center" });
    doc.setFont("helvetica", "normal");
  });
  let lx = 15;
  BUCKETS.forEach((b) => {
    doc.setFillColor(...COLORS[b]).rect(lx, base + 8, 3, 3, "F");
    doc.setFontSize(8).text(input.bucketLabels[b], lx + 5, base + 10.5);
    lx += 40;
  });

  y = base + 18;
  autoTable(doc, {
    startY: y,
    head: [[fr ? "Mois" : "Month", ...BUCKETS.map((b) => input.bucketLabels[b]), "Total"]],
    body: data.map((m, i) => [input.monthNames[i]!, ...BUCKETS.map((b) => money(m[b])), money(m.needs + m.wants + m.savings)]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [40, 40, 48] },
  });

  doc.addPage();
  doc.setFont("helvetica", "bold").setFontSize(13).text(fr ? "Sous-catégories du mois" : "Sub-categories this month", 15, 20);
  autoTable(doc, {
    startY: 24,
    head: [[fr ? "Sous-catégorie" : "Sub-category", fr ? "Enveloppe" : "Envelope", fr ? "Montant" : "Amount"]],
    body: input.categories.map((c) => [c.label, input.bucketLabels[c.bucket], money(c.amount)]),
    headStyles: { fillColor: [40, 40, 48] },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFont("helvetica", "bold").setFontSize(13).text(fr ? "Transactions du mois" : "Transactions this month", 15, y);
  autoTable(doc, {
    startY: y + 4,
    head: [["Date", "Description", fr ? "Enveloppe" : "Envelope", fr ? "Sous-catégorie" : "Sub-category", fr ? "Montant" : "Amount"]],
    body: monthTx(input).map((t) => [t.occurred_on, t.description ?? "", input.bucketLabels[t.primary_category], input.catLabel(t.secondary_category) ?? "", money(Number(t.amount))]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [40, 40, 48] },
  });

  doc.save(`${fileBase(input)}.pdf`);
}

export function exportMonthlyCsv(input: ReportInput) {
  const fr = input.lang === "fr";
  const q = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const n = (v: number) => v.toFixed(2);
  const lines: string[] = [];
  const row = (...c: (string | number)[]) => lines.push(c.map(q).join(";"));
  row(fr ? "Bilan" : "Report", `${input.monthNames[input.monthIndex]} ${input.year}`);
  row(fr ? "Revenu mensuel" : "Monthly income", n(input.income));
  lines.push("");
  row(fr ? "Enveloppe" : "Envelope", fr ? "Cible" : "Target", fr ? "Réel" : "Actual", fr ? "Écart" : "Diff");
  for (const b of BUCKETS) row(input.bucketLabels[b], n(input.targets[b]), n(input.actuals[b]), n(input.targets[b] - input.actuals[b]));
  lines.push("");
  row(fr ? "Mois" : "Month", ...BUCKETS.map((b) => input.bucketLabels[b]), "Total");
  monthly(input).forEach((m, i) => row(input.monthNames[i]!, ...BUCKETS.map((b) => n(m[b])), n(m.needs + m.wants + m.savings)));
  lines.push("");
  row("Date", "Description", fr ? "Enveloppe" : "Envelope", fr ? "Sous-catégorie" : "Sub-category", fr ? "Montant" : "Amount");
  for (const t of monthTx(input))
    row(t.occurred_on, t.description ?? "", input.bucketLabels[t.primary_category], input.catLabel(t.secondary_category) ?? "", n(Number(t.amount)));
  const blob = new Blob([`\uFEFF${lines.join("\n")}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileBase(input)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
