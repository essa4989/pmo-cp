"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import type { FlashcardResult } from "@/lib/enums";
import { updateStreak } from "@/lib/actions/streak";

// Lightweight SM-2 style spaced repetition.
export async function reviewFlashcard(flashcardId: string, result: FlashcardResult) {
  const user = await requireUser();

  const state = await prisma.userFlashcardState.upsert({
    where: { userId_flashcardId: { userId: user.id, flashcardId } },
    update: {},
    create: { userId: user.id, flashcardId },
  });

  let ease = state.easeFactor;
  let interval = state.intervalDays;
  let reps = state.reps;

  if (result === "AGAIN") {
    ease = Math.max(1.3, ease - 0.2);
    interval = 0; // due again today
    reps = 0;
  } else {
    if (result === "HARD") ease = Math.max(1.3, ease - 0.15);
    if (result === "EASY") ease = ease + 0.15;

    if (interval === 0) interval = result === "EASY" ? 4 : result === "GOOD" ? 1 : 1;
    else interval = Math.round(interval * ease);

    reps += 1;
  }

  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + interval);
  if (interval === 0) dueAt.setMinutes(dueAt.getMinutes() + 10);

  await prisma.userFlashcardState.update({
    where: { id: state.id },
    data: { easeFactor: ease, intervalDays: interval, reps, dueAt, lastResult: result },
  });

  await updateStreak(user.id);
  revalidatePath("/flashcards");
}
