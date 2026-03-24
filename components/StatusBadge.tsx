"use client";

import { statusMap, type StatusId } from "@/constants/statuses";
import { useI18n } from "@/lib/i18n";

export default function StatusBadge({
  status,
  size = "md",
}: {
  status: StatusId;
  size?: "sm" | "md" | "lg";
}) {
  const lang = useI18n((s) => s.lang);
  const def = statusMap[status];
  if (!def) return null;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]}`}
      style={{ backgroundColor: def.bgColor, color: def.color }}
    >
      <span>{def.icon}</span>
      <span>{lang === "he" ? def.labelHe : def.labelEn}</span>
    </span>
  );
}
