import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, Badge } from "@/components/ui";
import { chooseStudyPlan, resetStudyPlan } from "@/lib/actions/planner";
import { STUDY_PLANS, dayNumberSince, findTodayRange } from "@/lib/studyplans";
import type { StudyPlanLength } from "@/lib/enums";
import StudyReminders from "@/components/StudyReminders";
import { pushConfigured } from "@/lib/push";

export const metadata = { title: "خطّتي الزمنية" };

export default async function PlannerPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const remindersConfigured = pushConfigured();

  if (!user.studyPlan || !user.studyPlanStart) {
    return (
      <div className="mx-auto max-w-4xl">
        <h1 className="font-display text-xl font-bold text-ink">اختر خطّتك الزمنية</h1>
        <p className="mt-1 text-sm text-muted">اختر الوتيرة التي تناسب وقتك — يمكنك تغييرها لاحقاً.</p>

        <Card className="mt-5">
          <StudyReminders serverConfigured={remindersConfigured} />
        </Card>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {(Object.entries(STUDY_PLANS) as [StudyPlanLength, (typeof STUDY_PLANS)["DAYS_30"]][]).map(
            ([key, plan]) => (
              <Card key={key}>
                <div className="font-display text-base font-bold text-ink">{plan.labelAr}</div>
                <div className="mt-1 text-xs text-muted">{plan.hoursPerDay}</div>
                <ul className="mt-3 space-y-1 text-xs text-muted">
                  {plan.ranges.slice(0, 4).map((r, i) => (
                    <li key={i} className="ltr-num">
                      {r.from}–{r.to}: {r.moduleId === "final" ? "Final review" : `Module ${r.moduleId}`}
                      {r.mock ? ` + Mock ${r.mock}` : ""}
                    </li>
                  ))}
                  <li className="text-muted/70">…</li>
                </ul>
                <form action={chooseStudyPlan.bind(null, key)}>
                  <button
                    type="submit"
                    className="mt-4 w-full rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
                  >
                    اختيار هذه الخطّة
                  </button>
                </form>
              </Card>
            )
          )}
        </div>
      </div>
    );
  }

  const plan = STUDY_PLANS[user.studyPlan as StudyPlanLength];
  const dayNumber = dayNumberSince(user.studyPlanStart);
  const todayRange = findTodayRange(user.studyPlan as StudyPlanLength, dayNumber);

  const domain =
    todayRange.moduleId !== "final" ? await prisma.domain.findUnique({ where: { id: todayRange.moduleId } }) : null;

  const nextLesson =
    todayRange.moduleId !== "final"
      ? await prisma.lesson.findFirst({
          where: {
            domainId: todayRange.moduleId,
            progress: { none: { userId: user.id, status: "COMPLETED" } },
          },
          orderBy: { order: "asc" },
        })
      : null;

  const mistakesCount = await prisma.userQuestionAttempt.count({ where: { userId: user.id, correct: false } });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-xl font-bold text-ink">خطّتي: {plan.labelAr}</h1>
        <form action={resetStudyPlan}>
          <button type="submit" className="text-xs font-semibold text-muted hover:text-brand-700">
            تغيير الخطّة
          </button>
        </form>
      </div>
      <p className="ltr-num mt-1 text-sm text-muted">
        Day {Math.min(dayNumber, plan.days)} / {plan.days}
      </p>

      <Card className="mt-5">
        <StudyReminders serverConfigured={remindersConfigured} />
      </Card>

      <Card className="mt-5">
        <div className="text-xs font-semibold text-brand-600">مهام اليوم — Today&apos;s Tasks</div>
        <ul className="mt-3 flex flex-col gap-2 text-sm text-ink">
          {nextLesson && (
            <li className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2">
              <span>
                درس: {nextLesson.code} · {nextLesson.titleAr}
              </span>
              <Link href={`/lesson/${nextLesson.code}`} className="font-semibold text-brand-700">
                فتح ←
              </Link>
            </li>
          )}
          <li className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2">
            <span>١٠ بطاقات تعليمية (Flashcards)</span>
            <Link href="/flashcards" className="font-semibold text-brand-700">
              فتح ←
            </Link>
          </li>
          <li className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2">
            <span>١٥ سؤالاً تدريبياً{domain ? ` من ${domain.titleAr}` : ""}</span>
            <Link href={domain ? `/practice/${domain.id}` : "/questions"} className="font-semibold text-brand-700">
              فتح ←
            </Link>
          </li>
          {mistakesCount > 0 && (
            <li className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2">
              <span>
                مراجعة <span className="ltr-num">{Math.min(5, mistakesCount)}</span> من أخطائك
              </span>
              <Link href="/mistakes" className="font-semibold text-brand-700">
                فتح ←
              </Link>
            </li>
          )}
          {todayRange.mock && (
            <li className="flex items-center justify-between rounded-lg bg-[var(--warn-bg)] px-3 py-2 text-[var(--warn)]">
              <span>محاكاة رقم {todayRange.mock} مجدولة هذا الأسبوع</span>
              <Link href="/exam" className="font-semibold">
                فتح ←
              </Link>
            </li>
          )}
        </ul>
      </Card>

      <div className="mt-6">
        <h2 className="font-display text-base font-bold text-ink">الجدول الكامل</h2>
        <div className="mt-3 flex flex-col gap-1.5">
          {plan.ranges.map((r, i) => {
            const active = todayRange === r;
            return (
              <div
                key={i}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                  active ? "border-brand-600 bg-brand-100" : "border-line bg-surface"
                }`}
              >
                <span className="ltr-num text-muted">
                  Day {r.from}–{r.to}
                </span>
                <span className="text-ink">
                  {r.moduleId === "final" ? "مراجعة نهائية متكاملة" : `الوحدة ${r.moduleId}`}
                  {r.mock ? ` + محاكاة ${r.mock}` : ""}
                </span>
                {active && <Badge tone="brand">اليوم</Badge>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
