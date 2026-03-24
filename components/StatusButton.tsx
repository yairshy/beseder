"use client";

import { useState, useCallback } from "react";
import { useT } from "@/lib/i18n";

export default function StatusButton({
  onTap,
  onLongPress,
  disabled,
}: {
  onTap: () => void;
  onLongPress: () => void;
  disabled?: boolean;
}) {
  const t = useT();
  const [pressed, setPressed] = useState(false);
  const [sent, setSent] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handlePointerDown = useCallback(() => {
    setPressed(true);
    const timer = setTimeout(() => {
      onLongPress();
      setPressed(false);
    }, 500);
    setLongPressTimer(timer);
  }, [onLongPress]);

  const handlePointerUp = useCallback(() => {
    setPressed(false);
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
      if (!disabled) {
        onTap();
        setSent(true);
        if (navigator.vibrate) navigator.vibrate(50);
        setTimeout(() => setSent(false), 2000);
      }
    }
  }, [longPressTimer, onTap, disabled]);

  const handlePointerLeave = useCallback(() => {
    setPressed(false);
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        disabled={disabled}
        className={`
          relative w-48 h-48 rounded-full
          bg-green-500 hover:bg-green-600 active:bg-green-700
          shadow-[0_8px_30px_rgba(34,197,94,0.4)]
          transition-all duration-150 ease-out
          flex items-center justify-center
          select-none touch-manipulation
          ${pressed ? "scale-90" : "scale-100"}
          ${sent ? "bg-green-600 scale-95" : ""}
          ${disabled ? "opacity-50" : ""}
        `}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        {sent ? (
          <div className="text-center">
            <div className="text-5xl mb-1">✓</div>
            <span className="text-white text-lg font-bold">
              {t("report.sent")}
            </span>
          </div>
        ) : (
          <div className="text-center">
            <span className="text-white text-3xl font-bold leading-tight block">
              {t("home.imOk")}
            </span>
          </div>
        )}
      </button>
      <p className="text-slate-500 text-sm">
        {t("home.tapToReport")}
      </p>
      <button
        onClick={onLongPress}
        className="text-sm text-slate-400 underline underline-offset-2"
      >
        {t("home.moreStatuses")}
      </button>
    </div>
  );
}
