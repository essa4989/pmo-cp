import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

type RawTask = {
  code: string;
  title_ar: string;
  title_en: string;
  lessons_ref: string;
};

type RawDomain = {
  id: number;
  title_ar: string;
  title_en: string;
  weight_pct: number;
  approx_questions_official: number;
  tasks: RawTask[];
};

type RawLesson = {
  module: number;
  number: number;
  code: string;
  title_ar: string;
  title_en: string;
  summary_ar: string;
  key_facts_ar: string;
  content_html: string;
};

type RawQuestion = {
  id: number;
  domain: number;
  task: number;
  level: string;
  question: string;
  options: string[];
  answer_index: number;
  rationale: string;
};

type RawGlossary = {
  term_ar: string;
  term_en: string;
  definition: string;
  source_tag: string;
};

type RawTrap = {
  n: string;
  trap: string;
  wrong_choice: string;
  correct_logic: string;
};

type Curriculum = {
  meta: Record<string, string>;
  domains: RawDomain[];
  lessons: RawLesson[];
  questions: RawQuestion[];
  glossary: RawGlossary[];
  traps: RawTrap[];
  strategy_html: string;
  plans_html: string;
  source_validation_html: string;
  source_map_html: string;
  readiness_html: string;
};

const ORIENTATION_TITLE_AR = "التهيئة ومنهجية التعلّم";
const ORIENTATION_TITLE_EN = "Orientation & Learning Methodology";

const DOMAIN_COLORS: Record<number, string> = {
  0: "slate",
  1: "teal",
  2: "indigo",
  3: "amber",
  4: "emerald",
  5: "violet",
  6: "rose",
};

// Extract the "سيناريو PMO" (PMO Scenario) block from a lesson's rich HTML, if present,
// so it can seed the Case Study library without inventing new scenario content.
function extractScenario(contentHtml: string): { title: string; body: string } | null {
  const marker = /<h4>([^<]*سيناريو[^<]*)<\/h4>/;
  const match = contentHtml.match(marker);
  if (!match) return null;
  const startIdx = match.index! + match[0].length;
  const rest = contentHtml.slice(startIdx);
  const nextH4 = rest.search(/<h4>/);
  const nextDiv = rest.search(/<div class="recall">/);
  let endIdx = rest.length;
  if (nextH4 !== -1) endIdx = Math.min(endIdx, nextH4);
  if (nextDiv !== -1) endIdx = Math.min(endIdx, nextDiv);
  const body = rest.slice(0, endIdx).trim();
  if (!body) return null;
  return { title: match[1].trim(), body };
}

async function main() {
  const raw = fs.readFileSync(
    path.join(process.cwd(), "content", "curriculum.json"),
    "utf-8"
  );
  const data: Curriculum = JSON.parse(raw);

  console.log("Seeding domains + tasks...");
  await prisma.domain.upsert({
    where: { id: 0 },
    update: {},
    create: {
      id: 0,
      code: "M0",
      titleAr: ORIENTATION_TITLE_AR,
      titleEn: ORIENTATION_TITLE_EN,
      weightPct: 0,
      approxQuestionsOfficial: 0,
      order: 0,
      colorToken: DOMAIN_COLORS[0],
    },
  });

  for (const d of data.domains) {
    await prisma.domain.upsert({
      where: { id: d.id },
      update: {},
      create: {
        id: d.id,
        code: `D${d.id}`,
        titleAr: d.title_ar,
        titleEn: d.title_en,
        weightPct: d.weight_pct,
        approxQuestionsOfficial: d.approx_questions_official,
        order: d.id,
        colorToken: DOMAIN_COLORS[d.id] ?? "teal",
      },
    });

    let order = 0;
    for (const t of d.tasks) {
      order += 1;
      await prisma.task.upsert({
        where: { domainId_code: { domainId: d.id, code: t.code } },
        update: {},
        create: {
          domainId: d.id,
          code: t.code,
          titleAr: t.title_ar,
          titleEn: t.title_en,
          lessonsRef: t.lessons_ref,
          order,
        },
      });
    }
  }

  // Map "1.1" -> Task id by converting the Arabic-Indic lesson references
  // ("١.١ · ١.٦") stored on each task back into Latin-digit lesson codes.
  const arabicToLatin = (s: string) =>
    s.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  const lessonCodeToTaskId = new Map<string, string>();
  const allTasks = await prisma.task.findMany();
  for (const t of allTasks) {
    for (const part of t.lessonsRef.split("·")) {
      const code = arabicToLatin(part).trim();
      if (/^\d+\.\d+$/.test(code)) lessonCodeToTaskId.set(code, t.id);
    }
  }

  console.log("Seeding lessons + case studies...");
  let order = 0;
  for (const l of data.lessons) {
    order += 1;
    const taskId = lessonCodeToTaskId.get(l.code) ?? null;
    const lesson = await prisma.lesson.upsert({
      where: { code: l.code },
      update: {
        titleAr: l.title_ar,
        titleEn: l.title_en,
        summaryAr: l.summary_ar,
        keyFactsAr: l.key_facts_ar,
        contentHtml: l.content_html,
        taskId,
      },
      create: {
        domainId: l.module,
        taskId,
        module: l.module,
        number: l.number,
        code: l.code,
        titleAr: l.title_ar,
        titleEn: l.title_en,
        summaryAr: l.summary_ar,
        keyFactsAr: l.key_facts_ar,
        contentHtml: l.content_html,
        order,
      },
    });

    const scenario = extractScenario(l.content_html);
    if (scenario) {
      const existing = await prisma.caseStudy.findFirst({
        where: { lessonId: lesson.id },
      });
      if (!existing) {
        await prisma.caseStudy.create({
          data: {
            lessonId: lesson.id,
            titleAr: `${l.title_ar} — ${scenario.title}`,
            bodyHtml: scenario.body,
            order,
          },
        });
      }
    }
  }

  console.log("Seeding question bank...");
  for (const q of data.questions) {
    await prisma.question.upsert({
      where: { id: q.id },
      update: {},
      create: {
        id: q.id,
        domainId: q.domain,
        taskNumber: q.task,
        level: q.level,
        questionText: q.question,
        optionsJson: JSON.stringify(q.options),
        answerIndex: q.answer_index,
        rationale: q.rationale,
        sourceTag: "TRAINING",
      },
    });
  }

  console.log("Seeding glossary...");
  await prisma.glossaryTerm.deleteMany({});
  let gOrder = 0;
  for (const g of data.glossary) {
    gOrder += 1;
    await prisma.glossaryTerm.create({
      data: {
        termAr: g.term_ar,
        termEn: g.term_en,
        definition: g.definition,
        sourceTag: g.source_tag,
        order: gOrder,
      },
    });
  }

  console.log("Seeding exam traps...");
  await prisma.examTrap.deleteMany({});
  for (const t of data.traps) {
    const n = parseInt(
      t.n.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))),
      10
    );
    await prisma.examTrap.create({
      data: {
        n: isNaN(n) ? 0 : n,
        trap: t.trap,
        wrongChoice: t.wrong_choice,
        correctLogic: t.correct_logic,
      },
    });
  }

  console.log("Seeding flashcards from glossary...");
  await prisma.flashcard.deleteMany({});
  const glossaryTerms = await prisma.glossaryTerm.findMany();
  const domainIdByOrder = [1, 2, 3, 4, 5, 6];
  for (let i = 0; i < glossaryTerms.length; i++) {
    const g = glossaryTerms[i];
    const domainId = domainIdByOrder[i % domainIdByOrder.length];
    await prisma.flashcard.create({
      data: {
        front: `${g.termAr} (${g.termEn})`,
        back: g.definition,
        domainId,
      },
    });
  }

  console.log("Seeding sources...");
  await prisma.source.deleteMany({});
  await prisma.source.createMany({
    data: [
      {
        name: "PMI PMO Certified Professional — Examination Content Outline (ECO), Feb 2025 V2",
        type: "PMI_OFFICIAL",
        verificationDate: new Date(),
        notes: "المرجع الحاكم لبنية الامتحان والأوزان والمهام الثلاثة والعشرين.",
      },
      {
        name: "A Guide to the Project Management Body of Knowledge (PMBOK Guide) — Seventh Edition",
        type: "PMBOK7",
        notes: "مرجع مبادئ وأداء.",
      },
      {
        name: "PMBOK Guide — Eighth Edition (ملاحظات تحديث)",
        type: "PMBOK8_SUPPORTING",
        notes: "تحديثات داعمة غير امتحانية مباشرة حتى إشعار آخر.",
      },
      {
        name: "حقيبة PMI-PMOCP التدريبية العربية الموحّدة (٦ ملفات، ٥٨٢ شريحة)",
        type: "TRAINING",
        notes: "المصدر التعليمي الأساسي؛ خضع لـ٦٩ ملاحظة تصحيح موثّقة قبل الاعتماد.",
      },
    ],
  });

  console.log("Seeding demo users...");
  const adminPass = await bcrypt.hash("Admin@12345", 10);
  await prisma.user.upsert({
    where: { email: "admin@pmocp.academy" },
    update: {},
    create: {
      email: "admin@pmocp.academy",
      passwordHash: adminPass,
      name: "مدير المنصة",
      role: "ADMIN",
    },
  });

  const studentPass = await bcrypt.hash("Student@12345", 10);
  await prisma.user.upsert({
    where: { email: "student@pmocp.academy" },
    update: {},
    create: {
      email: "student@pmocp.academy",
      passwordHash: studentPass,
      name: "متعلّم تجريبي",
      role: "STUDENT",
      studyPlan: "DAYS_60",
      studyPlanStart: new Date(),
      currentStreak: 3,
      longestStreak: 7,
    },
  });

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
