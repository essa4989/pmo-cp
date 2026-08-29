import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, Badge } from "@/components/ui";

export default async function CaseStudyDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cs = await prisma.caseStudy.findUnique({
    where: { id },
    include: { lesson: { include: { domain: true } } },
  });
  if (!cs) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/case-studies" className="text-xs font-semibold text-brand-700 hover:underline">
        ← معمل الحالات
      </Link>

      <Badge tone="brand" >
        {cs.lesson.domain.titleAr}
      </Badge>
      <h1 className="font-display mt-2 text-xl font-bold text-ink">{cs.titleAr}</h1>

      <Card className="lesson-content mt-5">
        <div dangerouslySetInnerHTML={{ __html: cs.bodyHtml }} />
      </Card>

      <Card className="mt-4">
        <div className="text-xs font-semibold text-brand-700">التحليل النموذجي ومنظور PMI</div>
        <p className="mt-2 text-sm leading-7 text-muted">
          راجع الدرس الكامل لهذه الحالة لفهم المفهوم، لماذا يهمّ، ومنظور PMI الرسمي قبل تكوين قرارك
          الخاص بالسيناريو أعلاه.
        </p>
        <Link href={`/lesson/${cs.lesson.code}`} className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline">
          فتح الدرس الكامل: {cs.lesson.titleAr} ←
        </Link>
      </Card>
    </div>
  );
}
