import { prisma } from "@/lib/db";

export type LessonLockState = {
  unlockedIds: Set<string>;
  completedIds: Set<string>;
};

// The first lesson (lowest `order`) is always unlocked; every other lesson
// unlocks once the lesson immediately before it (in the same global order)
// has been completed — mirrors the reference platform's sequential video
// gating, applied only to lesson content (practice/quiz/exam stay open).
export async function getLessonLockState(userId: string): Promise<LessonLockState> {
  const [lessons, completed] = await Promise.all([
    prisma.lesson.findMany({ orderBy: { order: "asc" }, select: { id: true } }),
    prisma.userLessonProgress.findMany({
      where: { userId, status: "COMPLETED" },
      select: { lessonId: true },
    }),
  ]);

  const completedIds = new Set(completed.map((c) => c.lessonId));
  const unlockedIds = new Set<string>();
  let prevCompleted = true;
  for (const l of lessons) {
    if (prevCompleted) unlockedIds.add(l.id);
    prevCompleted = completedIds.has(l.id);
  }

  return { unlockedIds, completedIds };
}

export async function isLessonUnlocked(userId: string, lessonId: string): Promise<boolean> {
  const { unlockedIds } = await getLessonLockState(userId);
  return unlockedIds.has(lessonId);
}
