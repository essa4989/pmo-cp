import { SignJWT, jwtVerify } from "jose";

export const SITE_ACCESS_COOKIE = "pmocp_site_access";

function getSecretKey() {
  // Falls back to JWT_SECRET so no extra env var is strictly required —
  // set SITE_ACCESS_SECRET separately only if you want to rotate it
  // independently of user sessions.
  const secret = process.env.SITE_ACCESS_SECRET || process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("JWT_SECRET (or SITE_ACCESS_SECRET) must be set to a strong value.");
  }
  return new TextEncoder().encode(secret);
}

export function siteAccessEnabled(): boolean {
  return Boolean(process.env.SITE_ACCESS_CODE);
}

export async function signSiteAccessToken(): Promise<string> {
  return new SignJWT({ gate: "pmocp" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("180d")
    .sign(getSecretKey());
}

export async function verifySiteAccessToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, getSecretKey());
    return true;
  } catch {
    return false;
  }
}
