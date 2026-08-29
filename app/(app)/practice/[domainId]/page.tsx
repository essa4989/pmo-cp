import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui";
import { startDomainQuiz } from "@/lib/actions/quiz";

export default async function PracticeStartPage({
  params,
}: {
  params: Promise<{ domainId: string }>;
}) {
  const { domainId: raw } = await params;
  const domainId = Number(raw);
  const domain = await prisma.domain.findUnique({ where: { id: domainId } });
  if (!domain) notFound();

  const questionCount = await prisma.question.count({ where: { domainId } });
  const startWithDomain = startDomainQuiz.bind(null, domainId);

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <div className="ltr-num text-xs font-semibold text-brand-600">DOMAIN {domain.id} PRACTICE</div>
        <h1 className="font-display mt-1 text-lg font-bold text-ink">
          اختبار تدريبي · {domain.titleAr}
        </h1>
        <ul className="mt-4 space-y-2 text-sm text-muted">
          <li>• ١٠ أسئلة عشوائية من أصل {questionCount} سؤالاً في هذا المجال.</li>
          <li>• تغذية راجعة فورية وتفسير كامل بعد كل سؤال.</li>
          <li>• بلا حد زمني — للتدريب والفهم لا للمحاكاة.</li>
        </ul>
        <form action={startWithDomain}>
          <button
            type="submit"
            className="mt-6 w-full rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
          >
            بدء الاختبار التدريبي
          </button>
        </form>
      </Card>
    </div>
  );
}
