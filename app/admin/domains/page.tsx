import { prisma } from "@/lib/db";
import { Card } from "@/components/ui";
import { updateDomain } from "@/lib/actions/admin";

export const metadata = { title: "إدارة المجالات" };

export default async function AdminDomainsPage() {
  const domains = await prisma.domain.findMany({ orderBy: { order: "asc" }, include: { lessons: true, questions: true } });

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-xl font-bold text-ink">إدارة المجالات</h1>
      <p className="mt-1 text-sm text-muted">تعديل عناوين المجالات وأوزانها في مخطط محتوى الامتحان.</p>

      <div className="mt-5 flex flex-col gap-3">
        {domains.map((d) => (
          <Card key={d.id}>
            <form action={updateDomain.bind(null, d.id)} className="grid gap-3 sm:grid-cols-[1fr_1fr_100px_auto] sm:items-end">
              <label className="flex flex-col gap-1 text-xs text-muted">
                العنوان بالعربية
                <input name="titleAr" defaultValue={d.titleAr} className="rounded-lg border border-line px-3 py-2 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-xs text-muted">
                Title (EN)
                <input name="titleEn" defaultValue={d.titleEn} dir="ltr" className="rounded-lg border border-line px-3 py-2 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-xs text-muted">
                الوزن %
                <input name="weightPct" type="number" defaultValue={d.weightPct} className="ltr-num rounded-lg border border-line px-3 py-2 text-sm" />
              </label>
              <button type="submit" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white">
                حفظ
              </button>
            </form>
            <div className="mt-2 text-xs text-muted">
              {d.lessons.length} درساً · {d.questions.length} سؤالاً
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
