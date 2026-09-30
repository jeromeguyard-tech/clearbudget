import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  BarChart3,
  FileDown,
  HeartHandshake,
  Home,
  LayoutDashboard,
  Loader2,
  PiggyBank,
  ReceiptText,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { exportMonthlyCsv, exportMonthlyPdf } from "@/lib/report";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import { useCategoriesByBucket, useCategoryLabel } from "@/lib/categories";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { BUCKETS, formatMoney, type Bucket } from "@/lib/budget";
import { getBudgetInsight } from "@/lib/insight.functions";
import { MONTH_NAMES, useI18n } from "@/lib/i18n";
import { usePrefs } from "@/lib/prefs";
import { useBudget } from "@/lib/useBudget";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — ClearBudget" },
      {
        name: "description",
        content:
          "Revenu mensuel, enveloppes 50/30/20, prévision contre dépenses réelles et analyse de ton budget.",
      },
      { property: "og:title", content: "Tableau de bord — ClearBudget" },
      {
        property: "og:description",
        content: "Suis tes enveloppes Nécessités, Désirs et Épargne en un coup d'œil.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

const ICONS: Record<Bucket, typeof Home> = {
  needs: Home,
  wants: HeartHandshake,
  savings: PiggyBank,
};

const BAR_COLORS: Record<Bucket, string> = {
  needs: "var(--needs)",
  wants: "var(--wants)",
  savings: "var(--savings)",
};

type DashboardView = "overview" | "forecast" | "evolution" | "transactions";

function Dashboard() {
  const { t, lang } = useI18n();
  const catLabel = useCategoryLabel();
  const byBucket = useCategoriesByBucket();
  const { currency } = usePrefs();
  const budget = useBudget();
  const [activeView, setActiveView] = useState<DashboardView>("overview");
  const insightFn = useServerFn(getBudgetInsight);

  const insight = useMutation({
    mutationFn: async () =>
      insightFn({
        data: {
          lang,
          currency,
          monthlyIncome: budget.periodIncome,
          targets: budget.targets,
          actuals: budget.actuals,
          topCategories: budget.bySecondary.slice(0, 6).map(([key, value]) => ({
            label: catLabel(key) ?? key,
            amount: value.amount,
          })),
        },
      }),
  });

  const period =
    budget.range === "month"
      ? `${MONTH_NAMES[lang][budget.monthIndex]} ${budget.year}`
      : String(budget.year);

  const chartData = (["needs", "wants", "savings"] as Bucket[]).map((bucket) => ({
    bucket,
    label: t(bucket),
    forecast: Math.round(budget.targets[bucket]),
    actual: Math.round(budget.actuals[bucket]),
  }));

  if (!budget.loading && !budget.income) {
    return (
      <AppShell title={t("dashboard")} subtitle={period}>
        <section className="kpanel rounded-2xl p-5 text-center">
          <p className="text-[14px]">{t("setupNeeded")}</p>
          <Link
            to="/onboarding"
            className="mt-4 inline-flex rounded-2xl bg-brand px-4 py-2.5 text-[13px] font-semibold text-brand-foreground"
          >
            {t("go")}
          </Link>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={t("dashboard")}
      subtitle={`${budget.range === "month" ? t("monthlyView") : t("yearlyView")} · ${period}`}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-border p-0.5 text-[12px]">
            {(["month", "year"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => budget.setRange(value)}
                className={
                  budget.range === value
                    ? "rounded-full bg-brand px-3 py-1 font-semibold text-brand-foreground"
                    : "rounded-full px-3 py-1 text-mute"
                }
              >
                {value === "month" ? t("month") : t("year")}
              </button>
            ))}
          </div>
          {budget.range === "month" ? (
            <select
              value={budget.monthIndex}
              onChange={(event) => budget.setMonthIndex(Number(event.target.value))}
              className="rounded-full border border-border bg-transparent px-3 py-1.5 text-[12px] outline-none"
            >
              {MONTH_NAMES[lang].map((name, index) => (
                <option key={name} value={index}>
                  {name}
                </option>
              ))}
            </select>
          ) : null}
          <input
            type="number"
            value={budget.year}
            onChange={(event) => budget.setYear(Number(event.target.value))}
            className="knum w-20 rounded-full border border-border bg-transparent px-3 py-1.5 text-[12px] outline-none"
          />
        </div>
      }
    >
      <nav aria-label={t("dashboard")} className="kpanel grid grid-cols-4 gap-1 rounded-2xl p-1.5">
        {([
          { value: "overview", label: t("dashboardOverview"), icon: LayoutDashboard },
          { value: "forecast", label: t("dashboardForecast"), icon: BarChart3 },
          { value: "evolution", label: t("dashboardEvolution"), icon: TrendingUp },
          { value: "transactions", label: t("dashboardTransactions"), icon: ReceiptText },
        ] as const).map(({ value, label, icon: Icon }) => (
          <Button
            key={value}
            type="button"
            variant={activeView === value ? "default" : "ghost"}
            onClick={() => setActiveView(value)}
            aria-pressed={activeView === value}
            className="h-14 min-w-0 flex-col gap-1 rounded-xl px-1 text-[10px] sm:h-10 sm:flex-row sm:px-2 sm:text-[11px]"
          >
            <Icon className="size-4" />
            <span className="max-w-full truncate">{label}</span>
          </Button>
        ))}
      </nav>

      {activeView === "overview" ? (
        <>
          <section className="kpanel-diag rise-in rounded-2xl p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[11px] uppercase tracking-[0.18em] text-mute">
            {budget.range === "month" ? t("monthlyIncome") : t("totalAnnual")}
          </h2>
          <span className="knum text-[11px] text-brand">50 · 30 · 20</span>
        </div>
        <p className="knum mt-2 text-[34px] font-bold leading-none">
          {formatMoney(budget.periodIncome, currency, lang)}
        </p>
        <p className="mt-2 text-[12px] text-mute">
          {t("totalSpent")} · {formatMoney(
            budget.actuals.needs + budget.actuals.wants + budget.actuals.savings,
            currency,
            lang,
          )}
        </p>
          </section>

      {budget.range === "month" ? (
        <section className="kpanel flex flex-wrap items-center justify-between gap-2 rounded-2xl p-4">
          <h2 className="flex items-center gap-2 text-[13px] font-medium">
            <FileDown className="size-4 text-brand" />
            {lang === "fr" ? "Bilan du mois" : "Monthly report"}
          </h2>
          <div className="flex gap-2">
            {(["pdf", "csv"] as const).map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => {
                  const input = {
                    lang,
                    currency,
                    year: budget.year,
                    monthIndex: budget.monthIndex,
                    monthNames: MONTH_NAMES[lang],
                    income: budget.periodIncome,
                    targets: budget.targets,
                    actuals: budget.actuals,
                    bucketLabels: { needs: t("needs"), wants: t("wants"), savings: t("savings") },
                    categories: budget.bySecondary.map(([key, value]) => ({
                      label: catLabel(key) ?? t(key as Bucket),
                      bucket: value.bucket,
                      amount: value.amount,
                    })),
                    recurring: budget.recurringRows,
                    transactions: budget.allTransactions,
                    catLabel: (id: string | null) => catLabel(id) ?? undefined,
                  };
                  if (kind === "pdf") void exportMonthlyPdf(input);
                  else exportMonthlyCsv(input);
                }}
                className="rounded-full bg-brand px-3 py-1.5 text-[11px] font-semibold uppercase text-brand-foreground"
              >
                {kind}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold tracking-tight">{t("envelopes")}</h2>
        <span className="knum text-[11px] text-mute">{period}</span>
      </div>

      <div className="space-y-3">
        {(["needs", "wants", "savings"] as Bucket[]).map((bucket) => {
          const Icon = ICONS[bucket];
          const target = budget.targets[bucket];
          const actual = budget.actuals[bucket];
          const pct = target > 0 ? Math.min(100, (actual / target) * 100) : 0;
          const over = actual > target && target > 0;
          return (
            <section key={bucket} className="kpanel rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="grid size-7 place-items-center rounded-lg"
                    style={{
                      background: `color-mix(in oklab, ${BAR_COLORS[bucket]} 16%, transparent)`,
                      color: BAR_COLORS[bucket],
                    }}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="text-[15px] font-medium">{t(bucket)}</span>
                </div>
                <span className="knum text-sm" style={{ color: BAR_COLORS[bucket] }}>
                  {formatMoney(target, currency, lang)}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
                <div
                  className="grow-bar h-full rounded-full"
                  style={{ width: `${pct}%`, background: BAR_COLORS[bucket] }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-mute">
                <span className="knum">
                  {formatMoney(actual, currency, lang)} {t("used")}
                </span>
                <span className="knum">
                  {Math.round(pct)}% ·{" "}
                  {over
                    ? `${formatMoney(actual - target, currency, lang)} ${t("over")}`
                    : `${formatMoney(target - actual, currency, lang)} ${t("left")}`}
                </span>
              </div>
            </section>
          );
        })}
      </div>

          <section className="kpanel-diag rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-[12px] font-medium text-brand">
            <Sparkles className="size-4" />
            {t("insight")}
          </h2>
          <button
            type="button"
            onClick={() => insight.mutate()}
            disabled={insight.isPending}
            className="flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-[11px] font-semibold text-brand-foreground disabled:opacity-60"
          >
            {insight.isPending ? <Loader2 className="size-3 animate-spin" /> : null}
            {insight.isPending ? t("thinking") : t("askInsight")}
          </button>
        </div>
        <p className="mt-3 whitespace-pre-line text-[13px] leading-snug">
          {insight.data?.text ?? (insight.isError ? "—" : t("appTagline"))}
        </p>
          </section>
        </>
      ) : null}

      {activeView === "forecast" ? (
        <section className="kpanel rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-medium">{t("forecastVsActual")}</h2>
          <div className="flex gap-3 text-[10px] text-mute">
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-cool" />
              {t("forecast")}
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-brand" />
              {t("actual")}
            </span>
          </div>
        </div>
        <div className="mt-4 h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid vertical={false} stroke="var(--color-border)" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--mute)", fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(value: number) => formatMoney(value, currency, lang)}
              />
              <Bar dataKey="forecast" fill="var(--cool)" radius={[4, 4, 0, 0]} maxBarSize={26} />
              <Bar dataKey="actual" radius={[4, 4, 0, 0]} maxBarSize={26}>
                {chartData.map((entry) => (
                  <Cell key={entry.bucket} fill={BAR_COLORS[entry.bucket]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 space-y-2 border-t border-border pt-3">
          {budget.bySecondary.slice(0, 5).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between text-[12px]">
              <span className="flex items-center gap-2 text-mute">
                <span
                  className="size-2 rounded-full"
                  style={{ background: BAR_COLORS[value.bucket] }}
                />
                {catLabel(key) ?? key}
              </span>
              <span className="knum">{formatMoney(value.amount, currency, lang)}</span>
            </div>
          ))}
        </div>
        </section>
      ) : null}

      {activeView === "evolution" ? (
        <section className="kpanel rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[14px] font-medium">{t("evolution")}</h2>
          <div className="flex rounded-full border border-border p-0.5 text-[12px]">
            {(["month", "year"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => budget.setEvolutionMode(value)}
                className={
                  budget.evolutionMode === value
                    ? "rounded-full bg-brand px-3 py-1 font-semibold text-brand-foreground"
                    : "rounded-full px-3 py-1 text-mute"
                }
              >
                {value === "month" ? t("byMonth") : t("byYear")}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <select
            aria-label={t("primaryCategory")}
            value={budget.bucketFilter}
            onChange={(event) => {
              budget.setBucketFilter(event.target.value as Bucket | "all");
              budget.setSecondaryFilter("all");
            }}
            className="rounded-xl border border-border bg-transparent px-3 py-2 text-[12px] outline-none"
          >
            <option value="all">{t("all")}</option>
            {BUCKETS.map((bucket) => (
              <option key={bucket} value={bucket}>
                {t(bucket)}
              </option>
            ))}
          </select>
          <select
            aria-label={t("secondaryCategory")}
            value={budget.secondaryFilter}
            onChange={(event) => budget.setSecondaryFilter(event.target.value)}
            className="rounded-xl border border-border bg-transparent px-3 py-2 text-[12px] outline-none"
          >
            <option value="all">{t("all")}</option>
            {(budget.bucketFilter === "all" ? BUCKETS : [budget.bucketFilter]).map((bucket) => (
              <optgroup key={bucket} label={t(bucket)}>
                {byBucket[bucket].map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="mt-4 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={budget.evolution.map((point) => ({
                label:
                  budget.evolutionMode === "month"
                    ? MONTH_NAMES[lang][point.key]!.slice(0, 3)
                    : String(point.key),
                amount: Math.round(point.amount),
              }))}
            >
              <CartesianGrid vertical={false} stroke="var(--color-border)" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                interval={0}
                tick={{ fill: "var(--mute)", fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(value: number) => formatMoney(value, currency, lang)}
              />
              <Bar
                dataKey="amount"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
                fill={budget.bucketFilter === "all" ? "var(--brand)" : BAR_COLORS[budget.bucketFilter]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="knum mt-2 text-right text-[11px] text-mute">
          {formatMoney(
            budget.evolution.reduce((sum, point) => sum + point.amount, 0),
            currency,
            lang,
          )}
        </p>
        </section>
      ) : null}

      {activeView === "transactions" ? (
        <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[14px] font-medium">{t("recent")}</h2>
          <Link to="/journal" className="text-[11px] text-brand">
            {t("seeAll")}
          </Link>
        </div>
        <div className="kpanel divide-y divide-border rounded-2xl">
          {budget.transactions.slice(0, 5).map((row) => (
            <div key={row.id} className="flex items-center gap-3 p-3">
              <span
                className="size-8 shrink-0 rounded-lg"
                style={{
                  background: `color-mix(in oklab, ${BAR_COLORS[row.primary_category]} 18%, transparent)`,
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{row.description || t(row.primary_category)}</p>
                <p className="text-[11px] text-mute">
                  {t(row.primary_category)} ·{" "}
                  {catLabel(row.secondary_category) ?? row.occurred_on}
                </p>
              </div>
              <span className="knum text-[13px]" style={{ color: BAR_COLORS[row.primary_category] }}>
                −{formatMoney(Number(row.amount), currency, lang)}
              </span>
            </div>
          ))}
          {budget.transactions.length === 0 ? (
            <p className="p-4 text-center text-[12px] text-mute">{t("noTransactions")}</p>
          ) : null}
        </div>
        </section>
      ) : null}
    </AppShell>
  );
}
