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
  const { familyIds, families, loadFamilies, clear: clearFamily } = useFamilyStore();
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

  const handleLeaveFamily = async (fid: string) => {
    if (!user) return;
    if (!confirm(t("family.leaveConfirm"))) return;
    await leaveFamily(user.uid, fid);
    await refreshProfile();
    const updated = useAuthStore.getState().profile;
    if (updated?.familyIds && updated.familyIds.length > 0) {
      await loadFamilies(updated.familyIds);
    } else {
      clearFamily();
    }
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

          {/* Leave Families */}
          {familyIds.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                {t("family.families")}
              </h3>
              <div className="space-y-2">
                {familyIds.map((fid) => {
                  const fd = families[fid];
                  return (
                    <div key={fid} className="flex items-center justify-between">
                      <span className="text-slate-700 font-medium">
                        {fd?.family.name || fid}
                      </span>
                      <button
                        onClick={() => handleLeaveFamily(fid)}
                        className="text-red-500 text-sm font-semibold"
                      >
                        {t("family.leave")}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
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
