"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function submitDiagnostic(answers: { questionId: number; selectedIndex: number }[]) {
  const user = await requireUser();

  const questions = await prisma.question.findMany({
    where: { id: { in: answers.map((a) => a.questionId) } },
  });
  const byId = new Map(questions.map((q) => [q.id, q]));

  const domainScores = new Map<number, { correct: number; total: number }>();
  for (const a of answers) {
    const q = byId.get(a.questionId);
    if (!q) continue;
    const correct = a.selectedIndex === q.answerIndex;
    const entry = domainScores.get(q.domainId) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (correct) entry.correct += 1;
    domainScores.set(q.domainId, entry);

    await prisma.userQuestionAttempt.create({
      data: { userId: user.id, questionId: a.questionId, selectedIndex: a.selectedIndex, correct, mode: "PRACTICE" },
    });
  }

  const domainScoresPct: Record<number, number> = {};
  for (const [domainId, s] of domainScores) {
    domainScoresPct[domainId] = s.total ? Math.round((s.correct / s.total) * 100) : 0;
  }

  const entries = Object.entries(domainScoresPct).map(([k, v]) => [Number(k), v] as [number, number]);
  entries.sort((a, b) => a[1] - b[1]);
  const weakDomains = entries.slice(0, 2).map(([id]) => id);
  const strongDomains = entries.slice(-2).map(([id]) => id);

  await prisma.diagnosticResult.create({
    data: {
      userId: user.id,
      domainScoresJson: JSON.stringify(domainScoresPct),
      weakDomainsJson: JSON.stringify(weakDomains),
      strongDomainsJson: JSON.stringify(strongDomains),
    },
  });

  const domains = await prisma.domain.findMany({ where: { id: { in: [...weakDomains, ...strongDomains] } } });
  const domainNameById = new Map(domains.map((d) => [d.id, d.titleAr]));

  return {
    domainScoresPct,
    weakDomains: weakDomains.map((id) => ({ id, titleAr: domainNameById.get(id) ?? "" })),
    strongDomains: strongDomains.map((id) => ({ id, titleAr: domainNameById.get(id) ?? "" })),
  };
}
