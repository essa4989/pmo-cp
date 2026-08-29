import { prisma } from "@/lib/db";
import { Card } from "@/components/ui";
import QuestionForm from "@/components/admin/QuestionForm";
import { createQuestion } from "@/lib/actions/admin";

export default async function NewQuestionPage() {
  const domains = await prisma.domain.findMany({ where: { id: { gt: 0 } }, orderBy: { order: "asc" } });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-xl font-bold text-ink">سؤال جديد</h1>
      <Card className="mt-4">
        <QuestionForm
          domains={domains.map((d) => ({ id: d.id, titleAr: d.titleAr }))}
          action={createQuestion}
          submitLabel="إضافة السؤال"
        />
      </Card>
    </div>
  );
}
