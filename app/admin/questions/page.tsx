import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, Badge } from "@/components/ui";

export const metadata = { title: "إدارة بنك الأسئلة" };

export default async function AdminQuestionsPage() {
  const questions = await prisma.question.findMany({ orderBy: { id: "asc" }, include: { domain: true } });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-ink">إدارة بنك الأسئلة</h1>
        <Link href="/admin/questions/new" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white">
          + سؤال جديد
        </Link>
      </div>
      <p className="mt-1 text-sm text-muted">{questions.length} سؤالاً.</p>

      <div className="mt-5 flex flex-col gap-2">
        {questions.map((q) => (
          <Link key={q.id} href={`/admin/questions/${q.id}`}>
            <Card className="!p-3 transition hover:border-brand-500">
              <div className="flex items-center justify-between gap-3">
                <span className="line-clamp-1 text-sm text-ink">
                  <span className="ltr-num text-xs text-muted">#{q.id}</span> {q.questionText}
                </span>
                <div className="flex shrink-0 gap-1.5">
                  <Badge tone="muted">{q.domain.titleAr}</Badge>
                  <Badge tone="muted">{q.level}</Badge>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
