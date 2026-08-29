"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction } from "@/lib/actions/auth";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, undefined);

  return (
    <div>
      <h1 className="font-display text-lg font-bold text-ink">إنشاء حساب جديد</h1>
      <p className="mt-1 text-sm text-muted">ابدأ رحلتك نحو شهادة PMI-PMOCP™.</p>

      <form action={formAction} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-ink">الاسم الكامل</span>
          <input
            name="name"
            type="text"
            required
            className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand-600"
            placeholder="اسمك"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-ink">البريد الإلكتروني</span>
          <input
            name="email"
            type="email"
            required
            dir="ltr"
            className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand-600"
            placeholder="you@example.com"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-ink">كلمة المرور</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            dir="ltr"
            className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand-600"
            placeholder="8 أحرف على الأقل"
          />
        </label>

        {state?.error && (
          <p className="rounded-lg bg-[var(--bad-bg)] px-3 py-2 text-sm text-[var(--bad)]">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-1 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:opacity-60"
        >
          {pending ? "جارٍ الإنشاء..." : "إنشاء الحساب والبدء"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        لديك حساب بالفعل؟{" "}
        <Link href="/login" className="font-semibold text-brand-700">
          تسجيل الدخول
        </Link>
      </p>
    </div>
  );
}
