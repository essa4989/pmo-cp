import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const VALUE_PROPS = [
  {
    title: "منهج منظّم رسمياً",
    en: "Structured Curriculum",
    body: "٤٠ درساً موزّعة على ٦ مجالات و٢٣ مهمة رسمية، مبنية على مخطط محتوى الامتحان (ECO) لا على ترتيب حقيبة تدريبية.",
  },
  {
    title: "تعلّم تفاعلي",
    en: "Interactive Learning",
    body: "استرجاع نشط، أسئلة تحقّق سريعة، وسيناريوهات PMO داخل كل درس — لا قراءة سلبية فقط.",
  },
  {
    title: "بنك أسئلة أصلي",
    en: "Original Question Bank",
    body: "١٨٠ سؤالاً موزّعة بالتساوي على المجالات الستة، بمستويات (تذكّر / تطبيق / تحليل) وتفسير كامل لكل خيار.",
  },
  {
    title: "محاكاة اختبار",
    en: "Exam Simulation",
    body: "وضع اختبار مؤقّت بدون تفسيرات فورية، ومحاكاة كاملة تحاكي زمن وتنسيق يوم الامتحان.",
  },
  {
    title: "مراجعة ذكية",
    en: "Smart Review",
    body: "تتبّع أخطائك، بطاقات تعلّم بتكرار متباعد، ومراجعة موجّهة نحو نقاط ضعفك تحديداً.",
  },
  {
    title: "تحليل الجاهزية",
    en: "Readiness Analytics",
    body: "مؤشر جاهزية تدريبي مبني على أدائك عبر المجالات والمهام والمحاكاة — وليس ضماناً للنجاح.",
  },
];

export default async function LandingPage() {
  const user = await getCurrentUser();
  const [domainCount, lessonCount, questionCount] = await Promise.all([
    prisma.domain.count({ where: { id: { gt: 0 } } }),
    prisma.lesson.count(),
    prisma.question.count(),
  ]);

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex flex-col leading-tight">
            <span className="font-display text-base font-bold text-brand-900">أكاديمية PMI-PMOCP</span>
            <span className="ltr-num text-[10px] tracking-[0.2em] text-gold-700">SELF-STUDY ACADEMY</span>
          </div>
          <nav className="flex items-center gap-3">
            {user ? (
              <Link
                href={user.role === "ADMIN" ? "/admin" : "/dashboard"}
                className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
              >
                الذهاب إلى لوحتي
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-brand-800 hover:underline">
                  تسجيل الدخول
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
                >
                  ابدأ مجاناً
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative overflow-hidden px-5 py-16 text-white"
        style={{ background: "linear-gradient(120deg, var(--brand-950), var(--brand-800) 65%, var(--brand-600))" }}
      >
        <div className="mx-auto max-w-4xl text-center">
          <span className="ltr-num inline-block rounded-full border border-gold-300/40 bg-white/5 px-4 py-1 text-[11px] tracking-[0.2em] text-gold-300">
            PMI-PMOCP™ EXAM PREP
          </span>
          <h1 className="font-display mt-5 text-3xl font-bold leading-relaxed sm:text-4xl">
            أتقِن مكتب المشاريع. اصنع القيمة. استعدّ بثقة.
          </h1>
          <p className="ltr-num mt-2 text-sm text-white/60">
            Master the PMO. Build Value. Prepare with Confidence.
          </p>
          <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-8 text-white/85">
            منهج متكامل للتعلّم الذاتي والاستعداد لاختبار{" "}
            <span className="ltr-num">PMI-PMOCP™</span> — دروس تفاعلية، بنك أسئلة، محاكاة اختبار،
            وتحليل جاهزية، مبنية على مخطط محتوى الامتحان الرسمي.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={user ? "/course" : "/register"}
              className="rounded-lg bg-gold-500 px-6 py-3 text-sm font-bold text-brand-950 shadow-lg hover:brightness-105"
            >
              ابدأ رحلة التعلّم
            </Link>
            <Link
              href={user ? "/diagnostic" : "/register"}
              className="rounded-lg border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              خُذ الاختبار التشخيصي
            </Link>
          </div>
          <div className="ltr-num mt-10 grid grid-cols-3 gap-4 text-white/80">
            <div>
              <div className="text-2xl font-bold text-white">{domainCount}</div>
              <div className="text-[11px] tracking-widest">DOMAINS</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{lessonCount}</div>
              <div className="text-[11px] tracking-widest">LESSONS</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{questionCount}</div>
              <div className="text-[11px] tracking-widest">QUESTIONS</div>
            </div>
          </div>
        </div>
      </section>

      {/* Independence disclaimer */}
      <section className="border-b border-line bg-[var(--warn-bg)] px-5 py-3">
        <p className="mx-auto max-w-4xl text-center text-xs leading-6 text-[var(--warn)]">
          هذه منصة تعليمية مستقلة للتحضير لشهادة PMI-PMOCP™، غير تابعة أو معتمدة رسمياً من
          <span className="ltr-num"> PMI</span>، وليست بديلاً عن الوثائق الرسمية الصادرة عنها.
        </p>
      </section>

      {/* Value props */}
      <section className="px-5 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-center text-2xl font-bold text-brand-900">
            القيمة التعليمية
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {VALUE_PROPS.map((v) => (
              <div key={v.en} className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
                <span className="ltr-num text-[11px] font-semibold tracking-widest text-brand-600">
                  {v.en}
                </span>
                <h3 className="font-display mt-1 text-base font-bold text-ink">{v.title}</h3>
                <p className="mt-2 text-sm leading-7 text-muted">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Journey */}
      <section className="bg-surface px-5 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-display text-2xl font-bold text-brand-900">رحلتك في المنصّة</h2>
          <p className="mt-2 text-sm text-muted">
            تشخيص → مسار مخصّص → تعلّم → تدريب → مراجعة → اختبار → تحليل → تحسين → محاكاة كاملة → جاهزية
          </p>
          <div className="ltr-num mt-8 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold">
            {["Diagnostic", "Personalized Path", "Learn", "Practice", "Review", "Test", "Analyze", "Mock Exam", "Readiness"].map(
              (step, i, arr) => (
                <span key={step} className="flex items-center gap-2">
                  <span className="rounded-full bg-brand-100 px-3 py-1.5 text-brand-800">{step}</span>
                  {i < arr.length - 1 && <span className="text-line">←</span>}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      <footer className="px-5 py-10">
        <div className="mx-auto max-w-6xl text-center text-xs text-muted">
          <p>
            منصة تعليمية مستقلة للتحضير لشهادة <span className="ltr-num">PMI-PMOCP™</span>. جميع
            أسماء وعلامات <span className="ltr-num">PMI®</span> ملك لأصحابها.
          </p>
          <p className="mt-1 ltr-num">© {new Date().getFullYear()} PMI-PMOCP Self-Study Academy</p>
        </div>
      </footer>
    </div>
  );
}
