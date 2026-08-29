import { prisma } from "@/lib/db";
import { getCurriculumReference } from "@/lib/content";
import { Card } from "@/components/ui";

export const metadata = { title: "استراتيجية الامتحان" };

export default async function ExamStrategyPage() {
  const [traps, ref] = await Promise.all([
    prisma.examTrap.findMany({ orderBy: { n: "asc" } }),
    getCurriculumReference(),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-xl font-bold text-ink">استراتيجية الامتحان وفخاخه</h1>
      <p className="mt-1 text-sm text-muted">
        {traps.length} فخّاً شائعاً في منطق أسئلة PMI، مع الفارق بين الخيار الجذّاب والخيار الصحيح.
      </p>

      <div className="mt-5 flex flex-col gap-3">
        {traps.map((t) => (
          <Card key={t.id} className="!p-4">
            <div className="flex items-center gap-2">
              <span className="ltr-num flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                {t.n}
              </span>
              <span className="font-display font-bold text-ink">{t.trap}</span>
            </div>
            <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
              <div className="rounded-lg bg-[var(--bad-bg)] px-3 py-2">
                <div className="text-[11px] font-semibold text-[var(--bad)]">الخيار الجذّاب الخاطئ</div>
                <div className="mt-0.5 text-ink">{t.wrongChoice}</div>
              </div>
              <div className="rounded-lg bg-[var(--ok-bg)] px-3 py-2">
                <div className="text-[11px] font-semibold text-[var(--ok)]">المنطق الصحيح</div>
                <div className="mt-0.5 text-ink">{t.correctLogic}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="font-display text-base font-bold text-ink">استراتيجية يوم الامتحان</h2>
        <Card className="lesson-content mt-3">
          <div dangerouslySetInnerHTML={{ __html: ref.strategy_html }} />
        </Card>
      </div>
    </div>
  );
}
