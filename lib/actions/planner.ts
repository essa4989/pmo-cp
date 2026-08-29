"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import type { StudyPlanLength } from "@/lib/enums";

export async function chooseStudyPlan(plan: StudyPlanLength) {
  const user = await requireUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { studyPlan: plan, studyPlanStart: new Date() },
  });
  revalidatePath("/planner");
}

export async function resetStudyPlan() {
  const user = await requireUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { studyPlan: null, studyPlanStart: null },
  });
  revalidatePath("/planner");
}
