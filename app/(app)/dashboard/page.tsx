import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDomainStats, getOverallProgress, readinessLabel } from "@/lib/analytics";
import { Card, ProgressBar, StatTile, Badge } from "@/components/ui";

export const metadata = { title: "لوحة التقدّم" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [overall, domainStats, nextLesson, mistakesCount] = await Promise.all([
    getOverallProgress(user.id),
    getDomainStats(user.id),
    findContinueLesson(user.id),
    prisma.userQuestionAttempt.count({ where: { userId: user.id, correct: false } }),
  ]);

  const weakest = [...domainStats]
    .filter((d) => d.questionsAnswered >= 3)
    .sort((a, b) => a.accuracyPct - b.accuracyPct)[0];
  const strongest = [...domainStats]
    .filter((d) => d.questionsAnswered >= 3)
    .sort((a, b) => b.accuracyPct - a.accuracyPct)[0];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-ink">أهلاً بعودتك، {user.name}</h1>
          <p className="mt-1 text-sm text-muted">هذه لمحة سريعة عن تقدّمك وجاهزيتك اليوم.</p>
        </div>
        {user.studyPlan && (
          <Badge tone="brand">
            خطّتك: {user.studyPlan === "DAYS_30" ? "٣٠ يوماً مكثّفة" : user.studyPlan === "DAYS_60" ? "٦٠ يوماً متوازنة" : "٩٠ يوماً عميقة"}
          </Badge>
        )}
      </div>

      {/* Continue learning */}
      <Card className="mt-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="text-xs font-semibold text-brand-600">متابعة التعلّم</div>
          <div className="font-display mt-1 text-base font-bold text-ink">
            {nextLesson ? `${nextLesson.code} · ${nextLesson.titleAr}` : "أكملت كل الدروس المتاحة 🎉"}
          </div>
          {nextLesson && <p className="mt-1 text-sm text-muted">{nextLesson.summaryAr}</p>}
        </div>
        {nextLesson && (
          <Link
            href={`/lesson/${nextLesson.code}`}
            className="shrink-0 rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
          >
            متابعة الدرس
          </Link>
        )}
      </Card>

      {/* Stats grid */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="التقدّم الكلي" value={`${overall.lessonProgressPct}%`} />
        <StatTile label="مؤشر الجاهزية" value={`${overall.readinessPct}%`} hint={readinessLabel(overall.readinessPct)} />
        <StatTile label="سلسلة المذاكرة" value={user.currentStreak} hint="أيام متتالية" />
        <StatTile label="أسئلة محلولة" value={overall.questionsSolved} />
        <StatTile label="متوسط الدرجات" value={`${overall.averageScorePct}%`} />
        <StatTile label="محاكاة مكتملة" value={overall.mockExamsTaken} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {/* Domain roadmap progress */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-ink">تقدّم المجالات</h2>
            <Link href="/course" className="text-xs font-semibold text-brand-700 hover:underline">
              عرض المسار الكامل
            </Link>
          </div>
          <div className="mt-4 flex flex-col gap-4">
            {domainStats.map((d) => (
              <div key={d.domainId}>
                <div className="flex items-center justify-between text-sm">
                  <Link href={`/course/${d.domainId}`} className="font-medium text-ink hover:text-brand-700">
                    المجال {toArabicOrdinal(d.domainId)} · {d.titleAr}
                  </Link>
                  <span className="ltr-num text-xs text-muted">{d.lessonProgressPct}%</span>
                </div>
                <div className="mt-1.5">
                  <ProgressBar value={d.lessonProgressPct} tone={d.lessonProgressPct === 100 ? "ok" : "brand"} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recommended */}
        <div className="flex flex-col gap-5">
          <Card>
            <h2 className="font-display text-base font-bold text-ink">موصى به لك</h2>
            {weakest ? (
              <div className="mt-3">
                <Badge tone="warn">مراجعة مقترحة</Badge>
                <p className="mt-2 text-sm text-ink">
                  دقّتك في <b>{weakest.titleAr}</b> عند <span className="ltr-num">{weakest.accuracyPct}%</span>. راجع
                  دروس هذا المجال ثم حُل اختباراً تدريبياً قصيراً.
                </p>
                <Link
                  href={`/course/${weakest.domainId}`}
                  className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline"
                >
                  مراجعة هذا المجال ←
                </Link>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">
                أجب عن بضعة أسئلة من بنك الأسئلة لتظهر لك توصيات مخصّصة هنا.
              </p>
            )}
            {strongest && strongest.domainId !== weakest?.domainId && (
              <div className="mt-4 border-t border-line pt-3">
                <Badge tone="ok">تحدَّ نفسك</Badge>
                <p className="mt-2 text-sm text-ink">
                  أداؤك ممتاز في <b>{strongest.titleAr}</b>. جرّب أسئلة بمستوى &quot;تحليل&quot; لتثبيت الإتقان.
                </p>
              </div>
            )}
          </Card>

          <Card>
            <h2 className="font-display text-base font-bold text-ink">أخطاء بحاجة لمراجعة</h2>
            <p className="mt-2 text-sm text-muted">
              لديك <span className="ltr-num font-semibold text-ink">{mistakesCount}</span> إجابة خاطئة مسجّلة.
            </p>
            <Link href="/mistakes" className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline">
              افتح سجلّ الأخطاء ←
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}

async function findContinueLesson(userId: string) {
  const lessons = await prisma.lesson.findMany({ orderBy: { order: "asc" } });
  const progress = await prisma.userLessonProgress.findMany({ where: { userId } });
  const progressByLesson = new Map(progress.map((p) => [p.lessonId, p.status]));

  const inProgress = lessons.find((l) => progressByLesson.get(l.id) === "IN_PROGRESS");
  if (inProgress) return inProgress;

  const notStarted = lessons.find((l) => progressByLesson.get(l.id) !== "COMPLETED");
  return notStarted ?? null;
}

function toArabicOrdinal(n: number) {
  const map = ["", "الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس"];
  return map[n] ?? n;
}
