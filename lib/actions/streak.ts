import { prisma } from "@/lib/db";

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

function isYesterday(a: Date, b: Date) {
  const yesterday = new Date(b);
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(a, yesterday);
}

export async function updateStreak(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const now = new Date();
  if (user.lastStudyDate && isSameDay(user.lastStudyDate, now)) {
    return; // already counted today
  }

  const continued = user.lastStudyDate ? isYesterday(user.lastStudyDate, now) : false;
  const newStreak = continued ? user.currentStreak + 1 : 1;

  await prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, user.longestStreak),
      lastStudyDate: now,
    },
  });
}
