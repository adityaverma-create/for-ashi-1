import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { list, get } from "@vercel/blob";
import type { NextResponse } from "next/server";
export const names = ["Aditya", "Ashi"] as const;
export type Profile = typeof names[number];
const secret = () => process.env.AUTH_SECRET || "";
const token = (value: string) => createHmac("sha256", secret()).update(value).digest("hex");
export function sign(value: string) { return value + "." + token(value); }
export function verify(value: string | undefined) {
  if (!value || !secret()) return null;
  const i = value.lastIndexOf("."); if (i < 1) return null;
  const raw = value.slice(0, i), sig = value.slice(i + 1), expected = token(raw);
  try { if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null; } catch { return null; }
  return raw;
}
export async function hasShared() { const c = await cookies(); return verify(c.get("site_access")?.value) === "shared"; }
export async function currentProfile(): Promise<Profile | null> {
  if (!(await hasShared())) return null;
  const c = await cookies(), raw = verify(c.get("profile_session")?.value);
  if (!raw) return null;
  const [p, issued] = raw.split(":");
  if (!names.includes(p as Profile) || !issued || Date.now() - Number(issued) > 1000*60*60*24*14) return null;
  return p as Profile;
}
export async function readPrivate(path: string): Promise<any | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN; if (!token) throw new Error("Storage is not configured");
  const found = await list({ prefix: path, token }), blob = found.blobs.find(b => b.pathname === path);
  if (!blob) return null;
  const result = await get(blob.url, { access: "private", token });
  if (!result) return null;
  return JSON.parse(await new Response(result.stream).text());
}
export async function writePrivate(path: string, value: unknown) {
  const { put } = await import("@vercel/blob"), token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error("Storage is not configured");
  await put(path, JSON.stringify(value), { access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json", token });
}
export function setCookie(res: NextResponse, name: string, value: string, maxAge = 60*60*24*30) {
  res.cookies.set(name, value, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge });
}
export const blank = { photos: [] as any[], diary: [] as any[], ritual: [false,false,false,false] };
