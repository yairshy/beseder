"use client";

import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { updateUser, leaveFamily } from "@/lib/firestore";
import { requestNotificationPermission } from "@/lib/notifications";
import { useAuthStore } from "@/stores/authStore";
import { useFamilyStore } from "@/stores/familyStore";
import { useI18n, type Lang } from "@/lib/i18n";
import { useT } from "@/lib/i18n";
import AppShell from "../AppShell";

export default function SettingsPage() {
  const t = useT();
  const { user, profile, refreshProfile } = useAuthStore();
  const { familyId, clear: clearFamily } = useFamilyStore();
  const { lang, setLang } = useI18n();
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(profile?.displayName || "");

  const handleSaveName = async () => {
    if (!user || !name.trim()) return;
    await updateUser(user.uid, { displayName: name.trim() });
    await refreshProfile();
    setEditingName(false);
  };

  const handleToggleLang = () => {
    const next: Lang = lang === "he" ? "en" : "he";
    setLang(next);
    if (user) updateUser(user.uid, { language: next });
  };

  const handleEnableNotifications = async () => {
    if (!user) return;
    await requestNotificationPermission(user.uid);
  };

  const handleLeaveFamily = async () => {
    if (!user || !familyId) return;
    if (!confirm(t("family.leaveConfirm"))) return;
    await leaveFamily(user.uid, familyId);
    clearFamily();
    await refreshProfile();
  };

  const handleSignOut = async () => {
    clearFamily();
    await signOut(auth);
  };

  return (
    <AppShell>
      <div className="px-4 py-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">
          {t("settings.title")}
        </h1>

        <div className="space-y-4">
          {/* Profile Section */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              {t("settings.profile")}
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-slate-700">{t("settings.name")}</span>
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                  />
                  <button
                    onClick={handleSaveName}
                    className="text-green-600 font-semibold text-sm"
                  >
                    {t("common.save")}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingName(true)}
                  className="text-slate-800 font-medium"
                >
                  {profile?.displayName || "—"}
                </button>
              )}
            </div>
          </div>

          {/* Language Section */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-slate-700">{t("settings.language")}</span>
              <button
                onClick={handleToggleLang}
                className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-sm"
              >
                {lang === "he" ? "English" : "עברית"}
              </button>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              {t("settings.notifications")}
            </h3>
            <button
              onClick={handleEnableNotifications}
              className="text-blue-500 font-medium text-sm"
            >
              {t("settings.notifications")} →
            </button>
          </div>

          {/* Leave Family */}
          {familyId && (
            <button
              onClick={handleLeaveFamily}
              className="w-full py-3 rounded-2xl text-red-500 font-semibold bg-red-50 border border-red-100"
            >
              {t("family.leave")}
            </button>
          )}

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="w-full py-3 rounded-2xl text-slate-500 font-semibold bg-white border border-slate-200"
          >
            {t("settings.signOut")}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
