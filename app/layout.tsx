import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: {
    default: "أكاديمية PMI-PMOCP للتعلّم الذاتي",
    template: "%s · أكاديمية PMI-PMOCP",
  },
  description:
    "منصة تعليمية مستقلة للتحضير لشهادة PMI-PMOCP™: مسار تعلّم تفاعلي، بنك أسئلة، محاكاة اختبار، وتحليل جاهزية. غير تابعة أو معتمدة من PMI.",
  manifest: "/manifest.webmanifest",
  applicationName: "PMI-PMOCP Academy",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a2a35",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;500;600;700&family=Noto+Sans+Arabic:wght@400;500;600;700&family=Barlow+Semi+Condensed:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-full antialiased">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
