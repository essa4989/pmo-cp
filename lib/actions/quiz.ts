"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { updateStreak } from "@/lib/actions/streak";
import type { AttemptMode } from "@/lib/enums";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function createAttempt(opts: {
  userId: string;
  mode: AttemptMode;
  domainId?: number | null;
  mockSetNumber?: number | null;
  durationSec?: number | null;
  questionIds: number[];
}) {
  const attempt = await prisma.examAttempt.create({
    data: {
      userId: opts.userId,
      mode: opts.mode,
      domainId: opts.domainId ?? null,
      mockSetNumber: opts.mockSetNumber ?? null,
      durationSec: opts.durationSec ?? null,
      totalQuestions: opts.questionIds.length,
      status: "IN_PROGRESS",
    },
  });
  await prisma.examAttemptQuestion.createMany({
    data: opts.questionIds.map((qid, i) => ({
      attemptId: attempt.id,
      questionId: qid,
      order: i + 1,
    })),
  });
  return attempt;
}

export async function startDomainQuiz(domainId: number) {
  const user = await requireUser();
  const questions = await prisma.question.findMany({ where: { domainId } });
  const picked = shuffle(questions)
    .slice(0, Math.min(10, questions.length))
    .map((q) => q.id);

  if (picked.length === 0) throw new Error("لا توجد أسئلة لهذا المجال بعد");

  const attempt = await createAttempt({
    userId: user.id,
    mode: "DOMAIN_QUIZ",
    domainId,
    durationSec: null,
    questionIds: picked,
  });
  redirect(`/exam/${attempt.id}`);
}

// The verified question bank (180 items, 30 per domain) is split into three
// fixed, non-overlapping 60-question mock exams (10/domain each) so every
// mock draws only from real, curated content rather than inventing new items.
export async function startMockExam(setNumber: 1 | 2 | 3) {
  const user = await requireUser();
  const domains = await prisma.domain.findMany({ where: { id: { gt: 0 } } });
  const questionIds: number[] = [];
  for (const d of domains) {
    const qs = await prisma.question.findMany({ where: { domainId: d.id }, orderBy: { id: "asc" } });
    const chunkSize = Math.ceil(qs.length / 3);
    const chunk = qs.slice((setNumber - 1) * chunkSize, setNumber * chunkSize);
    questionIds.push(...chunk.map((q) => q.id));
  }

  const attempt = await createAttempt({
    userId: user.id,
    mode: "MOCK_EXAM",
    mockSetNumber: setNumber,
    durationSec: Math.round(questionIds.length * 75), // ~1.25 min/question
    questionIds: shuffle(questionIds),
  });
  redirect(`/exam/${attempt.id}`);
}

export async function startExamMode(domainId: number | null, count: number, minutes: number) {
  const user = await requireUser();
  const where = domainId ? { domainId } : {};
  const questions = await prisma.question.findMany({ where });
  const picked = shuffle(questions)
    .slice(0, Math.min(count, questions.length))
    .map((q) => q.id);

  const attempt = await createAttempt({
    userId: user.id,
    mode: "EXAM_MODE",
    domainId,
    durationSec: minutes * 60,
    questionIds: picked,
  });
  redirect(`/exam/${attempt.id}`);
}

export async function answerAttemptQuestion(
  attemptId: string,
  questionId: number,
  selectedIndex: number
) {
  const user = await requireUser();
  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) throw new Error("Question not found");
  const correct = selectedIndex === question.answerIndex;

  const attempt = await prisma.examAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.userId !== user.id) throw new Error("Not found");

  await prisma.examAttemptQuestion.update({
    where: { attemptId_questionId: { attemptId, questionId } },
    data: { selectedIndex, correct },
  });

  await prisma.userQuestionAttempt.create({
    data: {
      userId: user.id,
      questionId,
      selectedIndex,
      correct,
      mode: attempt.mode,
    },
  });

  return { correct, correctIndex: question.answerIndex, rationale: question.rationale };
}

export async function toggleMarkForReview(attemptId: string, questionId: number) {
  const user = await requireUser();
  const attempt = await prisma.examAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.userId !== user.id) throw new Error("Not found");

  const q = await prisma.examAttemptQuestion.findUnique({
    where: { attemptId_questionId: { attemptId, questionId } },
  });
  if (!q) return;
  await prisma.examAttemptQuestion.update({
    where: { attemptId_questionId: { attemptId, questionId } },
    data: { markedForReview: !q.markedForReview },
  });
}

export async function submitAttempt(attemptId: string) {
  const user = await requireUser();
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: { questions: true },
  });
  if (!attempt || attempt.userId !== user.id) throw new Error("Not found");

  const correctCount = attempt.questions.filter((q) => q.correct).length;
  const scorePct = attempt.totalQuestions
    ? Math.round((correctCount / attempt.totalQuestions) * 100)
    : 0;

  await prisma.examAttempt.update({
    where: { id: attemptId },
    data: { status: "SUBMITTED", submittedAt: new Date(), correctCount, scorePct },
  });

  await updateStreak(user.id);
  revalidatePath("/dashboard");
  redirect(`/exam/${attemptId}/results`);
}
