"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { sendPush, pushConfigured } from "@/lib/push";

export type PushSubscriptionJSON = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function subscribeToPush(sub: PushSubscriptionJSON) {
  const user = await requireUser();
  await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    update: { userId: user.id, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    create: { userId: user.id, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
  });
}

export async function unsubscribeFromPush(endpoint: string) {
  const user = await requireUser();
  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: user.id } });
}

export async function isSubscribedToPush(endpoint: string) {
  const user = await requireUser();
  const existing = await prisma.pushSubscription.findFirst({ where: { endpoint, userId: user.id } });
  return Boolean(existing);
}

export async function sendTestReminder() {
  const user = await requireUser();
  if (!pushConfigured()) throw new Error("Push notifications are not configured on the server");

  const subs = await prisma.pushSubscription.findMany({ where: { userId: user.id } });
  let sent = 0;
  for (const s of subs) {
    try {
      await sendPush(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        {
          title: "أكاديمية PMI-PMOCP",
          body: "هذا تذكير تجريبي — تذكيرات المذاكرة اليومية تعمل الآن.",
          url: "/planner",
        }
      );
      sent += 1;
    } catch {
      await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
    }
  }
  return { sent };
}
