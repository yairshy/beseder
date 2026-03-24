"use client";

import type { LatestStatusDoc } from "@/lib/firestore";
import StatusBadge from "./StatusBadge";
import TimeSince from "./TimeSince";

export default function FamilyMemberCard({
  memberId,
  status,
  currentUserId,
}: {
  memberId: string;
  status: LatestStatusDoc;
  currentUserId: string;
}) {
  const isMe = memberId === currentUserId;

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white shrink-0"
        style={{ backgroundColor: isMe ? "#3B82F6" : "#94A3B8" }}
      >
        {status.userPhotoURL ? (
          <img
            src={status.userPhotoURL}
            alt=""
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          status.userName?.charAt(0)?.toUpperCase() || "?"
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800 truncate">
            {status.userName}
          </span>
          {isMe && (
            <span className="text-xs text-slate-400 font-normal">(you)</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <StatusBadge status={status.status} size="sm" />
          <TimeSince timestamp={status.updatedAt} />
        </div>
        {status.message && (
          <p className="text-sm text-slate-600 mt-1 truncate">
            {status.message}
          </p>
        )}
      </div>
      {status.photoURL && (
        <img
          src={status.photoURL}
          alt=""
          className="h-14 w-14 rounded-xl object-cover shrink-0"
        />
      )}
    </div>
  );
}
