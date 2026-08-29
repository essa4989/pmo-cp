"use client";

import { useActionState } from "react";
import { enterSiteAction } from "@/lib/actions/siteAccess";

export default function EnterSitePage() {
  const [state, formAction, pending] = useActionState(enterSiteAction, undefined);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4 py-10"
      style={{ background: "radial-gradient(circle at 30% 0%, var(--brand-800), var(--brand-950))" }}
    >
      <div className="mb-8 flex flex-col items-center gap-1 text-center">
        <span className="font-display text-xl font-bold text-white">أكاديمية PMI-PMOCP</span>
        <span className="ltr-num text-xs tracking-[0.2em] text-gold-300">SELF-STUDY ACADEMY</span>
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white p-7 shadow-2xl">
        <h1 className="font-display text-lg font-bold text-ink">وصول محدود</h1>
        <p className="mt-1 text-sm text-muted">هذه النسخة متاحة حالياً لمن لديه رمز دعوة فقط.</p>

        <form action={formAction} className="mt-5 flex flex-col gap-3">
          <input
            name="code"
            type="password"
            required
            autoFocus
            dir="ltr"
            placeholder="رمز الدخول"
            className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand-600"
          />
          {state?.error && (
            <p className="rounded-lg bg-[var(--bad-bg)] px-3 py-2 text-sm text-[var(--bad)]">{state.error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
          >
            {pending ? "جارٍ التحقّق..." : "دخول"}
          </button>
        </form>
      </div>
    </div>
  );
}
