import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDomainStats, getOverallProgress } from "@/lib/analytics";
import { Card, StatTile, ProgressBar } from "@/components/ui";

export const metadata = { title: "تقدّمي" };

export default async function ProgressPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [overall, domainStats, tasks, attempts, mockAttempts] = await Promise.all([
    getOverallProgress(user.id),
    getDomainStats(user.id),
    prisma.task.findMany({ orderBy: [{ domainId: "asc" }, { order: "asc" }] }),
    prisma.userQuestionAttempt.findMany({
      where: { userId: user.id },
      select: { questionId: true, correct: true, question: { select: { domainId: true, taskNumber: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.examAttempt.count({ where: { userId: user.id, mode: "MOCK_EXAM", status: "SUBMITTED" } }),
  ]);

  // Latest attempt per question, grouped by (domain, task)
  const latestByQuestion = new Map<number, boolean>();
  const domainTaskOf = new Map<number, { domainId: number; taskNumber: number }>();
  for (const a of attempts) {
    latestByQuestion.set(a.questionId, a.correct);
    domainTaskOf.set(a.questionId, { domainId: a.question.domainId, taskNumber: a.question.taskNumber });
  }
  const cellStats = new Map<string, { correct: number; total: number }>();
  for (const [qid, correct] of latestByQuestion) {
    const dt = domainTaskOf.get(qid)!;
    const key = `${dt.domainId}.${dt.taskNumber}`;
    const c = cellStats.get(key) ?? { correct: 0, total: 0 };
    c.total += 1;
    if (correct) c.correct += 1;
    cellStats.set(key, c);
  }

  const streakDays = user.currentStreak;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-xl font-bold text-ink">تقدّمي وخريطة المعرفة</h1>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="إكمال الدورة" value={`${overall.lessonProgressPct}%`} />
        <StatTile label="سلسلة المذاكرة" value={streakDays} hint="أيام متتالية" />
        <StatTile label="أسئلة محلولة" value={overall.questionsSolved} />
        <StatTile label="محاكاة مكتملة" value={mockAttempts} />
      </div>

      <div className="mt-6">
        <h2 className="font-display text-base font-bold text-ink">إكمال المجالات</h2>
        <div className="mt-3 flex flex-col gap-3">
          {domainStats.map((d) => (
            <Card key={d.domainId} className="!p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-ink">{d.titleAr}</span>
                <span className="ltr-num text-xs text-muted">
                  {d.lessonsCompleted}/{d.lessonsTotal} دروس · {d.lessonProgressPct}%
                </span>
              </div>
              <div className="mt-1.5">
                <ProgressBar value={d.lessonProgressPct} tone={d.lessonProgressPct === 100 ? "ok" : "brand"} />
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="font-display text-base font-bold text-ink">خريطة المعرفة — Knowledge Heatmap</h2>
        <p className="mt-1 text-xs text-muted">حسب المجال ← المهمة، بناءً على دقّة إجاباتك التراكمية.</p>
        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
          <LegendDot color="var(--ok)" label="قوي (٧٥%+)" />
          <LegendDot color="var(--warn)" label="متوسط (٥٥–٧٤%)" />
          <LegendDot color="var(--bad)" label="ضعيف (<٥٥%)" />
          <LegendDot color="var(--line)" label="لم يُختبر" />
        </div>
        <div className="mt-3 flex flex-col gap-3">
          {domainStats.map((d) => {
            const domainTasks = tasks.filter((t) => t.domainId === d.domainId);
            return (
              <Card key={d.domainId} className="!p-4">
                <div className="mb-2 text-sm font-semibold text-ink">{d.titleAr}</div>
                <div className="flex flex-wrap gap-2">
                  {domainTasks.map((t) => {
                    const cell = cellStats.get(`${t.domainId}.${t.order}`);
                    const pct = cell && cell.total ? Math.round((cell.correct / cell.total) * 100) : null;
                    const color = pct === null ? "var(--line)" : pct >= 75 ? "var(--ok)" : pct >= 55 ? "var(--warn)" : "var(--bad)";
                    return (
                      <div
                        key={t.id}
                        title={`${t.titleAr} — ${pct !== null ? pct + "%" : "لم يُختبر"}`}
                        className="flex h-14 w-20 flex-col items-center justify-center rounded-lg text-[10px] font-semibold text-white"
                        style={{ background: color }}
                      >
                        <span className="ltr-num">{t.code}</span>
                        <span className="ltr-num">{pct !== null ? `${pct}%` : "—"}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-surface-2 px-2 py-1">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
