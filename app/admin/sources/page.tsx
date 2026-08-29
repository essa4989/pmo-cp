import { prisma } from "@/lib/db";
import { Card, Badge } from "@/components/ui";
import { SOURCE_TYPES } from "@/lib/enums";
import { createSource, updateSource, deleteSource } from "@/lib/actions/admin";

export const metadata = { title: "إدارة المصادر" };

export default async function AdminSourcesPage() {
  const sources = await prisma.source.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-xl font-bold text-ink">إدارة المصادر</h1>
      <p className="mt-1 text-sm text-muted">
        المصادر المرجعية للمحتوى، مصنَّفة بحسب موثوقيتها. لا تُستخدم علامة <Badge tone="brand">PMI_OFFICIAL</Badge>{" "}
        إلا لمصدر رسمي متحقَّق منه فعلياً.
      </p>

      <div className="mt-5 flex flex-col gap-3">
        {sources.map((s) => (
          <Card key={s.id}>
            <form action={updateSource.bind(null, s.id)} className="grid gap-3 sm:grid-cols-[1fr_160px]">
              <label className="flex flex-col gap-1 text-xs text-muted">
                اسم المصدر
                <input name="name" defaultValue={s.name} className="rounded-lg border border-line px-3 py-2 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-xs text-muted">
                النوع
                <select name="type" defaultValue={s.type} className="rounded-lg border border-line px-3 py-2 text-sm">
                  {SOURCE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-muted sm:col-span-2">
                رابط (اختياري)
                <input name="url" defaultValue={s.url ?? ""} dir="ltr" className="rounded-lg border border-line px-3 py-2 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-xs text-muted sm:col-span-2">
                ملاحظات
                <textarea name="notes" defaultValue={s.notes ?? ""} rows={2} className="rounded-lg border border-line px-3 py-2 text-sm" />
              </label>
              <div className="flex gap-2 sm:col-span-2">
                <button type="submit" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white">
                  حفظ
                </button>
              </div>
            </form>
            <form action={deleteSource.bind(null, s.id)} className="mt-1">
              <button type="submit" className="text-xs font-semibold text-[var(--bad)]">
                حذف المصدر
              </button>
            </form>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <h2 className="font-display text-base font-bold text-ink">إضافة مصدر جديد</h2>
        <form action={createSource} className="mt-3 grid gap-3 sm:grid-cols-[1fr_160px]">
          <label className="flex flex-col gap-1 text-xs text-muted">
            اسم المصدر
            <input name="name" required className="rounded-lg border border-line px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            النوع
            <select name="type" defaultValue="TRAINING" className="rounded-lg border border-line px-3 py-2 text-sm">
              {SOURCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted sm:col-span-2">
            رابط (اختياري)
            <input name="url" dir="ltr" className="rounded-lg border border-line px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted sm:col-span-2">
            ملاحظات
            <textarea name="notes" rows={2} className="rounded-lg border border-line px-3 py-2 text-sm" />
          </label>
          <button type="submit" className="self-start rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white sm:col-span-2">
            إضافة
          </button>
        </form>
      </Card>
    </div>
  );
}
