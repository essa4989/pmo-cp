"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { answerAttemptQuestion, submitAttempt, toggleMarkForReview } from "@/lib/actions/quiz";

type Q = {
  questionId: number;
  order: number;
  text: string;
  options: string[];
  domainId: number;
  level: string;
  selectedIndex: number | null;
  markedForReview: boolean;
};

type Feedback = { correct: boolean; correctIndex: number; rationale: string };

export default function AttemptRunner({
  attemptId,
  mode,
  durationSec,
  questions,
}: {
  attemptId: string;
  mode: "DOMAIN_QUIZ" | "EXAM_MODE" | "MOCK_EXAM";
  durationSec: number | null;
  questions: Q[];
}) {
  const immediateFeedback = mode === "DOMAIN_QUIZ";

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>(() => {
    const init: Record<number, number> = {};
    for (const q of questions) if (q.selectedIndex !== null) init[q.questionId] = q.selectedIndex;
    return init;
  });
  const [marked, setMarked] = useState<Set<number>>(
    () => new Set(questions.filter((q) => q.markedForReview).map((q) => q.questionId))
  );
  const [feedback, setFeedback] = useState<Record<number, Feedback>>({});
  const [pending, startTransition] = useTransition();
  const [timeLeft, setTimeLeft] = useState(durationSec ?? 0);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const current = questions[index];
  const answeredCount = Object.keys(answers).length;

  useEffect(() => {
    if (!durationSec) return;
    if (timeLeft <= 0) {
      startTransition(() => submitAttempt(attemptId));
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, durationSec, attemptId]);

  const timeLabel = useMemo(() => {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, [timeLeft]);

  function selectOption(qId: number, optIndex: number) {
    if (!immediateFeedback && answers[qId] !== undefined) return;
    if (immediateFeedback && feedback[qId]) return;
    setAnswers((a) => ({ ...a, [qId]: optIndex }));
  }

  function submitCurrentAnswer() {
    const selected = answers[current.questionId];
    if (selected === undefined) return;
    startTransition(async () => {
      const res = await answerAttemptQuestion(attemptId, current.questionId, selected);
      setFeedback((f) => ({ ...f, [current.questionId]: res }));
    });
  }

  function commitAnswerSilently(qId: number, optIndex: number) {
    startTransition(async () => {
      await answerAttemptQuestion(attemptId, qId, optIndex);
    });
  }

  function goTo(i: number) {
    if (i < 0 || i >= questions.length) return;
    setIndex(i);
  }

  function toggleMark() {
    const qId = current.questionId;
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
    startTransition(() => toggleMarkForReview(attemptId, qId));
  }

  function finalSubmit() {
    startTransition(() => submitAttempt(attemptId));
  }

  const currentFeedback = feedback[current.questionId];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3">
        <div className="ltr-num text-sm font-semibold text-ink">
          Question {index + 1} / {questions.length}
        </div>
        <div className="flex items-center gap-3">
          {durationSec !== null && (
            <span
              className={`ltr-num rounded-lg px-3 py-1 text-sm font-bold ${
                timeLeft < 60 ? "bg-[var(--bad-bg)] text-[var(--bad)]" : "bg-brand-100 text-brand-800"
              }`}
            >
              ⏱ {timeLabel}
            </span>
          )}
          <span className="ltr-num text-xs text-muted">{answeredCount} answered</span>
          <button
            onClick={() => setConfirmSubmit(true)}
            className="rounded-lg bg-[var(--bad)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
          >
            إنهاء وتسليم الاختبار
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_220px]">
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="ltr-num rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-muted">
              Domain {current.domainId}
            </span>
            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-muted">{current.level}</span>
            {!immediateFeedback && (
              <button
                onClick={toggleMark}
                className={`ms-auto rounded-full px-3 py-1 text-[11px] font-semibold ${
                  marked.has(current.questionId)
                    ? "bg-gold-500 text-brand-950"
                    : "border border-line text-muted hover:border-gold-500"
                }`}
              >
                {marked.has(current.questionId) ? "مُعلَّم للمراجعة ✓" : "وضع علامة للمراجعة"}
              </button>
            )}
          </div>

          <p className="text-[15px] font-medium leading-8 text-ink">{current.text}</p>

          <div className="mt-4 flex flex-col gap-2">
            {current.options.map((opt, i) => {
              const isSelected = answers[current.questionId] === i;
              const showResult = immediateFeedback && !!currentFeedback;
              const isCorrectAnswer = showResult && i === currentFeedback.correctIndex;
              const isWrongPick = showResult && isSelected && !currentFeedback.correct;
              return (
                <button
                  key={i}
                  disabled={showResult}
                  onClick={() => {
                    selectOption(current.questionId, i);
                    if (!immediateFeedback) commitAnswerSilently(current.questionId, i);
                  }}
                  className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-start text-sm transition ${
                    isCorrectAnswer
                      ? "border-[var(--ok)] bg-[var(--ok-bg)]"
                      : isWrongPick
                      ? "border-[var(--bad)] bg-[var(--bad-bg)]"
                      : isSelected
                      ? "border-brand-600 bg-brand-100"
                      : "border-line hover:border-brand-400"
                  }`}
                >
                  <span className="ltr-num flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line bg-surface-2 text-[11px]">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>

          {immediateFeedback && !currentFeedback && (
            <button
              onClick={submitCurrentAnswer}
              disabled={answers[current.questionId] === undefined || pending}
              className="mt-4 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              إرسال الإجابة
            </button>
          )}

          {immediateFeedback && currentFeedback && (
            <div className="mt-4">
              <div
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                  currentFeedback.correct
                    ? "bg-[var(--ok-bg)] text-[var(--ok)]"
                    : "bg-[var(--bad-bg)] text-[var(--bad)]"
                }`}
              >
                {currentFeedback.correct ? "إجابة صحيحة ✓" : "إجابة غير دقيقة"}
              </div>
              <p className="mt-2 text-sm leading-7 text-muted">{currentFeedback.rationale}</p>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
            <button
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
              className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink disabled:opacity-40"
            >
              → السابق
            </button>
            {index < questions.length - 1 ? (
              <button
                onClick={() => goTo(index + 1)}
                className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white"
              >
                التالي ←
              </button>
            ) : (
              <button
                onClick={() => setConfirmSubmit(true)}
                className="rounded-lg bg-[var(--bad)] px-4 py-2 text-sm font-semibold text-white"
              >
                إنهاء وتسليم
              </button>
            )}
          </div>
        </div>

        {/* Navigation panel */}
        <div className="rounded-xl border border-line bg-surface p-4">
          <div className="mb-2 text-xs font-semibold text-muted">لوحة التنقّل</div>
          <div className="grid grid-cols-6 gap-1.5 lg:grid-cols-5">
            {questions.map((q, i) => {
              const answered = answers[q.questionId] !== undefined;
              const isMarked = marked.has(q.questionId);
              const isCurrent = i === index;
              return (
                <button
                  key={q.questionId}
                  onClick={() => goTo(i)}
                  className={`ltr-num flex h-8 w-8 items-center justify-center rounded-md text-[11px] font-semibold transition ${
                    isCurrent
                      ? "ring-2 ring-brand-600"
                      : ""
                  } ${
                    isMarked
                      ? "bg-gold-300 text-brand-950"
                      : answered
                      ? "bg-brand-600 text-white"
                      : "bg-surface-2 text-muted"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-col gap-1.5 text-[11px] text-muted">
            <Legend color="var(--brand-600)" label="مُجاب" />
            <Legend color="var(--gold-300)" label="مُعلَّم للمراجعة" />
            <Legend color="var(--surface-2)" label="لم يُجَب بعد" bordered />
          </div>
        </div>
      </div>

      {confirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-surface p-5 text-center shadow-2xl">
            <h3 className="font-display text-base font-bold text-ink">تسليم الاختبار؟</h3>
            <p className="mt-2 text-sm text-muted">
              أجبت عن <span className="ltr-num font-semibold">{answeredCount}</span> من أصل{" "}
              <span className="ltr-num font-semibold">{questions.length}</span> سؤالاً. لا يمكن التراجع
              بعد التسليم.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setConfirmSubmit(false)}
                className="flex-1 rounded-lg border border-line px-4 py-2 text-sm font-medium"
              >
                متابعة الاختبار
              </button>
              <button
                onClick={finalSubmit}
                disabled={pending}
                className="flex-1 rounded-lg bg-[var(--bad)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {pending ? "جارٍ التسليم..." : "تسليم نهائي"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Legend({
  color,
  label,
  bordered,
}: {
  color: string;
  label: string;
  bordered?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-3 w-3 rounded"
        style={{ background: color, border: bordered ? "1px solid var(--line)" : undefined }}
      />
      {label}
    </div>
  );
}
