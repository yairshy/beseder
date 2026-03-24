"use client";

import { updateUser } from "./firestore";

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
