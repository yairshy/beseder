import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

let vapidConfigured = false;

function ensureVapid() {
  if (vapidConfigured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails("mailto:beseder@beseder.app", publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

interface NotifyRequest {
  subscriptions: string[];
  title: string;
  body: string;
  url?: string;
}

export async function POST(req: NextRequest) {
  try {
    if (!ensureVapid()) {
      return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
    }

    const { subscriptions, title, body, url }: NotifyRequest = await req.json();

    if (!subscriptions?.length || !title || !body) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const payload = JSON.stringify({ title, body, url: url || "/" });

    const results = await Promise.allSettled(
      subscriptions.map((sub) => {
        try {
          const subscription = JSON.parse(sub);
          return webpush.sendNotification(subscription, payload);
        } catch {
          return Promise.reject("invalid subscription");
        }
      })
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({ sent, failed });
  } catch (err) {
    console.error("Notify error:", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
