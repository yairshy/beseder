"use client";

import { useState, useEffect } from "react";
import { useT } from "@/lib/i18n";

export default function InstallPrompt() {
  const t = useT();
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && (navigator as unknown as { standalone: boolean }).standalone);

    if (isStandalone) return;

    const dismissed = localStorage.getItem("installDismissed");
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // On iOS Safari, there's no beforeinstallprompt — show manual instruction
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    if (isIOS && isSafari) {
      setTimeout(() => setShow(true), 3000);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt && "prompt" in deferredPrompt) {
      (deferredPrompt as { prompt: () => void }).prompt();
    }
    setShow(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("installDismissed", "1");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-white rounded-2xl shadow-lg border border-slate-200 p-4 max-w-lg mx-auto">
      <div className="flex items-start gap-3">
        <div className="text-3xl">📱</div>
        <div className="flex-1">
          <p className="font-semibold text-slate-800">
            {t("common.install")}
          </p>
          <p className="text-sm text-slate-500 mt-0.5">
            {t("common.installDesc")}
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleDismiss}
          className="flex-1 text-sm text-slate-500 py-2 rounded-xl"
        >
          {t("common.cancel")}
        </button>
        <button
          onClick={handleInstall}
          className="flex-1 text-sm font-semibold text-white bg-green-500 py-2 rounded-xl"
        >
          {t("common.install")}
        </button>
      </div>
    </div>
  );
}
