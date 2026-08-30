import { prisma } from "@/lib/db";

export const metadata = { title: "التحقّق من شهادة" };

export default async function VerifyCertificatePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const certificate = await prisma.certificate.findUnique({
    where: { code },
    include: { user: { select: { name: true } } },
  });

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4 py-10"
      style={{ background: "radial-gradient(circle at 30% 0%, var(--brand-800), var(--brand-950))" }}
    >
      <div className="mb-8 flex flex-col items-center gap-1 text-center">
        <span className="font-display text-xl font-bold text-white">أكاديمية PMI-PMOCP</span>
        <span className="ltr-num text-xs tracking-[0.2em] text-gold-300">SELF-STUDY ACADEMY</span>
      </div>

      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white p-7 text-center shadow-2xl">
        {certificate ? (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ok-bg)] text-2xl">
              ✓
            </div>
            <h1 className="font-display mt-3 text-lg font-bold text-ink">شهادة صالحة</h1>
            <p className="mt-2 text-sm text-ink">
              صادرة باسم <b>{certificate.user.name}</b>
            </p>
            <p className="mt-1 text-sm text-muted">شهادة إتمام برنامج PMI-PMOCP للتعلّم الذاتي</p>
            <p className="ltr-num mt-1 text-xs text-muted">
              {certificate.issuedAt.toLocaleDateString("en-CA")}
            </p>
            <p className="ltr-num mt-3 rounded-lg bg-surface-2 px-3 py-2 text-xs text-ink">{certificate.code}</p>
            <p className="mt-4 text-[11px] leading-5 text-muted">
              شهادة إتمام داخلية صادرة عن هذه المنصّة المستقلة، وليست شهادة PMI-PMOCP™ الرسمية ولا
              صادرة أو معتمدة من PMI.
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bad-bg)] text-2xl">
              ✕
            </div>
            <h1 className="font-display mt-3 text-lg font-bold text-ink">رمز غير صالح</h1>
            <p className="mt-2 text-sm text-muted">لا توجد شهادة مطابقة لهذا الرمز في سجلّاتنا.</p>
          </>
        )}
      </div>
    </div>
  );
}
