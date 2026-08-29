import { prisma } from "@/lib/db";

export type DomainStat = {
  domainId: number;
  titleAr: string;
  titleEn: string;
  weightPct: number;
  lessonsTotal: number;
  lessonsCompleted: number;
  lessonProgressPct: number;
  questionsTotal: number;
  questionsAnswered: number;
  questionsCorrect: number;
  accuracyPct: number;
};

export async function getDomainStats(userId: string): Promise<DomainStat[]> {
  const domains = await prisma.domain.findMany({
    where: { id: { gt: 0 } },
    orderBy: { order: "asc" },
    include: {
      lessons: { select: { id: true } },
      questions: { select: { id: true } },
    },
  });

  const [lessonProgress, attempts] = await Promise.all([
    prisma.userLessonProgress.findMany({
      where: { userId, status: "COMPLETED" },
      select: { lessonId: true },
    }),
    prisma.userQuestionAttempt.findMany({
      where: { userId },
      select: { questionId: true, correct: true, question: { select: { domainId: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const completedLessonIds = new Set(lessonProgress.map((p) => p.lessonId));

  return domains.map((d) => {
    const lessonsTotal = d.lessons.length;
    const lessonsCompleted = d.lessons.filter((l) => completedLessonIds.has(l.id)).length;

    // De-duplicate by latest attempt per question for accuracy purposes.
    const latestByQuestion = new Map<number, boolean>();
    for (const a of attempts) {
      if (a.question.domainId === d.id) latestByQuestion.set(a.questionId, a.correct);
    }
    const questionsAnswered = latestByQuestion.size;
    const questionsCorrect = [...latestByQuestion.values()].filter(Boolean).length;

    return {
      domainId: d.id,
      titleAr: d.titleAr,
      titleEn: d.titleEn,
      weightPct: d.weightPct,
      lessonsTotal,
      lessonsCompleted,
      lessonProgressPct: lessonsTotal ? Math.round((lessonsCompleted / lessonsTotal) * 100) : 0,
      questionsTotal: d.questions.length,
      questionsAnswered,
      questionsCorrect,
      accuracyPct: questionsAnswered ? Math.round((questionsCorrect / questionsAnswered) * 100) : 0,
    };
  });
}

export type OverallProgress = {
  lessonsTotal: number;
  lessonsCompleted: number;
  lessonProgressPct: number;
  questionsSolved: number;
  averageScorePct: number;
  mockExamsTaken: number;
  readinessPct: number;
};

export async function getOverallProgress(userId: string): Promise<OverallProgress> {
  const [lessonsTotal, lessonsCompleted, attempts, mockAttempts] = await Promise.all([
    prisma.lesson.count(),
    prisma.userLessonProgress.count({ where: { userId, status: "COMPLETED" } }),
    prisma.userQuestionAttempt.findMany({ where: { userId }, select: { correct: true } }),
    prisma.examAttempt.findMany({
      where: { userId, mode: "MOCK_EXAM", status: "SUBMITTED" },
      select: { scorePct: true },
      orderBy: { submittedAt: "desc" },
      take: 5,
    }),
  ]);

  const questionsSolved = attempts.length;
  const averageScorePct = questionsSolved
    ? Math.round((attempts.filter((a) => a.correct).length / questionsSolved) * 100)
    : 0;

  const domainStats = await getDomainStats(userId);
  const readinessPct = computeReadiness({
    domainStats,
    mockScores: mockAttempts.map((m) => m.scorePct),
    lessonProgressPct: lessonsTotal ? Math.round((lessonsCompleted / lessonsTotal) * 100) : 0,
  });

  return {
    lessonsTotal,
    lessonsCompleted,
    lessonProgressPct: lessonsTotal ? Math.round((lessonsCompleted / lessonsTotal) * 100) : 0,
    questionsSolved,
    averageScorePct,
    mockExamsTaken: mockAttempts.length,
    readinessPct,
  };
}

export function computeReadiness({
  domainStats,
  mockScores,
  lessonProgressPct,
}: {
  domainStats: DomainStat[];
  mockScores: number[];
  lessonProgressPct: number;
}): number {
  const answeredDomains = domainStats.filter((d) => d.questionsAnswered > 0);
  const accuracyComponent = answeredDomains.length
    ? answeredDomains.reduce((sum, d) => sum + d.accuracyPct * (d.weightPct / 100), 0) /
      (answeredDomains.reduce((sum, d) => sum + d.weightPct, 0) / 100)
    : 0;

  const mockComponent = mockScores.length
    ? mockScores.reduce((a, b) => a + b, 0) / mockScores.length
    : accuracyComponent; // fall back to accuracy if no mock exam taken yet

  const coverageComponent = lessonProgressPct;

  const score = accuracyComponent * 0.45 + mockComponent * 0.35 + coverageComponent * 0.2;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function readinessLabel(pct: number): string {
  if (pct >= 80) return "جاهز تقريباً";
  if (pct >= 60) return "على المسار الصحيح";
  if (pct >= 35) return "بحاجة لمزيد من التدريب";
  return "في بداية الرحلة";
}
