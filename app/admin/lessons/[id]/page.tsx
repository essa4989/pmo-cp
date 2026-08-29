import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui";
import { updateLesson } from "@/lib/actions/admin";

export default async function EditLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lesson = await prisma.lesson.findUnique({ where: { id } });
  if (!lesson) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="ltr-num text-xs font-semibold text-brand-600">{lesson.code}</div>
      <h1 className="font-display text-xl font-bold text-ink">تعديل الدرس</h1>

      <Card className="mt-4">
        <form action={updateLesson.bind(null, lesson.id)} className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs text-muted">
              العنوان بالعربية
              <input name="titleAr" defaultValue={lesson.titleAr} className="rounded-lg border border-line px-3 py-2 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted">
              Title (EN)
              <input name="titleEn" defaultValue={lesson.titleEn} dir="ltr" className="rounded-lg border border-line px-3 py-2 text-sm" />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-xs text-muted">
            الخلاصة
            <textarea name="summaryAr" defaultValue={lesson.summaryAr} rows={2} className="rounded-lg border border-line px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            حقائق سريعة
            <textarea name="keyFactsAr" defaultValue={lesson.keyFactsAr} rows={2} className="rounded-lg border border-line px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            مدّة الدرس (دقيقة)
            <input name="durationMin" type="number" defaultValue={lesson.durationMin} className="ltr-num w-32 rounded-lg border border-line px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            محتوى الدرس (HTML)
            <textarea
              name="contentHtml"
              defaultValue={lesson.contentHtml}
              rows={18}
              dir="rtl"
              className="rounded-lg border border-line px-3 py-2 font-mono text-xs"
            />
          </label>
          <button type="submit" className="self-start rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white">
            حفظ التعديلات
          </button>
        </form>
      </Card>

      <Card className="lesson-content mt-4">
        <div className="mb-2 text-xs font-semibold text-brand-600">معاينة</div>
        <div dangerouslySetInnerHTML={{ __html: lesson.contentHtml }} />
      </Card>
    </div>
  );
}
