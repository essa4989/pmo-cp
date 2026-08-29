import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-950 px-4 py-10"
      style={{ background: "radial-gradient(circle at 30% 0%, var(--brand-800), var(--brand-950))" }}>
      <Link href="/" className="mb-8 flex flex-col items-center gap-1 text-center">
        <span className="font-display text-xl font-bold text-white">أكاديمية PMI-PMOCP</span>
        <span className="ltr-num text-xs tracking-[0.2em] text-gold-300">SELF-STUDY ACADEMY</span>
      </Link>
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white p-7 shadow-2xl">
        {children}
      </div>
      <p className="mt-6 max-w-md text-center text-xs text-white/50">
        منصة تعليمية مستقلة للتحضير لشهادة PMI-PMOCP™، وغير تابعة أو معتمدة من PMI ما لم يثبت خلاف ذلك.
      </p>
    </div>
  );
}
