
import { NextRequest } from "next/server";
import { get, list } from "@vercel/blob";
import { currentProfile, readPrivate } from "@/lib";

export async function GET(req: NextRequest) {
  const p = await currentProfile();
  if (!p) return new Response("Unauthorized", { status: 401 });

  const path = req.nextUrl.searchParams.get("path") || "";
  if (path.includes("..")) {
    return new Response("Not found", { status: 404 });
  }

  const owner = path.split("/")[1];

  if (
    (owner !== "Aditya" && owner !== "Ashi") ||
    !path.startsWith(`profiles/${owner}/photos/`)
  ) {
    return new Response("Not found", { status: 404 });
  }

  if (owner !== p) {
    const other = await readPrivate(`profiles/${owner}/data.json`);

    const allowed = other?.photos?.some(
      (photo: any) =>
        photo.path === path &&
        Array.isArray(photo.sharedWith) &&
        photo.sharedWith.includes(p)
    );

    if (!allowed) {
      return new Response("Not found", { status: 404 });
    }
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN!;
  const blobs = await list({ prefix: path, token });
  const blob = blobs.blobs.find(b => b.pathname === path);

  if (!blob) return new Response("Not found", { status: 404 });

  const result = await get(blob.url, {
    access: "private",
    token
  });

  if (!result) return new Response("Not found", { status: 404 });

  return new Response(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType || "image/jpeg",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
    