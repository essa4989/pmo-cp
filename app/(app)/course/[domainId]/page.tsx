import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, ProgressBar, Badge } from "@/components/ui";
import { getLessonLockState } from "@/lib/progress";

export default async function DomainPage({
  params,
}: {
  params: Promise<{ domainId: string }>;
}) {
  const { domainId: domainIdRaw } = await params;
  const domainId = Number(domainIdRaw);
  const user = await getCurrentUser();
  if (!user) return null;
  if (Number.isNaN(domainId)) notFound();

  const domain = await prisma.domain.findUnique({
    where: { id: domainId },
    include: {
      tasks: { orderBy: { order: "asc" } },
      lessons: { orderBy: { order: "asc" } },
      questions: { select: { id: true } },
    },
  });
  if (!domain) notFound();

  const [progress, { unlockedIds }] = await Promise.all([
    prisma.userLessonProgress.findMany({
      where: { userId: user.id, lessonId: { in: domain.lessons.map((l) => l.id) } },
    }),
    getLessonLockState(user.id),
  ]);
  const progressByLesson = new Map(progress.map((p) => [p.lessonId, p]));

  const completed = domain.lessons.filter((l) => progressByLesson.get(l.id)?.status === "COMPLETED").length;
  const pct = domain.lessons.length ? Math.round((completed / domain.lessons.length) * 100) : 0;

  const attempts = await prisma.userQuestionAttempt.findMany({
    where: { userId: user.id, question: { domainId } },
  });
  const latest = new Map(attempts.map((a) => [a.questionId, a.correct]));
  const accuracy = latest.size ? Math.round(([...latest.values()].filter(Boolean).length / latest.size) * 100) : null;

  const isOrientation = domainId === 0;

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/course" className="text-xs font-semibold text-brand-700 hover:underline">
        ← العودة إلى المسار
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="ltr-num text-xs font-semibold tracking-widest text-brand-600">
            {isOrientation ? "ORIENTATION" : `DOMAIN ${domain.id} · ${domain.weightPct}% OF EXAM`}
          </span>
          <h1 className="font-display mt-1 text-xl font-bold text-ink">{domain.titleAr}</h1>
          <p className="ltr-num text-sm text-muted">{domain.titleEn}</p>
        </div>
        {!isOrientation && (
          <Link
            href={`/practice/${domain.id}`}
            className="rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
          >
            بدء اختبار تدريبي للمجال
          </Link>
        )}
      </div>

      <Card className="mt-5">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="text-center">
            <div className="ltr-num text-lg font-bold text-brand-700">{pct}%</div>
            <div className="text-[11px] text-muted">تقدّم الدروس</div>
          </div>
          <div className="text-center">
            <div className="ltr-num text-lg font-bold text-brand-700">{domain.lessons.length}</div>
            <div className="text-[11px] text-muted">عدد الدروس</div>
          </div>
          {!isOrientation && (
            <>
              <div className="text-center">
                <div className="ltr-num text-lg font-bold text-brand-700">{domain.questions?.length ?? "—"}</div>
                <div className="text-[11px] text-muted">أسئلة المجال</div>
              </div>
              <div className="text-center">
                <div className="ltr-num text-lg font-bold text-brand-700">{accuracy ?? "—"}{accuracy !== null && "%"}</div>
                <div className="text-[11px] text-muted">دقّتك الحالية</div>
              </div>
            </>
          )}
        </div>
        <div className="mt-3">
          <ProgressBar value={pct} tone={pct === 100 ? "ok" : "brand"} />
        </div>
      </Card>

      {!isOrientation && domain.tasks.length > 0 && (
        <div className="mt-6">
          <h2 className="font-display text-base font-bold text-ink">المهام الرسمية</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {domain.tasks.map((t) => (
              <Card key={t.id} className="!p-4">
                <div className="ltr-num text-[11px] font-semibold text-brand-600">{t.code}</div>
                <div className="mt-0.5 text-sm font-semibold text-ink">{t.titleAr}</div>
                <div className="ltr-num mt-0.5 text-xs text-muted">{t.titleEn}</div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <h2 className="font-display text-base font-bold text-ink">الدروس</h2>
        <div className="mt-3 flex flex-col gap-2">
          {domain.lessons.map((l) => {
            const status = progressByLesson.get(l.id)?.status ?? "NOT_STARTED";
            const locked = status === "NOT_STARTED" && !unlockedIds.has(l.id);
            const content = (
              <Card className={`!p-4 transition ${locked ? "opacity-60" : "hover:border-brand-500"}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {locked ? (
                      <span className="text-sm">🔒</span>
                    ) : (
                      <StatusDot status={status} />
                    )}
                    <div>
                      <div className="ltr-num text-[11px] font-semibold text-brand-600">{l.code}</div>
                      <div className="text-sm font-semibold text-ink">{l.titleAr}</div>
                    </div>
                  </div>
                  <Badge tone={locked ? "muted" : status === "COMPLETED" ? "ok" : status === "IN_PROGRESS" ? "warn" : "muted"}>
                    {locked ? "مقفل" : status === "COMPLETED" ? "مكتمل" : status === "IN_PROGRESS" ? "قيد التقدّم" : "لم يبدأ"}
                  </Badge>
                </div>
              </Card>
            );
            return locked ? (
              <div key={l.id}>{content}</div>
            ) : (
              <Link key={l.id} href={`/lesson/${l.code}`}>
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const color = status === "COMPLETED" ? "var(--ok)" : status === "IN_PROGRESS" ? "var(--warn)" : "var(--line)";
  return <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />;
}
