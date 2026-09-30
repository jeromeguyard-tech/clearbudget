import { BUCKETS, type Bucket } from "@/lib/budget";
import { useCategoriesByBucket } from "@/lib/categories";
import { useI18n } from "@/lib/i18n";

export function BucketPicker({
  value,
  onChange,
}: {
  value: Bucket;
  onChange: (bucket: Bucket) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex gap-2">
      {BUCKETS.map((bucket) => (
        <button
          key={bucket}
          type="button"
          onClick={() => onChange(bucket)}
          className={
            value === bucket
              ? "flex-1 rounded-xl px-3 py-2 text-[12px] font-semibold"
              : "flex-1 rounded-xl border border-border px-3 py-2 text-[12px] text-mute"
          }
          style={
            value === bucket
              ? { background: `var(--${bucket})`, color: "var(--brand-foreground)" }
              : undefined
          }
        >
          {t(bucket)}
        </button>
      ))}
    </div>
  );
}

export function SecondarySelect({
  bucket,
  value,
  onChange,
}: {
  bucket: Bucket;
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useI18n();
  const byBucket = useCategoriesByBucket();
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-xl border border-border bg-transparent px-3 py-2.5 text-[14px] outline-none focus:border-brand"
    >
      <option value="">{t("noSubcategory")}</option>
      {byBucket[bucket].map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </select>
  );
}

export function LabelledField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.14em] text-mute">
        {label}
        {hint ? <span className="ml-1 normal-case tracking-normal">({hint})</span> : null}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
