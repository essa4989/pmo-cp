"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV_SECTIONS } from "@/lib/nav";
import { logoutAction } from "@/lib/actions/auth";

export default function AppShell({
  children,
  userName,
  isAdmin,
}: {
  children: React.ReactNode;
  userName: string;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-5 py-5">
        <div className="font-display text-base font-bold text-white">أكاديمية PMI-PMOCP</div>
        <div className="ltr-num mt-0.5 text-[10px] tracking-[0.2em] text-gold-300">
          SELF-STUDY ACADEMY
        </div>
      </div>
      <div className="border-b border-white/10 px-5 py-3 text-xs text-white/60">
        مرحباً، <span className="font-semibold text-white">{userName}</span>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3 scrollbar-thin">
        {NAV_SECTIONS.map((sec) => (
          <div key={sec.title} className="mb-4">
            <div className="px-3 pb-1 text-[11px] font-semibold text-white/40">{sec.title}</div>
            {sec.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-lg px-3 py-2 text-sm transition ${
                    active
                      ? "bg-brand-700 font-semibold text-white"
                      : "text-white/75 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
        {isAdmin && (
          <div className="mb-4">
            <div className="px-3 pb-1 text-[11px] font-semibold text-white/40">الإدارة</div>
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className={`block rounded-lg px-3 py-2 text-sm transition ${
                pathname.startsWith("/admin")
                  ? "bg-gold-500 font-semibold text-brand-950"
                  : "text-gold-300 hover:bg-white/5"
              }`}
            >
              لوحة تحكّم الإدارة
            </Link>
          </div>
        )}
      </nav>
      <form action={logoutAction} className="border-t border-white/10 p-3">
        <button
          type="submit"
          className="w-full rounded-lg px-3 py-2 text-start text-sm text-white/70 hover:bg-white/5 hover:text-white"
        >
          تسجيل الخروج
        </button>
      </form>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-bg">
      <aside
        className="fixed inset-y-0 start-0 z-30 hidden w-64 flex-none lg:flex"
        style={{ background: "var(--brand-950)" }}
      >
        {SidebarContent}
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="إغلاق القائمة"
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 start-0 w-72" style={{ background: "var(--brand-950)" }}>
            {SidebarContent}
          </div>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col lg:ms-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-surface/95 px-4 py-3 backdrop-blur lg:hidden">
          <button
            aria-label="فتح القائمة"
            onClick={() => setOpen(true)}
            className="rounded-lg border border-line p-2 text-ink"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
          <span className="font-display text-sm font-bold text-brand-900">أكاديمية PMI-PMOCP</span>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
