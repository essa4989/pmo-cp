import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ensureCertificateIssued, getCertificateEligibility } from "@/lib/certificate";
import { generateCertificatePdf } from "@/lib/certificatePdf";
import { getSiteUrl } from "@/lib/site";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const eligibility = await getCertificateEligibility(user.id);
  if (!eligibility.eligible) {
    return NextResponse.json({ error: "not eligible yet" }, { status: 403 });
  }

  const certificate = await ensureCertificateIssued(user.id);
  if (!certificate) return NextResponse.json({ error: "not eligible yet" }, { status: 403 });

  const pdfBytes = await generateCertificatePdf({
    learnerName: user.name,
    courseTitleAr: "برنامج PMI-PMOCP للتعلّم الذاتي",
    courseTitleEn: "PMI-PMOCP Self-Study Program",
    issuedAt: certificate.issuedAt,
    code: certificate.code,
    verifyUrl: `${getSiteUrl()}/verify/${certificate.code}`,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="PMI-PMOCP-Certificate-${certificate.code}.pdf"`,
    },
  });
}
