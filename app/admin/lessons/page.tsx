import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, Badge } from "@/components/ui";

export const metadata = { title: "إدارة الدروس" };

export default async function AdminLessonsPage() {
  const lessons = await prisma.lesson.findMany({ orderBy: { order: "asc" }, include: { domain: true } });

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-xl font-bold text-ink">إدارة الدروس والمحتوى</h1>
      <p className="mt-1 text-sm text-muted">{lessons.length} درساً. اضغط على أي درس لتعديل محتواه.</p>

      <div className="mt-5 flex flex-col gap-2">
        {lessons.map((l) => (
          <Link key={l.id} href={`/admin/lessons/${l.id}`}>
            <Card className="!p-3 transition hover:border-brand-500">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="ltr-num text-xs font-semibold text-brand-600">{l.code}</span>
                  <span className="ms-2 text-sm font-medium text-ink">{l.titleAr}</span>
                </div>
                <Badge tone="muted">{l.domain.titleAr}</Badge>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
