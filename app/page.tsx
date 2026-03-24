"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useFamilyStore } from "@/stores/familyStore";
import { reportStatus, subscribeToPendingCheckIn } from "@/lib/firestore";
import { useT, useI18n } from "@/lib/i18n";
import StatusButton from "@/components/StatusButton";
import FamilyMemberCard from "@/components/FamilyMemberCard";
import { statuses, type StatusId } from "@/constants/statuses";
import AppShell from "./AppShell";
import LoginPage from "./login/page";

function ReportModal({
  open,
  onClose,
  onSend,
}: {
  open: boolean;
  onClose: () => void;
  onSend: (status: StatusId, message: string, photo: File | null) => void;
}) {
  const t = useT();
  const lang = useI18n((s) => s.lang);
  const [selected, setSelected] = useState<StatusId>("ok");
  const [message, setMessage] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  if (!open) return null;

  const handleSend = async () => {
    setSending(true);
    await onSend(selected, message, photo);
    setSending(false);
    setMessage("");
    setPhoto(null);
    setSelected("ok");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-t-3xl p-6 pb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">
            {t("report.selectStatus")}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {statuses.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelected(s.id)}
              className={`flex items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                selected === s.id
                  ? "border-current shadow-md"
                  : "border-transparent bg-slate-50"
              }`}
              style={
                selected === s.id
                  ? { borderColor: s.color, backgroundColor: s.bgColor }
                  : {}
              }
            >
              <span className="text-2xl">{s.icon}</span>
              <span className="font-medium text-sm">
                {lang === "he" ? s.labelHe : s.labelEn}
              </span>
            </button>
          ))}
        </div>

        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t("report.addMessage")}
          className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 mb-4"
        />

        <div className="flex items-center gap-3 mb-6">
          <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer">
            <span className="text-xl">📷</span>
            {t("report.addPhoto")}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => setPhoto(e.target.files?.[0] || null)}
            />
          </label>
          {photo && (
            <span className="text-sm text-green-600 font-medium">
              ✓ {photo.name}
            </span>
          )}
        </div>

        <button
          onClick={handleSend}
          disabled={sending}
          className="w-full py-4 rounded-2xl bg-green-500 text-white font-bold text-lg shadow-lg disabled:opacity-50 transition-all active:scale-[0.98]"
        >
          {sending ? t("report.sending") : t("report.send")}
        </button>
      </div>
    </div>
  );
}

function PendingCheckInBanner({ requestedByName, onReport }: { requestedByName: string; onReport: () => void }) {
  const t = useT();

  useEffect(() => {
    if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[70] bg-red-500 text-white p-4 shadow-xl">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔔</span>
          <div className="flex-1">
            <p className="font-bold text-lg">{t("family.checkInReceived")}</p>
            <p className="text-white/80 text-sm">
              {t("family.checkInRequestedBy", { name: requestedByName })}
            </p>
          </div>
        </div>
        <button
          onClick={onReport}
          className="w-full mt-3 py-3 rounded-xl bg-white text-red-500 font-bold text-lg"
        >
          {t("home.imOk")} ✓
        </button>
      </div>
    </div>
  );
}

function HomePage() {
  const t = useT();
  const { user, profile } = useAuthStore();
  const { familyId, statuses: familyStatuses } = useFamilyStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingCheckIn, setPendingCheckIn] = useState<{ requestedByName: string } | null>(null);

  useEffect(() => {
    if (!familyId || !user) return;
    const unsub = subscribeToPendingCheckIn(familyId, user.uid, (pending) => {
      setPendingCheckIn(pending);
    });
    return () => unsub();
  }, [familyId, user]);

  const handleQuickReport = useCallback(async () => {
    if (!user || !profile || !familyId) return;
    await reportStatus(
      familyId,
      user.uid,
      profile.displayName,
      profile.photoURL,
      "ok",
      null,
      null
    );
    if (navigator.vibrate) navigator.vibrate(50);
  }, [user, profile, familyId]);

  const handleDetailedReport = useCallback(
    async (status: StatusId, message: string, _photo: File | null) => {
      if (!user || !profile || !familyId) return;
      await reportStatus(
        familyId,
        user.uid,
        profile.displayName,
        profile.photoURL,
        status,
        message || null,
        null
      );
      if (navigator.vibrate) navigator.vibrate(50);
    },
    [user, profile, familyId]
  );

  if (!familyId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
        <div className="text-6xl mb-6">👨‍👩‍👧‍👦</div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          {t("home.noFamily")}
        </h2>
        <p className="text-slate-500 mb-8">{t("home.joinOrCreate")}</p>
        <a
          href="/family"
          className="px-8 py-4 bg-green-500 text-white font-bold rounded-2xl shadow-lg"
        >
          {t("family.createFamily")}
        </a>
      </div>
    );
  }

  const statusEntries = Object.entries(familyStatuses);

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)]">
      {pendingCheckIn && (
        <PendingCheckInBanner
          requestedByName={pendingCheckIn.requestedByName}
          onReport={handleQuickReport}
        />
      )}
      <div className={`flex-1 flex items-center justify-center px-6 pt-8 ${pendingCheckIn ? "mt-28" : ""}`}>
        <StatusButton
          onTap={handleQuickReport}
          onLongPress={() => setModalOpen(true)}
        />
      </div>

      <div className="px-4 pb-6">
        <h3 className="text-lg font-bold text-slate-800 mb-3">
          {t("home.familyStatus")}
        </h3>
        {statusEntries.length === 0 ? (
          <p className="text-slate-400 text-center py-8">
            {t("home.noReports")}
          </p>
        ) : (
          <div className="space-y-3">
            {statusEntries.map(([memberId, status]) => (
              <FamilyMemberCard
                key={memberId}
                memberId={memberId}
                status={status}
                currentUserId={user?.uid || ""}
              />
            ))}
          </div>
        )}
      </div>

      <ReportModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSend={handleDetailedReport}
      />
    </div>
  );
}

export default function Page() {
  const { user, profile, initialized } = useAuthStore();
  const isAuthed = !!user && !!profile?.displayName;

  return (
    <AppShell>
      {!initialized ? null : isAuthed ? <HomePage /> : <LoginPage />}
    </AppShell>
  );
}
