"use client";

import { create } from "zustand";
import en from "@/messages/en.json";
import he from "@/messages/he.json";

export type Lang = "en" | "he";

const messages: Record<Lang, typeof en> = { en, he };

interface I18nState {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const useI18n = create<I18nState>((set) => ({
  lang:
    (typeof window !== "undefined" && (localStorage.getItem("lang") as Lang)) ||
    "he",
  setLang: (lang: Lang) => {
    localStorage.setItem("lang", lang);
    set({ lang });
  },
}));

export function t(path: string): string {
  const lang = useI18n.getState().lang;
  const keys = path.split(".");
  let result: unknown = messages[lang];
  for (const key of keys) {
    if (result && typeof result === "object" && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }
  return typeof result === "string" ? result : path;
}

export function useT() {
  const lang = useI18n((s) => s.lang);
  return (path: string, replacements?: Record<string, string | number>) => {
    const keys = path.split(".");
    let result: unknown = messages[lang];
    for (const key of keys) {
      if (result && typeof result === "object" && key in result) {
        result = (result as Record<string, unknown>)[key];
      } else {
        return path;
      }
    }
    let str = typeof result === "string" ? result : path;
    if (replacements) {
      for (const [k, v] of Object.entries(replacements)) {
        str = str.replace(`{${k}}`, String(v));
      }
    }
    return str;
  };
}

export function isRTL(): boolean {
  return useI18n.getState().lang === "he";
}
