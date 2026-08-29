import { prisma } from "@/lib/db";
import { StatTile, Card, Badge } from "@/components/ui";

export const metadata = { title: "تحليلات الإدارة" };

export default async function AdminDashboard() {
  const [userCount, studentCount, lessonCount, questionCount, attempts, lessonProgress, examAttempts] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.lesson.count(),
      prisma.question.count(),
      prisma.userQuestionAttempt.findMany({ select: { questionId: true, correct: true } }),
      prisma.userLessonProgress.count({ where: { status: "COMPLETED" } }),
      prisma.examAttempt.findMany({ where: { status: "SUBMITTED" }, select: { scorePct: true, mode: true } }),
    ]);

  const byQuestion = new Map<number, { correct: number; total: number }>();
  for (const a of attempts) {
    const c = byQuestion.get(a.questionId) ?? { correct: 0, total: 0 };
    c.total += 1;
    if (a.correct) c.correct += 1;
    byQuestion.set(a.questionId, c);
  }
  const hardest = [...byQuestion.entries()]
    .filter(([, v]) => v.total >= 2)
    .map(([id, v]) => ({ id, pct: Math.round((v.correct / v.total) * 100), attempts: v.total }))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 8);

  const hardestQuestions = await prisma.question.findMany({
    where: { id: { in: hardest.map((h) => h.id) } },
    include: { domain: true },
  });
  const questionById = new Map(hardestQuestions.map((q) => [q.id, q]));

  const domainAccuracy = new Map<number, { correct: number; total: number }>();
  const allAttemptsWithDomain = await prisma.userQuestionAttempt.findMany({
    select: { correct: true, question: { select: { domainId: true } } },
  });
  for (const a of allAttemptsWithDomain) {
    const c = domainAccuracy.get(a.question.domainId) ?? { correct: 0, total: 0 };
    c.total += 1;
    if (a.correct) c.correct += 1;
    domainAccuracy.set(a.question.domainId, c);
  }
  const domains = await prisma.domain.findMany({ where: { id: { gt: 0 } } });
  const domainRows = domains
    .map((d) => {
      const c = domainAccuracy.get(d.id);
      return { titleAr: d.titleAr, pct: c && c.total ? Math.round((c.correct / c.total) * 100) : null };
    })
    .filter((d) => d.pct !== null)
    .sort((a, b) => (a.pct ?? 0) - (b.pct ?? 0));

  const avgMockScore = examAttempts.filter((e) => e.mode === "MOCK_EXAM").length
    ? Math.round(
        examAttempts.filter((e) => e.mode === "MOCK_EXAM").reduce((s, e) => s + e.scorePct, 0) /
          examAttempts.filter((e) => e.mode === "MOCK_EXAM").length
      )
    : null;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-xl font-bold text-ink">تحليلات المنصّة</h1>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="إجمالي المستخدمين" value={userCount} />
        <StatTile label="الطلاب" value={studentCount} />
        <StatTile label="دروس مكتملة (تراكمي)" value={lessonProgress} hint={`من أصل ${lessonCount} × مستخدمين`} />
        <StatTile label="متوسط نتائج المحاكاة" value={avgMockScore !== null ? `${avgMockScore}%` : "—"} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-base font-bold text-ink">أضعف المجالات (كل المستخدمين)</h2>
          <div className="mt-3 flex flex-col gap-2">
            {domainRows.length === 0 && <p className="text-sm text-muted">لا توجد بيانات كافية بعد.</p>}
            {domainRows.map((d) => (
              <div key={d.titleAr} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm">
                <span className="text-ink">{d.titleAr}</span>
                <Badge tone={(d.pct ?? 0) >= 75 ? "ok" : (d.pct ?? 0) >= 55 ? "warn" : "bad"}>{d.pct}%</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-base font-bold text-ink">أصعب الأسئلة (أقل دقّة)</h2>
          <div className="mt-3 flex flex-col gap-2">
            {hardest.length === 0 && <p className="text-sm text-muted">لا توجد بيانات كافية بعد.</p>}
            {hardest.map((h) => {
              const q = questionById.get(h.id);
              return (
                <div key={h.id} className="rounded-lg bg-surface-2 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="ltr-num text-xs text-muted">
                      #{h.id} · Domain {q?.domainId}
                    </span>
                    <Badge tone="bad">{h.pct}%</Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-ink">{q?.questionText}</p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-3 text-xs text-muted sm:grid-cols-2">
        <div>{questionCount} سؤالاً في بنك الأسئلة إجمالاً.</div>
        <div>{attempts.length} محاولة إجابة مسجّلة عبر جميع المستخدمين.</div>
      </div>
    </div>
  );
}
