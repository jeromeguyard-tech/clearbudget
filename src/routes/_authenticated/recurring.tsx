import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useCategoryLabel } from "@/lib/categories";
import { AppShell } from "@/components/AppShell";
import { BucketPicker, LabelledField, SecondarySelect } from "@/components/CategoryFields";
import { formatMoney, type Bucket } from "@/lib/budget";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { usePrefs } from "@/lib/prefs";
import { useDeleteRecurring, useRecurring, useSaveRecurring } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/recurring")({
  head: () => ({
    meta: [
      { title: "Dépenses récurrentes — ClearBudget" },
      {
        name: "description",
        content:
          "Gère tes charges mensuelles : montant, jour de prélèvement, compte bancaire et catégories.",
      },
      { property: "og:title", content: "Dépenses récurrentes — ClearBudget" },
      {
        property: "og:description",
        content: "Tes charges fixes intégrées automatiquement à la répartition 50/30/20.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RecurringPage,
});

function RecurringPage() {
  const { t, lang } = useI18n();
  const catLabel = useCategoryLabel();
  const { currency } = usePrefs();
  const { session } = useAuth();
  const userId = session?.user.id;
  const { data: rows = [] } = useRecurring(userId);
  const save = useSaveRecurring(userId);
  const remove = useDeleteRecurring(userId);

  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [day, setDay] = useState("1");
  const [account, setAccount] = useState("");
  const [bucket, setBucket] = useState<Bucket>("needs");
  const [secondary, setSecondary] = useState("");

  const total = rows.reduce((sum, row) => sum + Number(row.amount), 0);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await save.mutateAsync({
        label,
        amount: Number(amount) || 0,
        debit_day: Math.max(1, Math.min(31, Number(day) || 1)),
        bank_account: account || null,
        primary_category: bucket,
        secondary_category: secondary || null,
      });
      toast.success(t("saved"));
      setLabel("");
      setAmount("");
      setAccount("");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <AppShell
      title={t("recurring")}
      subtitle={`${t("recurringTotal")} · ${formatMoney(total, currency, lang)}`}
    >
      <form onSubmit={submit} className="kpanel rise-in space-y-3 rounded-2xl p-4">
        <p className="text-[13px] font-medium">{t("addRecurring")}</p>
        <LabelledField label={t("label")}>
          <input
            type="text"
            required
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            className="w-full rounded-xl border border-border bg-transparent px-3 py-2.5 text-[14px] outline-none focus:border-brand"
          />
        </LabelledField>
        <div className="grid grid-cols-2 gap-3">
          <LabelledField label={t("amount")}>
            <input
              type="number"
              required
              min={0}
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="knum w-full rounded-xl border border-border bg-transparent px-3 py-2.5 text-[14px] outline-none focus:border-brand"
            />
          </LabelledField>
          <LabelledField label={t("debitDay")}>
            <input
              type="number"
              min={1}
              max={31}
              value={day}
              onChange={(event) => setDay(event.target.value)}
              className="knum w-full rounded-xl border border-border bg-transparent px-3 py-2.5 text-[14px] outline-none focus:border-brand"
            />
          </LabelledField>
        </div>
        <LabelledField label={t("bankAccount")} hint={t("optional")}>
          <input
            type="text"
            value={account}
            onChange={(event) => setAccount(event.target.value)}
            className="w-full rounded-xl border border-border bg-transparent px-3 py-2.5 text-[14px] outline-none focus:border-brand"
          />
        </LabelledField>
        <LabelledField label={t("primaryCategory")}>
          <BucketPicker
            value={bucket}
            onChange={(next) => {
              setBucket(next);
              setSecondary("");
            }}
          />
        </LabelledField>
        <LabelledField label={t("secondaryCategory")}>
          <SecondarySelect bucket={bucket} value={secondary} onChange={setSecondary} />
        </LabelledField>
        <button
          type="submit"
          disabled={save.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3 text-[14px] font-semibold text-brand-foreground disabled:opacity-60"
        >
          {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          {t("save")}
        </button>
      </form>

      <div className="kpanel divide-y divide-border rounded-2xl">
        {rows.map((row) => (
          <div key={row.id} className="flex items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium">{row.label}</p>
              <p className="text-[11px] text-mute">
                {t(row.primary_category)} · {catLabel(row.secondary_category)} ·{" "}
                {t("debitDay")} {row.debit_day}
                {row.bank_account ? ` · ${row.bank_account}` : ""}
              </p>
            </div>
            <span className="knum text-[13px]">{formatMoney(Number(row.amount), currency, lang)}</span>
            <button
              type="button"
              aria-label={t("delete")}
              onClick={() => remove.mutate(row.id)}
              className="grid size-8 place-items-center rounded-lg border border-border text-mute"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
        {rows.length === 0 ? (
          <p className="p-4 text-center text-[12px] text-mute">{t("noRecurring")}</p>
        ) : null}
      </div>
    </AppShell>
  );
}
