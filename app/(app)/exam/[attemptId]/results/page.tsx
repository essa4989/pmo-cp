import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, Badge, ProgressBar } from "@/components/ui";

const MODE_LABEL: Record<string, string> = {
  DOMAIN_QUIZ: "اختبار تدريبي لمجال",
  EXAM_MODE: "وضع اختبار مخصّص",
  MOCK_EXAM: "اختبار تجريبي كامل (Mock Exam)",
};

export default async function ResultsPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      questions: { include: { question: { include: { domain: true } } }, orderBy: { order: "asc" } },
    },
  });
  if (!attempt || attempt.userId !== user.id) notFound();
  if (attempt.status !== "SUBMITTED") notFound();

  // Only questions the learner actually answered count toward breakdown
  // percentages — an unanswered question is neither right nor wrong.
  const answeredQuestions = attempt.questions.filter((aq) => aq.selectedIndex !== null);
  const unansweredCount = attempt.questions.length - answeredQuestions.length;

  const byDomain = new Map<number, { titleAr: string; total: number; correct: number }>();
  for (const aq of answeredQuestions) {
    const d = aq.question.domain;
    const entry = byDomain.get(d.id) ?? { titleAr: d.titleAr, total: 0, correct: 0 };
    entry.total += 1;
    if (aq.correct) entry.correct += 1;
    byDomain.set(d.id, entry);
  }
  const domainRows = [...byDomain.entries()]
    .map(([id, v]) => ({ id, ...v, pct: Math.round((v.correct / v.total) * 100) }))
    .sort((a, b) => a.pct - b.pct);

  const byTask = new Map<string, { titleAr: string; total: number; correct: number }>();
  for (const aq of answeredQuestions) {
    const key = `${aq.question.domainId}.${aq.question.taskNumber}`;
    const entry = byTask.get(key) ?? { titleAr: `مهمة ${aq.question.taskNumber} — مجال ${aq.question.domainId}`, total: 0, correct: 0 };
    entry.total += 1;
    if (aq.correct) entry.correct += 1;
    byTask.set(key, entry);
  }
  const taskRows = [...byTask.entries()]
    .map(([key, v]) => ({ key, ...v, pct: Math.round((v.correct / v.total) * 100) }))
    .sort((a, b) => a.pct - b.pct);

  const missed = attempt.questions.filter((aq) => aq.correct === false);
  const durationTakenSec =
    attempt.submittedAt && attempt.startedAt
      ? Math.round((attempt.submittedAt.getTime() - attempt.startedAt.getTime()) / 1000)
      : null;

  const scoreTone = attempt.scorePct >= 75 ? "ok" : attempt.scorePct >= 60 ? "warn" : "bad";

  return (
    <div className="mx-auto max-w-4xl">
      <div className="ltr-num text-xs font-semibold text-brand-600">{MODE_LABEL[attempt.mode]}</div>
      <h1 className="font-display mt-1 text-xl font-bold text-ink">نتائج الاختبار</h1>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="text-center">
          <div className={`ltr-num text-3xl font-bold ${scoreTone === "ok" ? "text-[var(--ok)]" : scoreTone === "warn" ? "text-[var(--warn)]" : "text-[var(--bad)]"}`}>
            {attempt.scorePct}%
          </div>
          <div className="mt-1 text-xs text-muted">النتيجة</div>
        </Card>
        <Card className="text-center">
          <div className="ltr-num text-3xl font-bold text-brand-700">
            {attempt.correctCount}/{attempt.totalQuestions}
          </div>
          <div className="mt-1 text-xs text-muted">إجابات صحيحة</div>
        </Card>
        <Card className="text-center">
          <div className="ltr-num text-3xl font-bold text-brand-700">
            {durationTakenSec !== null ? `${Math.floor(durationTakenSec / 60)}m` : "—"}
          </div>
          <div className="mt-1 text-xs text-muted">الزمن المستغرَق</div>
        </Card>
        <Card className="text-center">
          <div className="ltr-num text-3xl font-bold text-brand-700">{missed.length}</div>
          <div className="mt-1 text-xs text-muted">أخطاء</div>
        </Card>
      </div>

      {unansweredCount > 0 && (
        <p className="mt-3 text-xs text-[var(--warn)]">
          تُرِك <span className="ltr-num font-semibold">{unansweredCount}</span> سؤالاً بلا إجابة، ولا
          يُحتسَب ضمن نسب الأداء أدناه.
        </p>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-base font-bold text-ink">الأداء حسب المجال</h2>
          {domainRows.length === 0 && (
            <p className="mt-2 text-sm text-muted">لم تُجَب أي أسئلة في هذه المحاولة.</p>
          )}
          <div className="mt-3 flex flex-col gap-3">
            {domainRows.map((d) => (
              <div key={d.id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink">{d.titleAr}</span>
                  <span className="ltr-num text-xs text-muted">
                    {d.correct}/{d.total} · {d.pct}%
                  </span>
                </div>
                <div className="mt-1">
                  <ProgressBar value={d.pct} tone={d.pct >= 75 ? "ok" : d.pct >= 55 ? "warn" : "bad"} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-base font-bold text-ink">المفاهيم الأضعف</h2>
          <p className="mt-1 text-xs text-muted">أقل المهام أداءً في هذا الاختبار</p>
          <div className="mt-3 flex flex-col gap-2">
            {taskRows.slice(0, 5).map((t) => (
              <div key={t.key} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm">
                <span className="text-ink">{t.titleAr}</span>
                <Badge tone={t.pct >= 75 ? "ok" : t.pct >= 55 ? "warn" : "bad"}>
                  {t.correct}/{t.total}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {domainRows.length > 0 && (
        <Card className="mt-5">
          <h2 className="font-display text-base font-bold text-ink">التوصية بالمراجعة</h2>
          <p className="mt-2 text-sm text-ink">
            راجع أولاً <b>{domainRows[0].titleAr}</b> ({domainRows[0].pct}%)، ثم استخدم بطاقات التعلّم
            وسجلّ الأخطاء لتثبيت المفاهيم الضعيفة قبل المحاولة التالية.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/course/${domainRows[0].id}`} className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white">
              مراجعة المجال
            </Link>
            <Link href="/mistakes" className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink">
              سجلّ الأخطاء
            </Link>
            <Link href="/flashcards" className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink">
              بطاقات التعلّم
            </Link>
          </div>
        </Card>
      )}

      <div className="mt-8 flex items-center justify-between">
        <Link href="/exam" className="text-sm font-semibold text-brand-700 hover:underline">
          ← العودة إلى مركز الاختبارات
        </Link>
        <Link href="/dashboard" className="text-sm font-semibold text-muted hover:text-brand-700">
          لوحة التقدّم
        </Link>
      </div>
    </div>
  );
}
