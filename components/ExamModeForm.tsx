"use client";

import { useState, useTransition } from "react";
import { startExamMode } from "@/lib/actions/quiz";

export default function ExamModeForm({ domains }: { domains: { id: number; titleAr: string }[] }) {
  const [domainId, setDomainId] = useState<string>("all");
  const [count, setCount] = useState(20);
  const [minutes, setMinutes] = useState(25);
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(() => {
      startExamMode(domainId === "all" ? null : Number(domainId), count, minutes);
    });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="flex flex-1 flex-col gap-1 text-sm">
        <span className="text-xs font-medium text-muted">المجال</span>
        <select
          value={domainId}
          onChange={(e) => setDomainId(e.target.value)}
          className="rounded-lg border border-line px-3 py-2 text-sm"
        >
          <option value="all">كل المجالات (مختلط)</option>
          {domains.map((d) => (
            <option key={d.id} value={d.id}>
              {d.titleAr}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-xs font-medium text-muted">عدد الأسئلة</span>
        <select
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="ltr-num rounded-lg border border-line px-3 py-2 text-sm"
        >
          {[10, 20, 30, 40].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-xs font-medium text-muted">المدّة (دقيقة)</span>
        <select
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
          className="ltr-num rounded-lg border border-line px-3 py-2 text-sm"
        >
          {[15, 25, 35, 50].map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>
      <button
        onClick={submit}
        disabled={pending}
        className="rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
      >
        {pending ? "جارٍ الإنشاء..." : "بدء وضع الاختبار"}
      </button>
    </div>
  );
}
