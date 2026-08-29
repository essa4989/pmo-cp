import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, Badge } from "@/components/ui";

export const metadata = { title: "أخطائي" };

export default async function MistakesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const attempts = await prisma.userQuestionAttempt.findMany({
    where: { userId: user.id, correct: false },
    include: { question: { include: { domain: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Keep only the most recent wrong attempt per question, and drop any
  // question the learner has since answered correctly.
  const latestCorrectness = new Map<number, boolean>();
  const allAttempts = await prisma.userQuestionAttempt.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { questionId: true, correct: true },
  });
  for (const a of allAttempts) {
    if (!latestCorrectness.has(a.questionId)) latestCorrectness.set(a.questionId, a.correct);
  }

  const seen = new Set<number>();
  const rows = attempts.filter((a) => {
    if (seen.has(a.questionId)) return false;
    seen.add(a.questionId);
    return latestCorrectness.get(a.questionId) === false;
  });

  const relatedLessons = await prisma.lesson.findMany({
    where: { taskId: { not: null } },
    select: { code: true, titleAr: true, taskId: true, task: { select: { domainId: true, order: true } } },
  });

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-xl font-bold text-ink">أخطائي — My Mistakes</h1>
      <p className="mt-1 text-sm text-muted">
        كل سؤال أخطأت فيه يظهر هنا تلقائياً حتى تجيب عنه بشكل صحيح في محاولة لاحقة.
      </p>

      {rows.length === 0 ? (
        <Card className="mt-6 text-center text-sm text-muted">
          لا توجد أخطاء مسجّلة حالياً — استمر في التدريب وستظهر هنا أي إجابة تحتاج مراجعة.
        </Card>
      ) : (
        <div className="mt-5 flex flex-col gap-3">
          {rows.map((a) => {
            const options = JSON.parse(a.question.optionsJson) as string[];
            const lesson = relatedLessons.find(
              (l) => l.task?.domainId === a.question.domainId && l.task?.order === a.question.taskNumber
            );
            return (
              <Card key={a.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="brand">{a.question.domain.titleAr}</Badge>
                  <Badge tone="muted">مهمة {a.question.taskNumber}</Badge>
                  <Badge tone="muted">{a.question.level}</Badge>
                </div>
                <p className="mt-2 text-sm font-medium text-ink">{a.question.questionText}</p>
                <div className="mt-2 grid gap-1 text-sm">
                  <div className="rounded-lg bg-[var(--bad-bg)] px-3 py-1.5">
                    إجابتك: <span className="text-[var(--bad)]">{options[a.selectedIndex]}</span>
                  </div>
                  <div className="rounded-lg bg-[var(--ok-bg)] px-3 py-1.5">
                    الصحيحة: <span className="text-[var(--ok)]">{options[a.question.answerIndex]}</span>
                  </div>
                </div>
                <p className="mt-2 text-sm leading-7 text-muted">{a.question.rationale}</p>
                {lesson && (
                  <Link href={`/lesson/${lesson.code}`} className="mt-2 inline-block text-sm font-semibold text-brand-700 hover:underline">
                    مراجعة الدرس المرتبط: {lesson.titleAr} ←
                  </Link>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
