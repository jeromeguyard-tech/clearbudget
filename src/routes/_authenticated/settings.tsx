import { createFileRoute, Link } from "@tanstack/react-router";
import { Landmark, LogOut, Settings2, Tags, Wallet } from "lucide-react";

import { CategoryManager } from "@/components/CategoryManager";
import { AppShell, useSignOut } from "@/components/AppShell";
import { formatMoney, monthlyIncome } from "@/lib/budget";
import { useAuth } from "@/lib/auth";
import { useI18n, type Lang } from "@/lib/i18n";
import { usePrefs } from "@/lib/prefs";
import { useIncome } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Réglages — ClearBudget" },
      {
        name: "description",
        content: "Langue, thème clair ou sombre, couleur d'accent, devise et revenus de ton budget.",
      },
      { property: "og:title", content: "Réglages — ClearBudget" },
      {
        property: "og:description",
        content: "Personnalise ClearBudget : bilingue, thème, accent et devise.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

const ACCENTS = ["#00d6a4", "#a9c7ff", "#f2a24a", "#ff5d73", "#c084fc", "#35c22f"];
const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "CAD"];

function SettingsPage() {
  const { t, lang, setLang } = useI18n();
  const { theme, fontFamily, accent, currency, setPrefs } = usePrefs();
  const { session } = useAuth();
  const { data: income } = useIncome(session?.user.id);
  const signOut = useSignOut();

  const sectionHeading = "flex items-center gap-3 border-b border-border pb-4";
  const sectionIcon = "grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-brand";
  const settingBlock = "rounded-xl border border-border bg-secondary/40 p-4 transition-colors hover:bg-secondary/60";

  return (
    <AppShell title={t("settings")} subtitle={session?.user.email ?? undefined}>
      <section className="kpanel space-y-5 rounded-2xl p-5 backdrop-blur-xl">
        <div className={sectionHeading}>
          <span className={sectionIcon}><Settings2 className="size-5" /></span>
          <h2 className="text-lg font-semibold">{t("general")}</h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className={settingBlock}>
            <p className="mb-3 text-[11px] font-semibold uppercase text-mute">{t("language")}</p>
            <div className="flex gap-2">
              {([ ["fr", "Français"], ["en", "English"] ] as [Lang, string][]).map(([code, label]) => (
                <button key={code} type="button" onClick={() => setLang(code)} className={lang === code ? "flex-1 rounded-lg bg-brand py-2 text-[13px] font-semibold text-brand-foreground" : "flex-1 rounded-lg border border-border py-2 text-[13px] text-mute"}>{label}</button>
              ))}
            </div>
          </div>

          <div className={settingBlock}>
            <p className="mb-3 text-[11px] font-semibold uppercase text-mute">{t("theme")}</p>
            <div className="flex gap-2">
              {([ ["light", t("light")], ["dark", t("dark")] ] as ["light" | "dark", string][]).map(([value, label]) => (
                <button key={value} type="button" onClick={() => setPrefs({ theme: value })} className={theme === value ? "flex-1 rounded-lg bg-brand py-2 text-[13px] font-semibold text-brand-foreground" : "flex-1 rounded-lg border border-border py-2 text-[13px] text-mute"}>{label}</button>
              ))}
            </div>
          </div>

          <div className={`${settingBlock} sm:col-span-2`}>
            <p className="mb-3 text-[11px] font-semibold uppercase text-mute">{t("font")}</p>
            <div className="grid grid-cols-3 gap-2">
              {([ ["modern", t("fontModern"), '"Aptos", "Calibri", "Carlito", sans-serif'], ["classic", t("fontClassic"), '"Source Sans 3", "Segoe UI", sans-serif'], ["rounded", t("fontRounded"), '"Nunito Sans", "Trebuchet MS", sans-serif'] ] as const).map(([value, label, family]) => (
                <button key={value} type="button" onClick={() => setPrefs({ fontFamily: value })} className={fontFamily === value ? "min-h-16 rounded-lg border border-brand bg-background/60 px-2 py-2 text-[13px] font-semibold text-foreground" : "min-h-16 rounded-lg border border-border px-2 py-2 text-[13px] text-mute"} style={{ fontFamily: family }}>
                  <span className="block text-lg leading-none">Aa</span><span className="mt-1 block">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={`${settingBlock} sm:col-span-2`}>
            <p className="mb-3 text-[11px] font-semibold uppercase text-mute">{t("accentColor")}</p>
            <div className="flex flex-wrap items-center gap-3">
              {ACCENTS.map((color) => (
                <button key={color} type="button" aria-label={color} onClick={() => setPrefs({ accent: color })} className={accent.toLowerCase() === color ? "size-8 rounded-full ring-2 ring-foreground ring-offset-2 ring-offset-background transition-transform" : "size-8 rounded-full transition-transform hover:scale-110"} style={{ background: color }} />
              ))}
              <input type="color" aria-label={t("accentColor")} value={accent} onChange={(event) => setPrefs({ accent: event.target.value })} className="size-8 rounded-full border border-border bg-transparent" />
            </div>
          </div>
        </div>
      </section>

      <section className="kpanel space-y-5 rounded-2xl p-5 backdrop-blur-xl">
        <div className={sectionHeading}>
          <span className={sectionIcon}><Tags className="size-5" /></span>
          <h2 className="text-lg font-semibold">{t("categories")}</h2>
        </div>
        <CategoryManager />
      </section>

      <section className="kpanel space-y-5 rounded-2xl p-5 backdrop-blur-xl">
        <div className={sectionHeading}>
          <span className={sectionIcon}><Landmark className="size-5" /></span>
          <h2 className="text-lg font-semibold">{t("financials")}</h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className={settingBlock}>
            <p className="mb-3 text-[11px] font-semibold uppercase text-mute">{t("currency")}</p>
            <div className="flex flex-wrap gap-2">
              {CURRENCIES.map((code) => (
                <button key={code} type="button" onClick={() => setPrefs({ currency: code })} className={currency === code ? "knum rounded-full bg-brand px-3 py-1.5 text-[12px] font-semibold text-brand-foreground" : "knum rounded-full border border-border px-3 py-1.5 text-[12px] text-mute"}>{code}</button>
              ))}
            </div>
          </div>

          <div className={settingBlock}>
            <p className="text-[11px] font-semibold uppercase text-mute">{t("income")}</p>
            <p className="knum mt-3 text-[22px] font-bold leading-none">{formatMoney(income ? monthlyIncome(income) : 0, currency, lang)}</p>
            <Link to="/onboarding" className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-border py-2 text-[13px] font-medium transition-colors hover:bg-background/60">
              <Wallet className="size-4" />{t("editIncome")}
            </Link>
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={signOut}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3 text-[13px] text-mute"
      >
        <LogOut className="size-4" />
        {t("signOut")}
      </button>
    </AppShell>
  );
}
