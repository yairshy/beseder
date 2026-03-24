export type StatusId = "ok" | "in-shelter" | "evacuating" | "need-help" | "no-signal";

export interface StatusDef {
  id: StatusId;
  labelEn: string;
  labelHe: string;
  color: string;
  bgColor: string;
  icon: string;
  autoNotify: boolean;
}

export const statuses: StatusDef[] = [
  {
    id: "ok",
    labelEn: "I'm OK",
    labelHe: "\u05D0\u05E0\u05D9 \u05D1\u05E1\u05D3\u05E8",
    color: "#22C55E",
    bgColor: "#DCFCE7",
    icon: "\u2705",
    autoNotify: false,
  },
  {
    id: "in-shelter",
    labelEn: "In Shelter",
    labelHe: "\u05D1\u05DE\u05E7\u05DC\u05D8",
    color: "#3B82F6",
    bgColor: "#DBEAFE",
    icon: "\u{1F6E1}\uFE0F",
    autoNotify: false,
  },
  {
    id: "evacuating",
    labelEn: "Evacuating",
    labelHe: "\u05DE\u05EA\u05E4\u05E0\u05D4",
    color: "#F59E0B",
    bgColor: "#FEF3C7",
    icon: "\u{1F3C3}",
    autoNotify: false,
  },
  {
    id: "need-help",
    labelEn: "Need Help",
    labelHe: "\u05E6\u05E8\u05D9\u05DA \u05E2\u05D6\u05E8\u05D4",
    color: "#EF4444",
    bgColor: "#FEE2E2",
    icon: "\u{1F6A8}",
    autoNotify: true,
  },
  {
    id: "no-signal",
    labelEn: "Low Signal",
    labelHe: "\u05D0\u05D5\u05EA \u05D7\u05DC\u05E9",
    color: "#6B7280",
    bgColor: "#F3F4F6",
    icon: "\u{1F4F6}",
    autoNotify: false,
  },
];

export const statusMap = Object.fromEntries(
  statuses.map((s) => [s.id, s])
) as Record<StatusId, StatusDef>;
