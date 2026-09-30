import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Apple, Fingerprint, Loader2, ScanFace } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { usePrefs } from "@/lib/prefs";
import { useProfile } from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ClearBudget — Budget 50/30/20 bilingue" },
      {
        name: "description",
        content:
          "ClearBudget répartit automatiquement ton revenu mensuel en Nécessités, Désirs et Épargne, suit tes dépenses et t'alerte en cas de dépassement.",
      },
      { property: "og:title", content: "ClearBudget — Budget 50/30/20 bilingue" },
      {
        property: "og:description",
        content:
          "Configure tes revenus, suis tes dépenses quotidiennes et garde le cap sur la règle 50-30-20, en français ou en anglais.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { session, loading } = useAuth();
  const { languageChosen } = usePrefs();
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    try {
      setUnlocked(window.sessionStorage.getItem("clearbudget.unlocked") === "1");
    } catch {
      setUnlocked(true);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-brand" />
      </div>
    );
  }

  if (!languageChosen && !session) return <LanguageStep />;
  if (session && !unlocked) return <BiometricStep onUnlock={() => setUnlocked(true)} />;
  if (session) return <SessionRedirect />;
  return <AuthStep />;
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-[420px] space-y-5">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-md bg-brand text-brand-foreground">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="size-4">
              <rect x="3" y="6" width="18" height="12" rx="2" />
              <path d="M3 10h18" />
            </svg>
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">ClearBudget</span>
        </div>
        {children}
      </div>
    </div>
  );
}

function LanguageStep() {
  const { setLang, t } = useI18n();
  return (
    <Frame>
      <div className="kpanel-diag rise-in rounded-2xl p-5">
        <p className="text-[11px] uppercase tracking-[0.18em] text-mute">{t("step")} 1</p>
        <h1 className="mt-2 text-xl font-semibold">Langue · Language</h1>
        <p className="mt-1 text-[13px] text-mute">{t("chooseLanguage")}</p>
        <div className="mt-4 grid gap-2">
          <button
            type="button"
            onClick={() => setLang("fr")}
            className="rounded-xl bg-brand px-4 py-3 text-[14px] font-semibold text-brand-foreground"
          >
            Français
          </button>
          <button
            type="button"
            onClick={() => setLang("en")}
            className="rounded-xl border border-border px-4 py-3 text-[14px] font-medium"
          >
            English
          </button>
        </div>
      </div>
    </Frame>
  );
}

function BiometricStep({ onUnlock }: { onUnlock: () => void }) {
  const { t } = useI18n();
  const [checking, setChecking] = useState(false);

  const unlock = (immediate = false) => {
    const finish = () => {
      try {
        window.sessionStorage.setItem("clearbudget.unlocked", "1");
      } catch {
        /* ignore */
      }
      onUnlock();
    };
    if (immediate) return finish();
    setChecking(true);
    window.setTimeout(finish, 900);
  };

  return (
    <Frame>
      <div className="kpanel rise-in rounded-2xl p-6 text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand/15 text-brand">
          {checking ? (
            <Loader2 className="size-7 animate-spin" />
          ) : (
            <ScanFace className="size-8" />
          )}
        </div>
        <h1 className="mt-4 text-lg font-semibold">{t("faceIdTitle")}</h1>
        <p className="mt-1 text-[13px] text-mute">{checking ? t("unlocking") : t("faceIdHint")}</p>
        <button
          type="button"
          disabled={checking}
          onClick={() => unlock()}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3 text-[14px] font-semibold text-brand-foreground disabled:opacity-60"
        >
          <Fingerprint className="size-4" />
          {t("faceIdUnlock")}
        </button>
        <button
          type="button"
          onClick={() => unlock(true)}
          className="mt-2 w-full rounded-2xl border border-border py-2.5 text-[13px] text-mute"
        >
          {t("faceIdSkip")}
        </button>
      </div>
    </Frame>
  );
}

function SessionRedirect() {
  const { session } = useAuth();
  const { data: profile, isLoading } = useProfile(session?.user.id);
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile) return;
    navigate({ to: profile.onboarded ? "/dashboard" : "/onboarding", replace: true });
  }, [profile, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      {isLoading ? <Loader2 className="size-6 animate-spin text-brand" /> : null}
    </div>
  );
}

function AuthStep() {
  const { t } = useI18n();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const social = async (provider: "google" | "apple") => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error.message ?? "OAuth error");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    setBusy(false);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      setBusy(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(t("checkEmail"));
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
  };

  return (
    <Frame>
      <div className="kpanel-diag rise-in rounded-2xl p-5">
        <h1 className="text-xl font-semibold">{mode === "signin" ? t("signIn") : t("signUp")}</h1>
        <p className="mt-1 text-[13px] text-mute">{t("appTagline")}</p>

        <div className="mt-4 grid gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => social("google")}
            className="flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-[14px] font-semibold text-brand-foreground disabled:opacity-60"
          >
            <GoogleMark />
            {t("continueGoogle")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => social("apple")}
            className="flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-[14px] font-medium disabled:opacity-60"
          >
            <Apple className="size-4" />
            {t("continueApple")}
          </button>
        </div>

        <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-mute">
          <span className="h-px flex-1 bg-border" />
          {t("or")}
          <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="grid gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("email")}
            className="rounded-xl border border-border bg-transparent px-3 py-2.5 text-[14px] outline-none focus:border-brand"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("password")}
            className="rounded-xl border border-border bg-transparent px-3 py-2.5 text-[14px] outline-none focus:border-brand"
          />
          <button
            type="submit"
            disabled={busy}
            className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-brand py-3 text-[14px] font-semibold text-brand-foreground disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            {mode === "signin" ? t("signIn") : t("signUp")}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-3 w-full text-[12px] text-mute underline-offset-4 hover:underline"
        >
          {mode === "signin" ? t("noAccount") : t("haveAccount")}
        </button>

        <Link
          to="/regle-50-30-20"
          className="mt-4 block text-center text-[12px] text-mute underline-offset-4 hover:underline"
        >
          Découvrir la règle 50/30/20 →
        </Link>
      </div>
    </Frame>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="currentColor"
        d="M21.35 11.1H12v2.9h5.35c-.25 1.35-1.75 3.95-5.35 3.95A5.95 5.95 0 1 1 15.9 7.6l2.1-2.05A9 9 0 1 0 21.35 11.1Z"
      />
    </svg>
  );
}
