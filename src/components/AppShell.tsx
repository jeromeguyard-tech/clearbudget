import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart3, Plus, Repeat, ScrollText, Settings2, Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { usePrefs } from "@/lib/prefs";

export function AppShell({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string | undefined;
  children: ReactNode;
  action?: ReactNode | undefined;
}) {
  const { t, lang, setLang } = useI18n();
  const { theme, setPrefs } = usePrefs();

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[520px] px-5 pt-6 pb-32">
        <header className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded-md bg-brand text-brand-foreground">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="size-3.5">
                  <rect x="3" y="6" width="18" height="12" rx="2" />
                  <path d="M3 10h18" />
                </svg>
              </span>
              <span className="font-display text-base font-semibold tracking-tight">ClearBudget</span>
            </div>
            <h1 className="mt-2 text-lg font-semibold tracking-tight">{title}</h1>
            {subtitle ? <p className="mt-1 text-[11px] text-mute">{subtitle}</p> : null}
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex rounded-full border border-border p-0.5 text-[11px]">
              {(["fr", "en"] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLang(code)}
                  className={
                    lang === code
                      ? "rounded-full bg-brand px-2 py-1 font-semibold text-brand-foreground uppercase"
                      : "rounded-full px-2 py-1 text-mute uppercase"
                  }
                >
                  {code}
                </button>
              ))}
            </div>
            <button
              type="button"
              aria-label={t("theme")}
              onClick={() => setPrefs({ theme: theme === "dark" ? "light" : "dark" })}
              className="grid size-8 place-items-center rounded-full border border-border text-mute"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          </div>
        </header>

        {action ? <div className="mt-4">{action}</div> : null}
        <main className="mt-5 space-y-4">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}

function BottomNav() {
  const { t } = useI18n();
  const items = [
    { to: "/dashboard", icon: BarChart3, label: t("dashboard") },
    { to: "/recurring", icon: Repeat, label: t("recurring") },
    { to: "/add", icon: Plus, label: t("addExpense") },
    { to: "/journal", icon: ScrollText, label: t("journal") },
    { to: "/settings", icon: Settings2, label: t("settings") },
  ] as const;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30">
      <div className="mx-auto max-w-[520px] px-5 pb-5">
        <div className="kpanel flex items-center justify-between rounded-2xl px-2 py-2 backdrop-blur-xl">
          {items.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              aria-label={label}
              className="flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] text-mute"
              activeProps={{ className: "text-brand" }}
            >
              <Icon className="size-5" />
              <span className="truncate">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

export function useSignOut() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };
}
