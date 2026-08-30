import { prisma } from "@/lib/db";

export type CertificateEligibility = {
  eligible: boolean;
  lessonsCompleted: number;
  lessonsTotal: number;
  mockExamCompleted: boolean;
};

// "Course Completed" per the platform's completion logic: every lesson
// finished, plus at least one full Mock Exam actually submitted — matches
// the brief's "Domains + Mock Exam requirements" bar, without inventing a
// separate graded final assessment that doesn't exist in the source content.
export async function getCertificateEligibility(userId: string): Promise<CertificateEligibility> {
  const [lessonsTotal, lessonsCompleted, mockExamCount] = await Promise.all([
    prisma.lesson.count(),
    prisma.userLessonProgress.count({ where: { userId, status: "COMPLETED" } }),
    prisma.examAttempt.count({ where: { userId, mode: "MOCK_EXAM", status: "SUBMITTED" } }),
  ]);

  const mockExamCompleted = mockExamCount > 0;
  return {
    eligible: lessonsTotal > 0 && lessonsCompleted >= lessonsTotal && mockExamCompleted,
    lessonsCompleted,
    lessonsTotal,
    mockExamCompleted,
  };
}

function generateCertificateCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let code = "";
  for (let i = 0; i < 10; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `PMOCP-${code.slice(0, 5)}-${code.slice(5)}`;
}

export async function ensureCertificateIssued(userId: string) {
  const existing = await prisma.certificate.findUnique({ where: { userId } });
  if (existing) return existing;

  const eligibility = await getCertificateEligibility(userId);
  if (!eligibility.eligible) return null;

  // Retry on the rare code collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await prisma.certificate.create({
        data: { userId, code: generateCertificateCode() },
      });
    } catch {
      continue;
    }
  }
  throw new Error("Failed to issue certificate after several attempts");
}
