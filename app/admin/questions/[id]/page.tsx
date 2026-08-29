import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui";
import QuestionForm from "@/components/admin/QuestionForm";
import { updateQuestion, deleteQuestion } from "@/lib/actions/admin";

export default async function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const question = await prisma.question.findUnique({ where: { id: Number(id) } });
  if (!question) notFound();
  const domains = await prisma.domain.findMany({ where: { id: { gt: 0 } }, orderBy: { order: "asc" } });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-ink">
          <span className="ltr-num">#{question.id}</span> تعديل السؤال
        </h1>
        <form action={deleteQuestion.bind(null, question.id)}>
          <button type="submit" className="rounded-lg border border-[var(--bad)] px-3 py-1.5 text-xs font-semibold text-[var(--bad)]">
            حذف السؤال
          </button>
        </form>
      </div>
      <Card className="mt-4">
        <QuestionForm
          question={question}
          domains={domains.map((d) => ({ id: d.id, titleAr: d.titleAr }))}
          action={updateQuestion.bind(null, question.id)}
          submitLabel="حفظ التعديلات"
        />
      </Card>
    </div>
  );
}
