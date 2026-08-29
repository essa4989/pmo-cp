"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function updateDomain(id: number, formData: FormData) {
  await requireAdmin();
  await prisma.domain.update({
    where: { id },
    data: {
      titleAr: String(formData.get("titleAr")),
      titleEn: String(formData.get("titleEn")),
      weightPct: Number(formData.get("weightPct")),
    },
  });
  revalidatePath("/admin/domains");
  revalidatePath("/course");
}

export async function updateLesson(id: string, formData: FormData) {
  await requireAdmin();
  await prisma.lesson.update({
    where: { id },
    data: {
      titleAr: String(formData.get("titleAr")),
      titleEn: String(formData.get("titleEn")),
      summaryAr: String(formData.get("summaryAr")),
      keyFactsAr: String(formData.get("keyFactsAr")),
      contentHtml: String(formData.get("contentHtml")),
      durationMin: Number(formData.get("durationMin")) || 12,
    },
  });
  revalidatePath("/admin/lessons");
  revalidatePath(`/admin/lessons/${id}`);
}

export async function updateQuestion(id: number, formData: FormData) {
  await requireAdmin();
  const options = [
    String(formData.get("option0")),
    String(formData.get("option1")),
    String(formData.get("option2")),
    String(formData.get("option3")),
  ];
  await prisma.question.update({
    where: { id },
    data: {
      questionText: String(formData.get("questionText")),
      optionsJson: JSON.stringify(options),
      answerIndex: Number(formData.get("answerIndex")),
      rationale: String(formData.get("rationale")),
      level: String(formData.get("level")),
      domainId: Number(formData.get("domainId")),
      taskNumber: Number(formData.get("taskNumber")),
      sourceTag: String(formData.get("sourceTag")),
    },
  });
  revalidatePath("/admin/questions");
  revalidatePath(`/admin/questions/${id}`);
}

export async function createQuestion(formData: FormData) {
  await requireAdmin();
  const options = [
    String(formData.get("option0")),
    String(formData.get("option1")),
    String(formData.get("option2")),
    String(formData.get("option3")),
  ];
  const maxIdRow = await prisma.question.findFirst({ orderBy: { id: "desc" } });
  const nextId = (maxIdRow?.id ?? 0) + 1;

  await prisma.question.create({
    data: {
      id: nextId,
      questionText: String(formData.get("questionText")),
      optionsJson: JSON.stringify(options),
      answerIndex: Number(formData.get("answerIndex")),
      rationale: String(formData.get("rationale")),
      level: String(formData.get("level")),
      domainId: Number(formData.get("domainId")),
      taskNumber: Number(formData.get("taskNumber")),
      sourceTag: String(formData.get("sourceTag")) || "TRAINING",
    },
  });
  revalidatePath("/admin/questions");
  redirect("/admin/questions");
}

export async function deleteQuestion(id: number) {
  await requireAdmin();
  await prisma.userQuestionAttempt.deleteMany({ where: { questionId: id } });
  await prisma.examAttemptQuestion.deleteMany({ where: { questionId: id } });
  await prisma.bookmark.deleteMany({ where: { questionId: id } });
  await prisma.question.delete({ where: { id } });
  revalidatePath("/admin/questions");
}

export async function createSource(formData: FormData) {
  await requireAdmin();
  await prisma.source.create({
    data: {
      name: String(formData.get("name")),
      type: String(formData.get("type")),
      url: String(formData.get("url") || "") || null,
      notes: String(formData.get("notes") || "") || null,
    },
  });
  revalidatePath("/admin/sources");
}

export async function updateSource(id: string, formData: FormData) {
  await requireAdmin();
  await prisma.source.update({
    where: { id },
    data: {
      name: String(formData.get("name")),
      type: String(formData.get("type")),
      url: String(formData.get("url") || "") || null,
      notes: String(formData.get("notes") || "") || null,
    },
  });
  revalidatePath("/admin/sources");
}

export async function deleteSource(id: string) {
  await requireAdmin();
  await prisma.source.delete({ where: { id } });
  revalidatePath("/admin/sources");
}

export async function setUserRole(id: string, role: "STUDENT" | "ADMIN") {
  await requireAdmin();
  await prisma.user.update({ where: { id }, data: { role } });
  revalidatePath("/admin/users");
}
