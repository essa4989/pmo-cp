"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Card, ProgressBar } from "@/components/ui";
import { submitDiagnostic } from "@/lib/actions/diagnostic";

type Q = { id: number; domainId: number; text: string; options: string[] };
type Result = {
  domainScoresPct: Record<number, number>;
  weakDomains: { id: number; titleAr: string }[];
  strongDomains: { id: number; titleAr: string }[];
};

export default function DiagnosticRunner({ questions }: { questions: Q[] }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<Result | null>(null);

  const current = questions[index];

  function select(optIndex: number) {
    setAnswers((a) => ({ ...a, [current.id]: optIndex }));
  }

  function next() {
    if (index < questions.length - 1) {
      setIndex((i) => i + 1);
    } else {
      startTransition(async () => {
        const payload = Object.entries(answers).map(([qid, selectedIndex]) => ({
          questionId: Number(qid),
          selectedIndex,
        }));
        const res = await submitDiagnostic(payload);
        setResult(res);
      });
    }
  }

  if (result) {
    return (
      <div className="mt-6">
        <Card>
          <h2 className="font-display text-lg font-bold text-ink">خطّتك الشخصية</h2>
          <p className="mt-1 text-sm text-muted">بناءً على أدائك في الاختبار التشخيصي:</p>

          {result.strongDomains.length > 0 && (
            <p className="mt-3 text-sm text-ink">
              لديك أداء جيّد في <b>{result.strongDomains.map((d) => d.titleAr).join(" و")}</b>.
            </p>
          )}
          {result.weakDomains.length > 0 && (
            <p className="mt-1 text-sm text-ink">
              نوصي بالتركيز على <b>{result.weakDomains.map((d) => d.titleAr).join(" و")}</b> أولاً.
            </p>
          )}

          <div className="mt-4 flex flex-col gap-2">
            {Object.entries(result.domainScoresPct).map(([id, pct]) => (
              <div key={id}>
                <div className="flex justify-between text-xs text-muted">
                  <span>مجال {id}</span>
                  <span className="ltr-num">{pct}%</span>
                </div>
                <ProgressBar value={pct} tone={pct >= 75 ? "ok" : pct >= 50 ? "warn" : "bad"} />
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {result.weakDomains[0] && (
              <Link
                href={`/course/${result.weakDomains[0].id}`}
                className="rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
              >
                ابدأ المسار الموصى به
              </Link>
            )}
            <Link href="/dashboard" className="rounded-lg border border-line px-5 py-2.5 text-sm font-semibold text-ink">
              الذهاب إلى لوحتي
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="mb-2 flex items-center justify-between text-xs text-muted">
        <span className="ltr-num">
          {index + 1} / {questions.length}
        </span>
      </div>
      <ProgressBar value={((index + 1) / questions.length) * 100} />

      <Card className="mt-4">
        <p className="text-[15px] font-medium leading-8 text-ink">{current.text}</p>
        <div className="mt-4 flex flex-col gap-2">
          {current.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => select(i)}
              className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-start text-sm transition ${
                answers[current.id] === i ? "border-brand-600 bg-brand-100" : "border-line hover:border-brand-400"
              }`}
            >
              <span className="ltr-num flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line bg-surface-2 text-[11px]">
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          ))}
        </div>
        <button
          onClick={next}
          disabled={answers[current.id] === undefined || pending}
          className="mt-4 w-full rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? "جارٍ التحليل..." : index < questions.length - 1 ? "التالي" : "عرض النتيجة"}
        </button>
      </Card>
    </div>
  );
}
