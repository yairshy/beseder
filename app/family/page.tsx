"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useFamilyStore } from "@/stores/familyStore";
import {
  createFamily,
  joinFamily,
  requestCheckIn,
} from "@/lib/firestore";
import { useT } from "@/lib/i18n";
import { notifyFamilyMembers } from "@/lib/notifications";
import FamilyMemberCard from "@/components/FamilyMemberCard";
import AppShell from "../AppShell";

function FamilySwitcher() {
  const { families, familyIds, activeFamilyId, setActiveFamilyId } = useFamilyStore();

  if (familyIds.length <= 1) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4 scrollbar-hide">
      {familyIds.map((fid) => {
        const fd = families[fid];
        if (!fd) return null;
        const isActive = fid === activeFamilyId;
        return (
          <button
            key={fid}
            onClick={() => setActiveFamilyId(fid)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              isActive
                ? "bg-green-500 text-white shadow-md"
                : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            {fd.family.name}
          </button>
        );
      })}
    </div>
  );
}

function AddFamilyView({ onDone }: { onDone: () => void }) {
  const t = useT();
  const { user } = useAuthStore();
  const { loadFamilies } = useFamilyStore();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const searchParams = useSearchParams();

  const urlCode = searchParams.get("code") || "";
  const joinParam = searchParams.get("join");
  const savedCode = typeof window !== "undefined" ? localStorage.getItem("pendingInviteCode") || "" : "";
  const initialCode = urlCode || savedCode;

  const [mode, setMode] = useState<"choose" | "create" | "join">(initialCode || joinParam ? "join" : "choose");
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState(initialCode);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialCode && user) {
      localStorage.removeItem("pendingInviteCode");
    }
  }, [initialCode, user]);

  const handleCreate = async () => {
    if (!user || !familyName.trim()) return;
    setLoading(true);
    setError("");
    try {
      await createFamily(user.uid, familyName.trim());
      await refreshProfile();
      const profile = useAuthStore.getState().profile;
      if (profile?.familyIds) await loadFamilies(profile.familyIds);
      onDone();
    } catch {
      setError(t("common.error"));
    }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!user || !inviteCode.trim()) return;
    setLoading(true);
    setError("");
    try {
      const id = await joinFamily(user.uid, inviteCode.trim());
      if (!id) {
        setError("Invalid code");
        setLoading(false);
        return;
      }
      await refreshProfile();
      const profile = useAuthStore.getState().profile;
      if (profile?.familyIds) await loadFamilies(profile.familyIds);
      onDone();
    } catch {
      setError(t("common.error"));
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <div className="text-5xl mb-4">➕👨‍👩‍👧‍👦</div>

      {mode === "choose" && (
        <div className="space-y-4 w-full max-w-sm">
          <button
            onClick={() => setMode("create")}
            className="w-full py-4 rounded-2xl bg-green-500 text-white font-bold text-lg shadow-lg"
          >
            {t("family.createFamily")}
          </button>
          <button
            onClick={() => setMode("join")}
            className="w-full py-4 rounded-2xl bg-white text-slate-800 font-bold text-lg shadow-sm border border-slate-200"
          >
            {t("family.joinFamily")}
          </button>
          <button onClick={onDone} className="w-full text-sm text-slate-400">
            {t("common.cancel")}
          </button>
        </div>
      )}

      {mode === "create" && (
        <div className="space-y-4 w-full max-w-sm">
          <input
            type="text"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            placeholder={t("family.familyName")}
            className="w-full p-4 rounded-2xl bg-white border border-slate-200 text-lg text-center"
          />
          <button
            onClick={handleCreate}
            disabled={loading || !familyName.trim()}
            className="w-full py-4 rounded-2xl bg-green-500 text-white font-bold text-lg shadow-lg disabled:opacity-50"
          >
            {loading ? "..." : t("family.create")}
          </button>
          <button
            onClick={() => setMode("choose")}
            className="w-full text-sm text-slate-400"
          >
            {t("common.cancel")}
          </button>
        </div>
      )}

      {mode === "join" && (
        <div className="space-y-4 w-full max-w-sm">
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder={t("family.enterCode")}
            maxLength={6}
            className="w-full p-4 rounded-2xl bg-white border border-slate-200 text-2xl text-center tracking-[0.3em]"
            dir="ltr"
          />
          <button
            onClick={handleJoin}
            disabled={loading || inviteCode.length < 6}
            className="w-full py-4 rounded-2xl bg-green-500 text-white font-bold text-lg shadow-lg disabled:opacity-50"
          >
            {loading ? "..." : t("family.join")}
          </button>
          <button
            onClick={() => setMode("choose")}
            className="w-full text-sm text-slate-400"
          >
            {t("common.cancel")}
          </button>
        </div>
      )}

      {error && (
        <p className="text-red-500 text-sm text-center mt-4">{error}</p>
      )}
    </div>
  );
}

function FamilyView() {
  const t = useT();
  const { user, profile } = useAuthStore();
  const { families, activeFamilyId } = useFamilyStore();
  const [requestSent, setRequestSent] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [addingFamily, setAddingFamily] = useState(false);

  const familyData = activeFamilyId ? families[activeFamilyId] : null;
  const family = familyData?.family;
  const statuses = familyData?.statuses || {};

  if (addingFamily) {
    return <AddFamilyView onDone={() => setAddingFamily(false)} />;
  }

  if (!family || !activeFamilyId) return null;

  const handleRequestCheckIn = async () => {
    if (!user || !profile) return;
    await requestCheckIn(activeFamilyId, user.uid, profile.displayName);
    // Send push notification to family members
    notifyFamilyMembers(
      [activeFamilyId],
      user.uid,
      "בסדר - בקשת דיווח 🔔",
      `${profile.displayName} מבקש/ת לדעת שאתם בסדר`
    );
    setRequestSent(true);
    if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    setTimeout(() => setRequestSent(false), 3000);
  };

  const handleShare = async () => {
    const shareData = {
      title: "Join my family on Beseder",
      text: `Join my family "${family.name}" on Beseder. Code: ${family.inviteCode}`,
      url: `${window.location.origin}/invite/${family.inviteCode}`,
    };
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(
        `${shareData.text}\n${shareData.url}`
      );
    }
  };

  const statusEntries = Object.entries(statuses);

  return (
    <div className="px-4 py-6">
      <FamilySwitcher />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {family.name}
          </h1>
          <p className="text-sm text-slate-500">
            {family.memberIds.length} {t("family.members")}
          </p>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <button
          onClick={handleRequestCheckIn}
          disabled={requestSent}
          className="flex-1 py-3 rounded-2xl bg-blue-500 text-white font-semibold text-sm shadow-md disabled:opacity-50"
        >
          {requestSent ? t("family.requestSent") : t("family.requestCheckIn")}
        </button>
        <button
          onClick={handleShare}
          className="flex-1 py-3 rounded-2xl bg-white text-slate-800 font-semibold text-sm shadow-sm border border-slate-200"
        >
          {t("family.invite")}
        </button>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setShowCode(!showCode)}
          className="text-sm text-slate-400 underline"
        >
          {showCode ? t("common.done") : t("family.inviteCode")}
        </button>
        <button
          onClick={() => setAddingFamily(true)}
          className="text-sm text-green-600 font-semibold mr-auto"
        >
          + {t("family.addFamily")}
        </button>
      </div>

      {showCode && (
        <div className="mb-6 p-4 bg-white rounded-2xl border border-slate-200 text-center">
          <p className="text-sm text-slate-500 mb-1">{t("family.inviteCode")}</p>
          <p className="text-3xl font-bold tracking-[0.3em] text-slate-800" dir="ltr">
            {family.inviteCode}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {statusEntries.length === 0 ? (
          <p className="text-slate-400 text-center py-8">
            No status reports yet
          </p>
        ) : (
          statusEntries.map(([memberId, status]) => (
            <FamilyMemberCard
              key={memberId}
              memberId={memberId}
              status={status}
              currentUserId={user?.uid || ""}
            />
          ))
        )}
      </div>
    </div>
  );
}

function NoFamilyView() {
  return <AddFamilyView onDone={() => {}} />;
}

function SaveCodeAndLogin() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || "";

  useEffect(() => {
    if (code) {
      localStorage.setItem("pendingInviteCode", code);
    }
  }, [code]);

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const LoginPage = require("../login/page").default;
  return <LoginPage />;
}

export default function FamilyPage() {
  const { user, profile, initialized } = useAuthStore();
  const isAuthed = !!user && !!profile?.displayName;
  const hasFamilies = !!(profile?.familyIds && profile.familyIds.length > 0);

  return (
    <AppShell>
      {!initialized ? null : !isAuthed ? (
        <SaveCodeAndLogin />
      ) : hasFamilies ? (
        <FamilyView />
      ) : (
        <NoFamilyView />
      )}
    </AppShell>
  );
}
