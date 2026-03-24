"use client";

import { useState, useEffect } from "react";
import { type Timestamp } from "firebase/firestore";
import { useT } from "@/lib/i18n";

export default function TimeSince({ timestamp }: { timestamp: Timestamp | null }) {
  const t = useT();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  if (!timestamp) return null;

  const ms = now - timestamp.toMillis();
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(ms / 3600000);

  let text: string;
  if (minutes < 1) {
    text = t("status.justNow");
  } else if (minutes < 60) {
    text = t("status.minutesAgo", { count: minutes });
  } else {
    text = t("status.hoursAgo", { count: hours });
  }

  return (
    <span className="text-sm text-slate-500">{text}</span>
  );
}
