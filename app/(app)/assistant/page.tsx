import AssistantChat from "@/components/AssistantChat";
import { Card } from "@/components/ui";

export const metadata = { title: "مساعد الدراسة الذكي" };

export default function AssistantPage() {
  const generativeEnabled = Boolean(process.env.ANTHROPIC_API_KEY);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-xl font-bold text-ink">مساعد الدراسة — Study Assistant</h1>
      <p className="mt-1 text-sm text-muted">
        اسأل عن أي مفهوم في المنهج. المساعد لا يخترع معلومات عن PMI مطلقاً — يعتمد حصراً على المنهج
        المعتمد (Verified Master Curriculum)، ويذكر الدرس أو المصطلح المصدر مع كل إجابة.
      </p>

      {!generativeEnabled && (
        <Card className="mt-4 !bg-[var(--info-bg)] text-xs text-[var(--info)]">
          يعمل المساعد حالياً في وضع الاسترجاع المباشر من المنهج (بلا نموذج توليدي مُفعَّل): يعرض أقرب
          الدروس والمصطلحات لسؤالك كما هي. لتفعيل صياغة إجابات موجزة بالذكاء الاصطناعي — مع بقائها
          مقيَّدة حصراً بنفس المحتوى المعتمد ودون اختراع أي معلومة — أضف متغيّر البيئة{" "}
          <code className="ltr-num">ANTHROPIC_API_KEY</code> على الخادم.
        </Card>
      )}

      <AssistantChat />
    </div>
  );
}
