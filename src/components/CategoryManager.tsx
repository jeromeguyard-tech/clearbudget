import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { BUCKETS, type Bucket } from "@/lib/budget";
import { useCategoriesByBucket, useCategoryMutations, type Category } from "@/lib/categories";
import { useI18n } from "@/lib/i18n";

const inputClass =
  "min-w-0 flex-1 rounded-xl border border-border bg-transparent px-3 py-2 text-[13px] outline-none focus:border-brand";

function Row({ category }: { category: Category }) {
  const { t } = useI18n();
  const { update, remove } = useCategoryMutations();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await update.mutateAsync({ id: category.id, name: trimmed });
      setEditing(false);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={name}
          maxLength={60}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") save();
            if (event.key === "Escape") setEditing(false);
          }}
          className={inputClass}
        />
        <button type="button" aria-label="OK" onClick={save} className="p-1.5 text-brand">
          <Check className="size-4" />
        </button>
        <button type="button" aria-label="Annuler" onClick={() => setEditing(false)} className="p-1.5 text-mute">
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-muted/40">
      <span className="flex-1 truncate text-[13px]">{category.name}</span>
      <button
        type="button"
        aria-label={`Modifier ${category.name}`}
        onClick={() => {
          setName(category.name);
          setEditing(true);
        }}
        className="p-1.5 text-mute hover:text-foreground"
      >
        <Pencil className="size-3.5" />
      </button>
      <button
        type="button"
        aria-label={`Supprimer ${category.name}`}
        onClick={() => {
          if (window.confirm(t("deleteConfirm"))) {
            remove.mutate(category.id, { onError: (e) => toast.error(e.message) });
          }
        }}
        className="p-1.5 text-mute hover:text-destructive"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

function BucketBlock({ bucket, items }: { bucket: Bucket; items: Category[] }) {
  const { t } = useI18n();
  const { add } = useCategoryMutations();
  const [name, setName] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const position = Math.max(0, ...items.map((c) => c.position)) + 1;
      await add.mutateAsync({ bucket, name: trimmed, position });
      setName("");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <div className="space-y-1">
      <p className="flex items-center gap-2 text-[12px] font-semibold" style={{ color: `var(--${bucket})` }}>
        <span className="size-2 rounded-full" style={{ background: `var(--${bucket})` }} />
        {t(bucket)} <span className="knum font-normal text-mute">({items.length})</span>
      </p>
      {items.map((category) => (
        <Row key={category.id} category={category} />
      ))}
      <form onSubmit={submit} className="flex items-center gap-2 pt-1">
        <input
          value={name}
          maxLength={60}
          onChange={(event) => setName(event.target.value)}
          placeholder={t("newCategory")}
          className={inputClass}
        />
        <button
          type="submit"
          disabled={!name.trim() || add.isPending}
          className="flex items-center gap-1 rounded-xl bg-brand px-3 py-2 text-[12px] font-semibold text-brand-foreground disabled:opacity-50"
        >
          <Plus className="size-3.5" />
          {t("add")}
        </button>
      </form>
    </div>
  );
}

export function CategoryManager() {
  const { t } = useI18n();
  const byBucket = useCategoriesByBucket();
  return (
    <div className="space-y-5">
      <p className="text-[12px] text-mute">{t("manageCategories")}</p>
      {BUCKETS.map((bucket) => (
        <BucketBlock key={bucket} bucket={bucket} items={byBucket[bucket]} />
      ))}
    </div>
  );
}
