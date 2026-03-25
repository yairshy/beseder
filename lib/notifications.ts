"use client";

import { updateUser, getFamilyPushSubscriptions } from "./firestore";

export async function requestNotificationPermission(
  userId: string
): Promise<boolean> {
  if (!("Notification" in window)) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
      });
      await updateUser(userId, {
        pushSubscription: JSON.stringify(subscription),
      });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export function canNotify(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission === "granted"
  );
}

/** Send push notifications to all family members */
export async function notifyFamilyMembers(
  familyIds: string[],
  senderId: string,
  title: string,
  body: string
): Promise<void> {
  try {
    const subscriptions = await getFamilyPushSubscriptions(familyIds, senderId);
    if (subscriptions.length === 0) return;

    // Fire and forget — don't block the UI
    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriptions, title, body, url: "/" }),
    }).catch(() => {}); // Silently ignore errors
  } catch {
    // Don't let notification failures break the app
  }
}
