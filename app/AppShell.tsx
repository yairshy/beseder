"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useFamilyStore } from "@/stores/familyStore";
import { useI18n } from "@/lib/i18n";
import { requestNotificationPermission } from "@/lib/notifications";
import BottomNav from "@/components/BottomNav";
import OfflineBanner from "@/components/OfflineBanner";
import InstallPrompt from "@/components/InstallPrompt";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, initialized } = useAuthStore();
  const { loadFamilies } = useFamilyStore();
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
    if (profile?.familyIds && profile.familyIds.length > 0) {
      loadFamilies(profile.familyIds);
    }
  }, [profile?.familyIds?.join(","), loadFamilies]);

  // Auto-request notification permission once user has a family
  useEffect(() => {
    if (user && profile?.familyIds && profile.familyIds.length > 0 && !profile.pushSubscription) {
      // Small delay so the user settles in first
      const timer = setTimeout(() => {
        requestNotificationPermission(user.uid);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user, profile?.familyIds?.length, profile?.pushSubscription]);

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
