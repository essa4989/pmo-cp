"use client";

import { useEffect, useState, useTransition } from "react";
import { subscribeToPush, unsubscribeFromPush, sendTestReminder } from "@/lib/actions/push";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function StudyReminders({ serverConfigured }: { serverConfigured: boolean }) {
  const [status, setStatus] = useState<"unknown" | "unsupported" | "denied" | "subscribed" | "off">(
    "unknown"
  );
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setStatus(sub ? "subscribed" : "off");
    })();
  }, []);

  function enable() {
    startTransition(async () => {
      setMessage(null);
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        setMessage("لم يُضبَط مفتاح الإشعارات على الخادم بعد.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
      await subscribeToPush(json);
      setStatus("subscribed");
    });
  }

  function disable() {
    startTransition(async () => {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await unsubscribeFromPush(sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus("off");
    });
  }

  function test() {
    startTransition(async () => {
      setMessage(null);
      try {
        const res = await sendTestReminder();
        setMessage(res.sent > 0 ? "أُرسِل تذكير تجريبي بنجاح." : "لا يوجد اشتراك نشط لإرسال تذكير إليه.");
      } catch {
        setMessage("تعذّر الإرسال — تأكد من ضبط الإشعارات على الخادم.");
      }
    });
  }

  if (status === "unsupported") {
    return <p className="text-xs text-muted">المتصفح الحالي لا يدعم الإشعارات.</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-ink">تذكيرات الدراسة</div>
          <p className="text-xs text-muted">
            {status === "subscribed"
              ? "الإشعارات مفعّلة على هذا الجهاز."
              : status === "denied"
              ? "تم رفض إذن الإشعارات من إعدادات المتصفح."
              : "فعّل الإشعارات لتذكيرك بالمذاكرة والبطاقات المستحقّة."}
          </p>
        </div>
        {status === "subscribed" ? (
          <button
            onClick={disable}
            disabled={pending}
            className="rounded-lg border border-line px-4 py-2 text-xs font-semibold text-ink disabled:opacity-50"
          >
            إيقاف
          </button>
        ) : (
          <button
            onClick={enable}
            disabled={pending || status === "denied"}
            className="rounded-lg bg-brand-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            تفعيل
          </button>
        )}
      </div>

      {status === "subscribed" && (
        <button
          onClick={test}
          disabled={pending || !serverConfigured}
          className="mt-2 text-xs font-semibold text-brand-700 hover:underline disabled:opacity-50"
        >
          إرسال تذكير تجريبي الآن
        </button>
      )}
      {!serverConfigured && <p className="mt-2 text-[11px] text-muted">لم يُضبَط الخادم لإرسال الإشعارات بعد.</p>}
      {message && <p className="mt-2 text-xs text-brand-700">{message}</p>}
    </div>
  );
}
