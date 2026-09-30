import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import { I18nProvider, type Lang } from "./i18n";
import { useAuth } from "./auth";
import { useProfile, useUpdateProfile } from "./queries";

export type Prefs = {
  lang: Lang;
  theme: "light" | "dark";
  fontFamily: "modern" | "classic" | "rounded";
  accent: string;
  currency: string;
  languageChosen: boolean;
};

type PrefsValue = Prefs & {
  setPrefs: (patch: Partial<Prefs>) => void;
};

const DEFAULTS: Prefs = {
  lang: "fr",
  theme: "dark",
  fontFamily: "modern",
  accent: "#00d6a4",
  currency: "EUR",
  languageChosen: false,
};

const STORAGE_KEY = "clearbudget.prefs";

const PrefsContext = createContext<PrefsValue>({ ...DEFAULTS, setPrefs: () => {} });

export function PrefsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const { data: profile } = useProfile(userId);
  const updateProfile = useUpdateProfile(userId);
  const [local, setLocal] = useState<Prefs>(DEFAULTS);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setLocal((prev) => ({ ...prev, ...(JSON.parse(raw) as Partial<Prefs>) }));
    } catch {
      /* ignore unreadable storage */
    }
  }, []);

  useEffect(() => {
    if (!profile) return;
    setLocal((prev) => ({
      ...prev,
      lang: profile.language,
      theme: profile.theme,
      fontFamily:
        profile.font_family === "classic" || profile.font_family === "rounded"
          ? profile.font_family
          : "modern",
      accent: profile.accent,
      currency: profile.currency,
      languageChosen: true,
    }));
  }, [profile]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", local.theme === "dark");
    root.dataset["font"] = local.fontFamily;
    root.style.setProperty("--brand", local.accent);
    root.lang = local.lang;
  }, [local.theme, local.fontFamily, local.accent, local.lang]);

  const setPrefs = useCallback(
    (patch: Partial<Prefs>) => {
      setLocal((prev) => {
        const next = { ...prev, ...patch };
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* ignore unwritable storage */
        }
        return next;
      });
      if (userId) {
        const remote: Record<string, unknown> = {};
        if (patch.lang) remote["language"] = patch.lang;
        if (patch.theme) remote["theme"] = patch.theme;
        if (patch.fontFamily) remote["font_family"] = patch.fontFamily;
        if (patch.accent) remote["accent"] = patch.accent;
        if (patch.currency) remote["currency"] = patch.currency;
        if (Object.keys(remote).length) updateProfile.mutate(remote);
      }
    },
    [updateProfile, userId],
  );

  const setLang = useCallback(
    (lang: Lang) => setPrefs({ lang, languageChosen: true }),
    [setPrefs],
  );

  return (
    <PrefsContext.Provider value={{ ...local, setPrefs }}>
      <I18nProvider lang={local.lang} setLang={setLang}>
        {children}
      </I18nProvider>
    </PrefsContext.Provider>
  );
}

export function usePrefs() {
  return useContext(PrefsContext);
}
