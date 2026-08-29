"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SITE_ACCESS_COOKIE, signSiteAccessToken } from "@/lib/siteAccess";

export type SiteAccessState = { error?: string } | undefined;

export async function enterSiteAction(
  _prev: SiteAccessState,
  formData: FormData
): Promise<SiteAccessState> {
  const code = String(formData.get("code") || "").trim();
  const expected = process.env.SITE_ACCESS_CODE;

  if (!expected) {
    redirect("/"); // gate not configured — nothing to check
  }
  if (code !== expected) {
    return { error: "الرمز غير صحيح." };
  }

  const token = await signSiteAccessToken();
  const cookieStore = await cookies();
  cookieStore.set(SITE_ACCESS_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 180 * 24 * 60 * 60,
  });

  redirect("/");
}
