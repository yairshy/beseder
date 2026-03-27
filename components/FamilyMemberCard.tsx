"use client";

import { useState, useEffect } from "react";
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
  const [showFullImage, setShowFullImage] = useState(false);
  const [imageError, setImageError] = useState(false);

  const storageKey = status.photoURL ? `story-viewed:${status.photoURL}` : null;
  // Initialize as true (no ring) to match SSR — useEffect corrects it client-side
  const [storyViewed, setStoryViewed] = useState(true);
  useEffect(() => {
    if (!storageKey) return;
    try { setStoryViewed(localStorage.getItem(storageKey) === "1"); } catch {}
  }, [storageKey]);

  function markViewed() {
    setStoryViewed(true);
    if (storageKey) { try { localStorage.setItem(storageKey, "1"); } catch {} }
  }

  return (
    <>
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
        {status.photoURL && !imageError && (
          <button
            onClick={() => { setShowFullImage(true); markViewed(); }}
            className="shrink-0 focus:outline-none"
          >
            <div className={`p-[3px] rounded-full ${!storyViewed ? "story-ring" : ""}`}>
              <div className="rounded-full p-[2px] bg-white">
                <img
                  src={status.photoURL}
                  alt=""
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-full object-cover active:scale-95 transition-transform"
                  onError={() => setImageError(true)}
                />
              </div>
            </div>
          </button>
        )}
      </div>

      {/* Full-screen image overlay */}
      {showFullImage && status.photoURL && !imageError && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setShowFullImage(false)}
        >
          <button
            onClick={() => setShowFullImage(false)}
            className="absolute top-4 right-4 text-white text-3xl font-light z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/40"
          >
            ×
          </button>
          <p className="absolute top-5 left-4 text-white/80 text-sm font-medium">
            {status.userName}
          </p>
          <img
            src={status.photoURL}
            alt=""
            className="max-w-[95vw] max-h-[85vh] rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
            onError={() => { setImageError(true); setShowFullImage(false); }}
          />
        </div>
      )}
    </>
  );
}
