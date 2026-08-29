import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";

const ADMIN_NAV = [
  { href: "/admin", label: "التحليلات" },
  { href: "/admin/domains", label: "المجالات" },
  { href: "/admin/lessons", label: "الدروس والمحتوى" },
  { href: "/admin/questions", label: "بنك الأسئلة" },
  { href: "/admin/sources", label: "المصادر" },
  { href: "/admin/users", label: "المستخدمون" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="hidden w-60 flex-none border-e border-line bg-surface lg:block">
        <div className="border-b border-line px-5 py-5">
          <div className="font-display text-sm font-bold text-brand-900">لوحة تحكّم الإدارة</div>
          <div className="mt-0.5 text-[11px] text-muted">أكاديمية PMI-PMOCP</div>
        </div>
        <nav className="p-2">
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm text-ink hover:bg-surface-2"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-4 border-t border-line p-2">
          <Link href="/dashboard" className="block rounded-lg px-3 py-2 text-sm text-brand-700 hover:bg-surface-2">
            ← العودة إلى المنصّة
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="w-full rounded-lg px-3 py-2 text-start text-sm text-muted hover:bg-surface-2">
              تسجيل الخروج
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
