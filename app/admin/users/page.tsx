import { prisma } from "@/lib/db";
import { Card, Badge } from "@/components/ui";
import { getOverallProgress } from "@/lib/analytics";

export const metadata = { title: "إدارة المستخدمين" };

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  const progressList = await Promise.all(users.map((u) => getOverallProgress(u.id)));

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-xl font-bold text-ink">إدارة المستخدمين</h1>
      <p className="mt-1 text-sm text-muted">{users.length} مستخدماً مسجّلاً.</p>

      <div className="mt-5 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-xs text-muted">
            <tr>
              <th className="px-3 py-2 text-start">الاسم</th>
              <th className="px-3 py-2 text-start">البريد</th>
              <th className="px-3 py-2 text-start">الدور</th>
              <th className="px-3 py-2 text-start">التقدّم</th>
              <th className="px-3 py-2 text-start">الجاهزية</th>
              <th className="px-3 py-2 text-start">أسئلة محلولة</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id} className="border-t border-line">
                <td className="px-3 py-2 font-medium text-ink">{u.name}</td>
                <td className="ltr-num px-3 py-2 text-muted">{u.email}</td>
                <td className="px-3 py-2">
                  <Badge tone={u.role === "ADMIN" ? "brand" : "muted"}>{u.role}</Badge>
                </td>
                <td className="ltr-num px-3 py-2">{progressList[i].lessonProgressPct}%</td>
                <td className="ltr-num px-3 py-2">{progressList[i].readinessPct}%</td>
                <td className="ltr-num px-3 py-2">{progressList[i].questionsSolved}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Card className="mt-5 text-xs text-muted">
        بيانات المستخدمين محمية على مستوى الخادم؛ هذه الصفحة متاحة للأدوار الإدارية فقط ولا تعرض كلمات
        المرور أو أي بيانات اعتماد.
      </Card>
    </div>
  );
}
