"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { updateStreak } from "@/lib/actions/streak";

export async function practiceSingleQuestion(questionId: number, selectedIndex: number) {
  const user = await requireUser();
  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) throw new Error("Question not found");

  const correct = selectedIndex === question.answerIndex;
  await prisma.userQuestionAttempt.create({
    data: { userId: user.id, questionId, selectedIndex, correct, mode: "PRACTICE" },
  });
  await updateStreak(user.id);
  revalidatePath("/questions");
  revalidatePath("/dashboard");

  return { correct, correctIndex: question.answerIndex, rationale: question.rationale };
}

export async function toggleBookmark(questionId: number) {
  const user = await requireUser();
  const existing = await prisma.bookmark.findUnique({
    where: { userId_questionId: { userId: user.id, questionId } },
  });
  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
  } else {
    await prisma.bookmark.create({ data: { userId: user.id, questionId } });
  }
  revalidatePath("/questions");
}
