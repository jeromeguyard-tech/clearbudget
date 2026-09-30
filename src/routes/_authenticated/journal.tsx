import { createFileRoute } from "@tanstack/react-router";
import { Download, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { useCategoryLabel } from "@/lib/categories";
import { AppShell } from "@/components/AppShell";
import { BUCKETS, formatMoney, type Bucket } from "@/lib/budget";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { usePrefs } from "@/lib/prefs";
import { useDeleteTransaction, useRecurring, useTransactions } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/journal")({
  head: () => ({
    meta: [
      { title: "Journal des transactions — ClearBudget" },
      {
        name: "description",
        content:
          "Historique complet et cherchable de tes dépenses quotidiennes et récurrentes, exportable en CSV.",
      },
      { property: "og:title", content: "Journal des transactions — ClearBudget" },
      {
        property: "og:description",
        content: "Recherche, pagine et exporte toutes tes entrées financières.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Journal,
});

const PAGE_SIZE = 12;

function Journal() {
  const { t, lang } = useI18n();
  const catLabel = useCategoryLabel();
  const { currency } = usePrefs();
  const { session } = useAuth();
  const userId = session?.user.id;
  const { data: transactions = [] } = useTransactions(userId);
  const { data: recurring = [] } = useRecurring(userId);
  const remove = useDeleteTransaction(userId);

  const [query, setQuery] = useState("");
  const [bucket, setBucket] = useState<Bucket | "all">("all");
  const [page, setPage] = useState(0);

  const rows = useMemo(() => {
    const day = new Date();
    const recurringRows = recurring.map((row) => ({
      id: `recurring-${row.id}`,
      amount: Number(row.amount),
      description: row.label,
      primary_category: row.primary_category,
      secondary_category: row.secondary_category,
      comment: row.bank_account,
      occurred_on: `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(
        Math.min(row.debit_day, 28),
      ).padStart(2, "0")}`,
      source: "recurring" as const,
      deletable: false,
    }));
    const dailyRows = transactions.map((row) => ({
      ...row,
      amount: Number(row.amount),
      source: "daily" as const,
      deletable: true,
    }));
    return [...dailyRows, ...recurringRows]
      .filter((row) => bucket === "all" || row.primary_category === bucket)
      .filter((row) => {
        if (!query.trim()) return true;
        const haystack = [row.description, catLabel(row.secondary_category), row.comment]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(query.trim().toLowerCase());
      })
      .sort((a, b) => (a.occurred_on < b.occurred_on ? 1 : -1));
  }, [transactions, recurring, bucket, query, catLabel]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const exportCsv = () => {
    const header = [
      t("date"),
      t("description"),
      t("primaryCategory"),
      t("secondaryCategory"),
      t("amount"),
      t("comment"),
    ];
    const body = rows.map((row) => [
      row.occurred_on,
      row.description,
      t(row.primary_category),
      catLabel(row.secondary_category) ?? "",
      row.amount.toFixed(2),
      row.comment ?? "",
    ]);
    const csv = [header, ...body]
      .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `clearbudget-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell title={t("journal")} subtitle={`${rows.length} · ${t("filters")}`}>
      <section className="kpanel space-y-3 rounded-2xl p-4">
        <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
          <Search className="size-4 text-mute" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
            placeholder={t("search")}
            className="w-full bg-transparent text-[14px] outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setBucket("all")}
            className={
              bucket === "all"
                ? "rounded-full bg-brand px-3 py-1.5 text-[12px] font-semibold text-brand-foreground"
                : "rounded-full border border-border px-3 py-1.5 text-[12px] text-mute"
            }
          >
            {t("all")}
          </button>
          {BUCKETS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setBucket(value);
                setPage(0);
              }}
              className={
                bucket === value
                  ? "rounded-full px-3 py-1.5 text-[12px] font-semibold"
                  : "rounded-full border border-border px-3 py-1.5 text-[12px] text-mute"
              }
              style={
                bucket === value
                  ? { background: `var(--${value})`, color: "var(--brand-foreground)" }
                  : undefined
              }
            >
              {t(value)}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-[13px] font-medium"
        >
          <Download className="size-4" />
          {t("exportCsv")}
        </button>
      </section>

      <div className="kpanel divide-y divide-border rounded-2xl">
        {current.map((row) => (
          <div key={row.id} className="flex items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium">{row.description}</p>
              <p className="knum text-[11px] text-mute">
                {row.occurred_on} · {t(row.primary_category)} ·{" "}
                {catLabel(row.secondary_category) ?? "—"}
                {row.source === "recurring" ? ` · ${t("recurring")}` : ""}
              </p>
            </div>
            <span className="knum text-[13px]" style={{ color: `var(--${row.primary_category})` }}>
              −{formatMoney(row.amount, currency, lang)}
            </span>
            {row.deletable ? (
              <button
                type="button"
                aria-label={t("delete")}
                onClick={() => remove.mutate(row.id)}
                className="grid size-8 place-items-center rounded-lg border border-border text-mute"
              >
                <Trash2 className="size-4" />
              </button>
            ) : null}
          </div>
        ))}
        {rows.length === 0 ? (
          <p className="p-4 text-center text-[12px] text-mute">{t("noTransactions")}</p>
        ) : null}
      </div>

      {pageCount > 1 ? (
        <div className="flex items-center justify-between text-[12px] text-mute">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            className="rounded-full border border-border px-3 py-1.5 disabled:opacity-40"
          >
            {t("prev")}
          </button>
          <span className="knum">
            {t("page")} {page + 1} / {pageCount}
          </span>
          <button
            type="button"
            disabled={page + 1 >= pageCount}
            onClick={() => setPage(page + 1)}
            className="rounded-full border border-border px-3 py-1.5 disabled:opacity-40"
          >
            {t("next")}
          </button>
        </div>
      ) : null}
    </AppShell>
  );
}
