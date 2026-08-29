import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, Badge } from "@/components/ui";

export const metadata = { title: "معمل الحالات" };

export default async function CaseStudiesPage() {
  const caseStudies = await prisma.caseStudy.findMany({
    include: { lesson: { include: { domain: true } } },
    orderBy: { order: "asc" },
  });

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-xl font-bold text-ink">معمل الحالات — PMO Case Lab</h1>
      <p className="mt-1 text-sm text-muted">
        سيناريوهات PMO واقعية مستخرَجة من المنهج المدقَّق، لتطبيق المفاهيم على مواقف قرار حقيقية.
      </p>

      {caseStudies.length === 0 ? (
        <Card className="mt-6 text-sm text-muted">لا توجد حالات موثّقة بعد لهذا الإصدار من المنهج.</Card>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {caseStudies.map((cs) => (
            <Link key={cs.id} href={`/case-studies/${cs.id}`}>
              <Card className="h-full transition hover:border-brand-500">
                <Badge tone="brand">{cs.lesson.domain.titleAr}</Badge>
                <div className="font-display mt-2 text-sm font-bold text-ink">{cs.titleAr}</div>
                <div className="mt-1 text-xs text-muted">مرتبطة بدرس {cs.lesson.code}</div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
