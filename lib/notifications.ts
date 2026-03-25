"use client";

import { updateUser, getFamilyPushSubscriptions, savePushSubscriptionToFamilies } from "./firestore";

export async function requestNotificationPermission(
  userId: string,
  familyIds?: string[]
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
      const subJson = JSON.stringify(subscription);
      await updateUser(userId, { pushSubscription: subJson });
      // Also save to all families so other members can read it
      if (familyIds && familyIds.length > 0) {
        await savePushSubscriptionToFamilies(userId, familyIds, subJson);
      }
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
    console.log(`[notify] Found ${subscriptions.length} subscriptions for ${familyIds.length} families (excluding ${senderId})`);
    if (subscriptions.length === 0) return;

    const res = await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriptions, title, body, url: "/" }),
    });
    const result = await res.json();
    console.log("[notify] API response:", result);
  } catch (err) {
    console.error("[notify] Error:", err);
  }
}
