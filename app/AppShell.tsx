"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useFamilyStore } from "@/stores/familyStore";
import { useI18n } from "@/lib/i18n";
import BottomNav from "@/components/BottomNav";
import OfflineBanner from "@/components/OfflineBanner";
import InstallPrompt from "@/components/InstallPrompt";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, initialized } = useAuthStore();
  const { loadFamily } = useFamilyStore();
  const lang = useI18n((s) => s.lang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
  }, [lang]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (profile?.familyId) {
      loadFamily(profile.familyId);
    }
  }, [profile?.familyId, loadFamily]);

  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isAuthed = !!user && !!profile?.displayName;

  return (
    <>
      <OfflineBanner />
      <main className={`flex-1 ${isAuthed ? "pb-20" : ""}`}>
        {children}
      </main>
      {isAuthed && <BottomNav />}
      {isAuthed && <InstallPrompt />}
    </>
  );
}
