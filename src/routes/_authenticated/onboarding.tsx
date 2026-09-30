import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { allocation, formatMoney, monthlyIncome, totalAnnual } from "@/lib/budget";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { usePrefs } from "@/lib/prefs";
import { useIncome, useSaveIncome, useUpdateProfile } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Configuration du revenu — ClearBudget" },
      {
        name: "description",
        content:
          "Renseigne tes revenus annuels fixes, variables et autres, puis choisis sur combien de mois les répartir.",
      },
      { property: "og:title", content: "Configuration du revenu — ClearBudget" },
      {
        property: "og:description",
        content: "Assistant pas à pas pour établir ton revenu mensuel de base et ta répartition 50/30/20.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const { t, lang } = useI18n();
  const { currency } = usePrefs();
  const { session } = useAuth();
  const userId = session?.user.id;
  const { data: existing } = useIncome(userId);
  const saveIncome = useSaveIncome(userId);
  const updateProfile = useUpdateProfile(userId);
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [view, setView] = useState<"annual" | "monthly">("annual");
  const [fixed, setFixed] = useState("0");
  const [variable, setVariable] = useState("0");
  const [other, setOther] = useState("0");
  const [transportBenefit, setTransportBenefit] = useState("0");
  const [mealVouchers, setMealVouchers] = useState("0");
  const [months, setMonths] = useState("12");

  useEffect(() => {
    if (!existing) return;
    setFixed(String(existing.fixed_annual));
    setVariable(String(existing.variable_annual));
    setOther(String(existing.other_annual));
    setTransportBenefit(String(existing.transport_benefit_annual));
    setMealVouchers(String(existing.meal_vouchers_annual));
    setMonths(String(existing.months));
  }, [existing]);

  const monthCount = Math.max(1, Math.min(24, Number(months) || 12));
  const income = {
    fixed_annual: Number(fixed) || 0,
    variable_annual: Number(variable) || 0,
    other_annual: Number(other) || 0,
    transport_benefit_annual: Number(transportBenefit) || 0,
    meal_vouchers_annual: Number(mealVouchers) || 0,
    months: monthCount,
  };
  const annual = totalAnnual(income);
  const monthly = monthlyIncome(income);
  const split = allocation(monthly);
  const factor = view === "annual" ? 1 : 1 / monthCount;

  const finish = async () => {
    try {
      await saveIncome.mutateAsync(income);
      await updateProfile.mutateAsync({ onboarded: true });
      navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <AppShell title={t("onboardingTitle")} subtitle={`${t("step")} ${step} / 3`}>
      {step === 1 ? (
        <section className="kpanel rise-in space-y-3 rounded-2xl p-4">
          <div className="flex rounded-full border border-border p-0.5 text-[12px]">
            {(["annual", "monthly"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setView(mode)}
                className={
                  view === mode
                    ? "flex-1 rounded-full bg-brand py-1.5 font-semibold text-brand-foreground"
                    : "flex-1 rounded-full py-1.5 text-mute"
                }
              >
                {mode === "annual" ? t("annual") : t("monthly")}
              </button>
            ))}
          </div>
          <Field
            label={t("fixedAnnual")}
            value={fixed}
            onChange={setFixed}
            hint={formatMoney((Number(fixed) || 0) * factor, currency, lang)}
          />
          <Field
            label={t("variableAnnual")}
            value={variable}
            onChange={setVariable}
            hint={formatMoney((Number(variable) || 0) * factor, currency, lang)}
          />
          <Field
            label={t("otherAnnual")}
            value={other}
            onChange={setOther}
            hint={formatMoney((Number(other) || 0) * factor, currency, lang)}
          />
          <div className="border-t border-border pt-3">
            <p className="mb-3 text-[11px] uppercase tracking-[0.14em] text-mute">
              {t("benefitsInKind")}
            </p>
            <div className="space-y-3">
              <Field
                label={t("transportBenefitAnnual")}
                value={transportBenefit}
                onChange={setTransportBenefit}
                hint={formatMoney((Number(transportBenefit) || 0) * factor, currency, lang)}
              />
              <Field
                label={t("mealVouchersAnnual")}
                value={mealVouchers}
                onChange={setMealVouchers}
                hint={formatMoney((Number(mealVouchers) || 0) * factor, currency, lang)}
              />
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3 text-[12px] text-mute">
            <span>{t("totalAnnual")}</span>
            <span className="knum text-[15px] text-foreground">{formatMoney(annual, currency, lang)}</span>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="kpanel rise-in space-y-3 rounded-2xl p-4">
          <p className="text-[13px] font-medium">{t("monthsSpread")}</p>
          <p className="text-[11px] text-mute">{t("monthsHint")}</p>
          <div className="flex flex-wrap gap-2">
            {[10, 12, 13, 14].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMonths(String(value))}
                className={
                  monthCount === value
                    ? "knum rounded-full bg-brand px-3 py-1.5 text-[12px] font-semibold text-brand-foreground"
                    : "knum rounded-full border border-border px-3 py-1.5 text-[12px] text-mute"
                }
              >
                {value}
              </button>
            ))}
          </div>
          <Field label={t("month")} value={months} onChange={setMonths} />
          <div className="kpanel-diag rounded-xl p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-mute">{t("baseMonthly")}</p>
            <p className="knum mt-1 text-[28px] font-bold leading-none">
              {formatMoney(monthly, currency, lang)}
            </p>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="kpanel rise-in space-y-3 rounded-2xl p-4">
          <p className="text-[13px] font-medium">{t("allocation")}</p>
          {(
            [
              ["needs", t("needs"), "50%", split.needs, "bg-needs"],
              ["wants", t("wants"), "30%", split.wants, "bg-wants"],
              ["savings", t("savings"), "20%", split.savings, "bg-savings"],
            ] as const
          ).map(([key, label, share, value, bg]) => (
            <div key={key} className="rounded-xl border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[14px] font-medium">
                  <span className={`size-2.5 rounded-full ${bg}`} />
                  {label}
                </span>
                <span className="knum text-[14px]">{formatMoney(value, currency, lang)}</span>
              </div>
              <p className="knum mt-1 text-[11px] text-mute">{share}</p>
            </div>
          ))}
        </section>
      ) : null}

      <div className="flex gap-2">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="flex items-center justify-center gap-1.5 rounded-2xl border border-border px-4 py-3 text-[14px] text-mute"
          >
            <ArrowLeft className="size-4" />
            {t("back")}
          </button>
        ) : null}
        {step < 3 ? (
          <button
            type="button"
            onClick={() => setStep(step + 1)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-brand py-3 text-[14px] font-semibold text-brand-foreground"
          >
            {t("continue")}
            <ArrowRight className="size-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={finish}
            disabled={saveIncome.isPending || updateProfile.isPending}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-brand py-3 text-[14px] font-semibold text-brand-foreground disabled:opacity-60"
          >
            {saveIncome.isPending || updateProfile.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            {t("finish")}
          </button>
        )}
      </div>
    </AppShell>
  );
}

function Field({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.14em] text-mute">{label}</span>
      <input
        type="number"
        min={0}
        step="0.01"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="knum mt-1 w-full rounded-xl border border-border bg-transparent px-3 py-2.5 text-[16px] outline-none focus:border-brand"
      />
      {hint ? <span className="knum mt-1 block text-[11px] text-mute">{hint}</span> : null}
    </label>
  );
}
