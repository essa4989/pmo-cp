import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDomainStats, getOverallProgress } from "@/lib/analytics";
import { Card, ProgressBar, Badge } from "@/components/ui";

export const metadata = { title: "المسار والمجالات" };

export default async function CoursePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [orientation, orientationProgress, domainStats, overall] = await Promise.all([
    prisma.lesson.findMany({ where: { module: 0 }, orderBy: { order: "asc" } }),
    prisma.userLessonProgress.findMany({
      where: { userId: user.id, lesson: { module: 0 } },
    }),
    getDomainStats(user.id),
    getOverallProgress(user.id),
  ]);

  const orientationCompleted = orientationProgress.filter((p) => p.status === "COMPLETED").length;
  const orientationPct = orientation.length
    ? Math.round((orientationCompleted / orientation.length) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-xl font-bold text-ink">برنامج PMI-PMOCP للتعلّم الذاتي</h1>
      <p className="mt-1 text-sm text-muted">
        منهج منظّم وفق ٦ مجالات رسمية و٢٣ مهمة، مبني على مخطط محتوى الامتحان الرسمي (ECO).
      </p>

      <Card className="mt-5">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MiniStat label="نسبة الإكمال" value={`${overall.lessonProgressPct}%`} />
          <MiniStat label="الدروس" value={`${overall.lessonsCompleted}/${overall.lessonsTotal}`} />
          <MiniStat label="محاكاة مكتملة" value={overall.mockExamsTaken} />
          <MiniStat label="شهادة الإكمال" value={overall.lessonProgressPct === 100 ? "مؤهَّل" : "قيد التقدّم"} />
        </div>
      </Card>

      <div className="relative mt-8 flex flex-col gap-4 ps-6">
        <div className="absolute bottom-4 start-[11px] top-4 w-0.5 bg-line" aria-hidden />

        <RoadmapNode
          index="٠"
          href="/course/0"
          title="التهيئة ومنهجية التعلّم"
          subtitle="Orientation"
          pct={orientationPct}
          lessons={orientation.length}
        />

        {domainStats.map((d) => (
          <RoadmapNode
            key={d.domainId}
            index={String(d.domainId)}
            href={`/course/${d.domainId}`}
            title={d.titleAr}
            subtitle={`Domain ${d.domainId} · ${d.weightPct}% of exam`}
            pct={d.lessonProgressPct}
            lessons={d.lessonsTotal}
            accuracy={d.questionsAnswered > 0 ? d.accuracyPct : undefined}
          />
        ))}

        <RoadmapNode
          index="✓"
          href="/exam"
          title="الاختبار التجريبي الكامل (Mock Exam)"
          subtitle="Integrated Practice & Mock Exams"
          pct={overall.mockExamsTaken > 0 ? 100 : 0}
          lessons={0}
        />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="text-center">
      <div className="ltr-num text-lg font-bold text-brand-700">{value}</div>
      <div className="text-[11px] text-muted">{label}</div>
    </div>
  );
}

function RoadmapNode({
  index,
  href,
  title,
  subtitle,
  pct,
  lessons,
  accuracy,
}: {
  index: string;
  href: string;
  title: string;
  subtitle: string;
  pct: number;
  lessons: number;
  accuracy?: number;
}) {
  const status = pct === 100 ? "مكتمل" : pct > 0 ? "قيد التقدّم" : "لم يبدأ";
  const tone = pct === 100 ? "ok" : pct > 0 ? "warn" : "muted";

  return (
    <Link href={href} className="group relative block">
      <span
        className="ltr-num absolute -start-6 top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-line bg-surface text-[11px] font-bold text-brand-700 group-hover:border-brand-600"
      >
        {index}
      </span>
      <Card className="transition group-hover:border-brand-500">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="font-display text-sm font-bold text-ink">{title}</div>
            <div className="ltr-num text-[11px] text-muted">{subtitle}</div>
          </div>
          <div className="flex items-center gap-2">
            {accuracy !== undefined && <Badge tone="brand">دقّة {accuracy}%</Badge>}
            <Badge tone={tone as "ok" | "warn" | "muted"}>{status}</Badge>
          </div>
        </div>
        {lessons > 0 && (
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
              <span>{lessons} دروس</span>
              <span className="ltr-num">{pct}%</span>
            </div>
            <ProgressBar value={pct} tone={pct === 100 ? "ok" : "brand"} />
          </div>
        )}
      </Card>
    </Link>
  );
}
