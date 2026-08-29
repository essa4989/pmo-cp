import { prisma } from "@/lib/db";
import DiagnosticRunner from "@/components/DiagnosticRunner";

export const metadata = { title: "الاختبار التشخيصي" };

export default async function DiagnosticPage() {
  const domains = await prisma.domain.findMany({ where: { id: { gt: 0 } }, orderBy: { order: "asc" } });

  const questions = [];
  for (const d of domains) {
    const qs = await prisma.question.findMany({ where: { domainId: d.id }, orderBy: { id: "asc" }, take: 2 });
    questions.push(...qs);
  }

  const data = questions.map((q) => ({
    id: q.id,
    domainId: q.domainId,
    text: q.questionText,
    options: JSON.parse(q.optionsJson) as string[],
  }));

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-xl font-bold text-ink">قيّم مستواك — Assess Your Level</h1>
      <p className="mt-1 text-sm text-muted">
        {data.length} سؤالاً سريعاً (سؤالان من كل مجال) لتحديد نقاط القوة والفجوات المعرفية قبل رسم
        مسارك المخصّص. لا حدّ زمني.
      </p>
      <DiagnosticRunner questions={data} />
    </div>
  );
}
