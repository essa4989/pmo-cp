import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, Badge } from "@/components/ui";
import { startMockExam } from "@/lib/actions/quiz";
import ExamModeForm from "@/components/ExamModeForm";

export const metadata = { title: "الاختبار التجريبي" };

export default async function ExamHubPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [domains, mockAttempts] = await Promise.all([
    prisma.domain.findMany({ where: { id: { gt: 0 } }, orderBy: { order: "asc" } }),
    prisma.examAttempt.findMany({
      where: { userId: user.id, mode: "MOCK_EXAM" },
      orderBy: { startedAt: "desc" },
    }),
  ]);

  const bestBySet = new Map<number, (typeof mockAttempts)[number]>();
  for (const a of mockAttempts) {
    if (!a.mockSetNumber) continue;
    const current = bestBySet.get(a.mockSetNumber);
    if (!current || (a.status === "SUBMITTED" && current.status !== "SUBMITTED")) {
      bestBySet.set(a.mockSetNumber, a);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-xl font-bold text-ink">الاختبار التجريبي الكامل — Mock Exam</h1>
      <p className="mt-1 text-sm text-muted">
        ثلاث محاكاة مستقلة، كل واحدة ٦٠ سؤالاً موزّعة بالتساوي على المجالات الستة، بزمن محدّد وبدون
        تفسيرات أثناء الاختبار — تحاكي تنسيق يوم الامتحان.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((n) => {
          const attempt = bestBySet.get(n);
          const startFn = startMockExam.bind(null, n as 1 | 2 | 3);
          return (
            <Card key={n}>
              <div className="ltr-num text-xs font-semibold text-brand-600">MOCK EXAM {n}</div>
              <div className="font-display mt-1 text-base font-bold text-ink">محاكاة رقم {arabicOrd(n)}</div>
              <div className="ltr-num mt-1 text-xs text-muted">60 questions · 75 min</div>
              {attempt?.status === "SUBMITTED" ? (
                <div className="mt-3">
                  <Badge tone={attempt.scorePct >= 75 ? "ok" : attempt.scorePct >= 60 ? "warn" : "bad"}>
                    آخر نتيجة: <span className="ltr-num">{attempt.scorePct}%</span>
                  </Badge>
                </div>
              ) : (
                <div className="mt-3">
                  <Badge tone="muted">لم يُنجَز بعد</Badge>
                </div>
              )}
              <form action={startFn}>
                <button
                  type="submit"
                  className="mt-4 w-full rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
                >
                  {attempt?.status === "SUBMITTED" ? "إعادة المحاكاة" : "بدء المحاكاة"}
                </button>
              </form>
            </Card>
          );
        })}
      </div>

      <div className="mt-8">
        <h2 className="font-display text-base font-bold text-ink">وضع اختبار مخصّص — Exam Mode</h2>
        <p className="mt-1 text-sm text-muted">
          اختر مجالاً وعدد الأسئلة والمدّة الزمنية لتجربة أدوات وضع الاختبار (عدّاد، تنقّل، وضع علامة
          للمراجعة) بدون الالتزام بمحاكاة كاملة.
        </p>
        <Card className="mt-3">
          <ExamModeForm domains={domains} />
        </Card>
      </div>
    </div>
  );
}

function arabicOrd(n: number) {
  return ["", "الأولى", "الثانية", "الثالثة"][n] ?? n;
}
