import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Badge, Card } from "@/components/ui";
import MarkStarted from "@/components/MarkStarted";
import QuickCheck from "@/components/QuickCheck";

export default async function LessonPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const lesson = await prisma.lesson.findUnique({
    where: { code },
    include: { domain: true, task: true, caseStudies: true },
  });
  if (!lesson) notFound();

  const [progress, siblingLessons, attemptedQuestionIds] = await Promise.all([
    prisma.userLessonProgress.findUnique({
      where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
    }),
    prisma.lesson.findMany({ orderBy: { order: "asc" }, select: { id: true, code: true, order: true } }),
    prisma.userQuestionAttempt.findMany({
      where: { userId: user.id },
      select: { questionId: true },
    }),
  ]);

  const idx = siblingLessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = idx > 0 ? siblingLessons[idx - 1] : null;
  const nextLesson = idx >= 0 && idx < siblingLessons.length - 1 ? siblingLessons[idx + 1] : null;

  const attemptedIds = new Set(attemptedQuestionIds.map((a) => a.questionId));
  const quickCheckWhere = lesson.task
    ? { domainId: lesson.domainId, taskNumber: lesson.task.order }
    : { domainId: lesson.domainId };
  const candidateQuestions = await prisma.question.findMany({ where: quickCheckWhere, take: 30 });
  const quickCheckQuestion =
    candidateQuestions.find((q) => !attemptedIds.has(q.id)) ?? candidateQuestions[0] ?? null;

  const status = progress?.status ?? "NOT_STARTED";

  return (
    <div className="mx-auto max-w-3xl">
      <MarkStarted lessonId={lesson.id} />

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <Link href={`/course/${lesson.domainId}`} className="font-semibold text-brand-700 hover:underline">
          {lesson.domain.titleAr}
        </Link>
        <span>/</span>
        <span className="ltr-num">{lesson.code}</span>
      </div>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-ink">{lesson.titleAr}</h1>
          <p className="ltr-num text-sm text-muted">{lesson.titleEn}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="muted">
            <span className="ltr-num">{lesson.durationMin} min</span>
          </Badge>
          <Badge tone={status === "COMPLETED" ? "ok" : status === "IN_PROGRESS" ? "warn" : "muted"}>
            {status === "COMPLETED" ? "مكتمل" : status === "IN_PROGRESS" ? "قيد التقدّم" : "لم يبدأ"}
          </Badge>
        </div>
      </div>

      <Card className="mt-4 !bg-brand-100/40">
        <div className="text-xs font-semibold text-brand-700">خلاصة الدرس</div>
        <p className="mt-1 text-sm leading-7 text-ink">{lesson.summaryAr}</p>
        <p className="mt-2 text-xs leading-6 text-muted">{lesson.keyFactsAr}</p>
      </Card>

      <Card className="lesson-content mt-4">
        <div dangerouslySetInnerHTML={{ __html: lesson.contentHtml }} />
      </Card>

      {lesson.caseStudies.length > 0 && (
        <Card className="mt-4">
          <div className="text-xs font-semibold text-brand-700">مرتبط بهذا الدرس</div>
          {lesson.caseStudies.map((cs) => (
            <Link
              key={cs.id}
              href={`/case-studies/${cs.id}`}
              className="mt-1 block text-sm font-semibold text-ink hover:text-brand-700"
            >
              دراسة حالة: {cs.titleAr} ←
            </Link>
          ))}
        </Card>
      )}

      <div className="mt-5">
        {quickCheckQuestion ? (
          <QuickCheck
            lessonId={lesson.id}
            questionId={quickCheckQuestion.id}
            questionText={quickCheckQuestion.questionText}
            options={JSON.parse(quickCheckQuestion.optionsJson)}
            alreadyCompleted={status === "COMPLETED"}
            nextHref={nextLesson ? `/lesson/${nextLesson.code}` : null}
          />
        ) : (
          <div className="rounded-xl border border-line bg-surface-2 p-4 text-sm text-muted">
            لا يتوفّر حالياً سؤال تحقّق سريع مرتبط مباشرة بهذا الدرس.
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
        {prevLesson ? (
          <Link href={`/lesson/${prevLesson.code}`} className="text-sm font-medium text-muted hover:text-brand-700">
            → الدرس السابق
          </Link>
        ) : (
          <span />
        )}
        {nextLesson ? (
          <Link href={`/lesson/${nextLesson.code}`} className="text-sm font-medium text-brand-700 hover:underline">
            الدرس التالي ←
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
