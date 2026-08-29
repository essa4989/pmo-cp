export type NavItem = {
  href: string;
  label: string;
  section: string;
};

export const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "التعلّم",
    items: [
      { href: "/dashboard", label: "لوحة التقدّم", section: "dashboard" },
      { href: "/course", label: "المسار والمجالات", section: "course" },
      { href: "/progress", label: "تقدّمي وخريطة المعرفة", section: "progress" },
      { href: "/planner", label: "خطّتي الزمنية", section: "planner" },
    ],
  },
  {
    title: "التدريب والاختبار",
    items: [
      { href: "/questions", label: "بنك الأسئلة", section: "questions" },
      { href: "/exam", label: "الاختبار التجريبي (Mock)", section: "exam" },
      { href: "/mistakes", label: "أخطائي", section: "mistakes" },
      { href: "/flashcards", label: "البطاقات التعليمية", section: "flashcards" },
    ],
  },
  {
    title: "مراجع",
    items: [
      { href: "/case-studies", label: "معمل الحالات (PMO Case Lab)", section: "case-studies" },
      { href: "/glossary", label: "المسرد", section: "glossary" },
      { href: "/exam-strategy", label: "استراتيجية الامتحان وفخاخه", section: "exam-strategy" },
      { href: "/assistant", label: "مساعد الدراسة الذكي", section: "assistant" },
    ],
  },
];
