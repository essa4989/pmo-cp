"use server";

import { requireUser } from "@/lib/auth";
import { ensureCertificateIssued } from "@/lib/certificate";

export async function issueCertificateIfEligible() {
  const user = await requireUser();
  const cert = await ensureCertificateIssued(user.id);
  return cert ? { code: cert.code, issuedAt: cert.issuedAt } : null;
}
