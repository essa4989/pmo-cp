import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getCertificateEligibility, ensureCertificateIssued } from "@/lib/certificate";
import { Card, ProgressBar, Badge } from "@/components/ui";

export const metadata = { title: "شهادة الإتمام" };

export default async function CertificatePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const eligibility = await getCertificateEligibility(user.id);
  const certificate = eligibility.eligible ? await ensureCertificateIssued(user.id) : null;

  const lessonPct = eligibility.lessonsTotal
    ? Math.round((eligibility.lessonsCompleted / eligibility.lessonsTotal) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-xl font-bold text-ink">شهادة إتمام البرنامج</h1>
      <p className="mt-1 text-sm text-muted">
        شهادة إتمام داخلية صادرة عن هذه المنصّة، وليست شهادة PMI-PMOCP™ الرسمية ولا تمنحها أو
        تعتمدها PMI.
      </p>

      {certificate ? (
        <Card className="mt-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--ok-bg)] text-3xl">
            🎓
          </div>
          <h2 className="font-display mt-3 text-lg font-bold text-ink">تهانينا، {user.name}!</h2>
          <p className="mt-1 text-sm text-muted">
            أكملت برنامج PMI-PMOCP للتعلّم الذاتي بالكامل. شهادتك جاهزة.
          </p>

          <div className="mt-4 rounded-xl border border-line bg-surface-2 p-4 text-start">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>رمز التحقّق</span>
              <span className="ltr-num font-semibold text-ink">{certificate.code}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-muted">
              <span>تاريخ الإصدار</span>
              <span className="ltr-num">{certificate.issuedAt.toLocaleDateString("ar-EG")}</span>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <a
              href="/api/certificate/pdf"
              className="rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
            >
              تنزيل الشهادة (PDF)
            </a>
            <Link
              href={`/verify/${certificate.code}`}
              className="rounded-lg border border-line px-5 py-2.5 text-sm font-semibold text-ink hover:bg-surface-2"
            >
              رابط التحقّق العام
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="mt-6">
          <h2 className="font-display text-base font-bold text-ink">شروط الحصول على الشهادة</h2>
          <div className="mt-4 flex flex-col gap-4">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink">إكمال جميع الدروس</span>
                <span className="ltr-num text-xs text-muted">
                  {eligibility.lessonsCompleted}/{eligibility.lessonsTotal}
                </span>
              </div>
              <div className="mt-1.5">
                <ProgressBar value={lessonPct} tone={lessonPct === 100 ? "ok" : "brand"} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm">
              <span className="text-ink">إنجاز محاكاة اختبار كاملة (Mock Exam) واحدة على الأقل</span>
              <Badge tone={eligibility.mockExamCompleted ? "ok" : "muted"}>
                {eligibility.mockExamCompleted ? "مكتمل ✓" : "لم يتمّ بعد"}
              </Badge>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/course" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white">
              متابعة الدروس
            </Link>
            <Link href="/exam" className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink">
              الذهاب إلى المحاكاة
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
