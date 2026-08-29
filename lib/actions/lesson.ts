"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { updateStreak } from "@/lib/actions/streak";

export async function markLessonStarted(lessonId: string) {
  const user = await requireUser();
  const existing = await prisma.userLessonProgress.findUnique({
    where: { userId_lessonId: { userId: user.id, lessonId } },
  });
  // Revisiting a completed lesson should not demote it back to "in progress".
  if (existing?.status === "COMPLETED") return;

  await prisma.userLessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    update: { status: "IN_PROGRESS", startedAt: existing?.startedAt ?? new Date() },
    create: { userId: user.id, lessonId, status: "IN_PROGRESS", startedAt: new Date() },
  });
}

export async function submitQuickCheck(
  lessonId: string,
  questionId: number,
  selectedIndex: number
) {
  const user = await requireUser();
  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) throw new Error("Question not found");

  const correct = selectedIndex === question.answerIndex;

  await prisma.userQuestionAttempt.create({
    data: {
      userId: user.id,
      questionId,
      selectedIndex,
      correct,
      mode: "PRACTICE",
    },
  });

  await prisma.userLessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    update: { status: "COMPLETED", quickCheckPassed: correct, completedAt: new Date() },
    create: {
      userId: user.id,
      lessonId,
      status: "COMPLETED",
      quickCheckPassed: correct,
      startedAt: new Date(),
      completedAt: new Date(),
    },
  });

  await updateStreak(user.id);
  revalidatePath("/dashboard");
  revalidatePath("/course");

  return { correct, correctIndex: question.answerIndex, rationale: question.rationale };
}

export async function markLessonCompleteWithoutQuestion(lessonId: string) {
  const user = await requireUser();
  await prisma.userLessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    update: { status: "COMPLETED", completedAt: new Date() },
    create: {
      userId: user.id,
      lessonId,
      status: "COMPLETED",
      startedAt: new Date(),
      completedAt: new Date(),
    },
  });
  await updateStreak(user.id);
  revalidatePath("/dashboard");
  revalidatePath("/course");
}
