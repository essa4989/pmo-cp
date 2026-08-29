import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendPush, pushConfigured } from "@/lib/push";

// Triggered by an external scheduler (the app itself has no built-in cron).
// Protect with a shared secret so only your scheduler can fire it:
//   GET /api/cron/reminders?secret=$CRON_SECRET
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret") || request.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!pushConfigured()) {
    return NextResponse.json({ error: "push not configured" }, { status: 503 });
  }

  const subs = await prisma.pushSubscription.findMany({ include: { user: true } });
  const now = new Date();
  const byUser = new Map<string, typeof subs>();
  for (const s of subs) {
    const list = byUser.get(s.userId) ?? [];
    list.push(s);
    byUser.set(s.userId, list);
  }

  let usersNotified = 0;
  let pushesSent = 0;
  let pushesFailed = 0;

  for (const [userId, userSubs] of byUser) {
    const dueFlashcards = await prisma.userFlashcardState.count({
      where: { userId, dueAt: { lte: now } },
    });
    const user = userSubs[0].user;
    const studiedToday = user.lastStudyDate
      ? user.lastStudyDate.toDateString() === now.toDateString()
      : false;

    if (studiedToday && dueFlashcards === 0) continue; // nothing worth pinging about

    const body = studiedToday
      ? `أحسنت اليوم! لديك ${dueFlashcards} بطاقة مستحقّة للمراجعة.`
      : dueFlashcards > 0
      ? `لا تفقد سلسلة مذاكرتك — ${dueFlashcards} بطاقة مستحقّة اليوم.`
      : "لا تفقد سلسلة مذاكرتك — خصّص بضع دقائق للمراجعة اليوم.";

    let notifiedThisUser = false;
    for (const s of userSubs) {
      try {
        await sendPush(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          { title: "أكاديمية PMI-PMOCP", body, url: "/flashcards" }
        );
        pushesSent += 1;
        notifiedThisUser = true;
      } catch {
        pushesFailed += 1;
        await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
      }
    }
    if (notifiedThisUser) usersNotified += 1;
  }

  return NextResponse.json({ usersNotified, pushesSent, pushesFailed });
}
