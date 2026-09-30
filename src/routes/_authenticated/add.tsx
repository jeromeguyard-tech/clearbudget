import { createFileRoute } from "@tanstack/react-router";
import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { BucketPicker, LabelledField, SecondarySelect } from "@/components/CategoryFields";
import type { Bucket } from "@/lib/budget";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useAddTransaction } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/add")({
  head: () => ({
    meta: [
      { title: "Ajouter une dépense — ClearBudget" },
      {
        name: "description",
        content: "Enregistre une dépense en quelques secondes : montant, description, catégories et commentaire.",
      },
      { property: "og:title", content: "Ajouter une dépense — ClearBudget" },
      {
        property: "og:description",
        content: "Saisie rapide d'une dépense du jour, classée automatiquement dans ton enveloppe 50/30/20.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AddExpense,
});

function today() {
  return new Date().toISOString().slice(0, 10);
}

function AddExpense() {
  const { t } = useI18n();
  const { session } = useAuth();
  const addTransaction = useAddTransaction(session?.user.id);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [bucket, setBucket] = useState<Bucket>("needs");
  const [secondary, setSecondary] = useState("");
  const [comment, setComment] = useState("");
  const [date, setDate] = useState(today());

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await addTransaction.mutateAsync({
        amount: Number(amount) || 0,
        description,
        primary_category: bucket,
        secondary_category: secondary || null,
        comment: comment || null,
        occurred_on: date,
      });
      toast.success(t("saved"));
      setAmount("");
      setDescription("");
      setComment("");
      setDate(today());
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <AppShell title={t("addExpense")} subtitle={t("dailyTracker")}>
      <form onSubmit={submit} className="kpanel rise-in space-y-3 rounded-2xl p-4">
        <LabelledField label={t("amount")}>
          <input
            type="number"
            required
            min={0}
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="knum w-full rounded-xl border border-border bg-transparent px-3 py-3 text-[22px] outline-none focus:border-brand"
          />
        </LabelledField>

        <LabelledField label={t("description")}>
          <input
            type="text"
            required
            value={description}
            onChange={(event) => setDescription(event.target.value)}
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

        <LabelledField label={t("date")}>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="knum w-full rounded-xl border border-border bg-transparent px-3 py-2.5 text-[14px] outline-none focus:border-brand"
          />
        </LabelledField>

        <LabelledField label={t("comment")} hint={t("optional")}>
          <textarea
            rows={2}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            className="w-full rounded-xl border border-border bg-transparent px-3 py-2.5 text-[14px] outline-none focus:border-brand"
          />
        </LabelledField>

        <button
          type="submit"
          disabled={addTransaction.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 text-[15px] font-semibold text-brand-foreground disabled:opacity-60"
        >
          {addTransaction.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
          {t("save")}
        </button>
      </form>
    </AppShell>
  );
}
