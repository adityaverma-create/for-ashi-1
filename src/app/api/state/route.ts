
import { NextRequest, NextResponse } from "next/server";
import { currentProfile, readPrivate, writePrivate, blank, names } from "@/lib";

function prepareItems(items: any[], owner: string) {
  return items.map(item => ({
    ...item,
    owner,
    sharedWith: Array.isArray(item.sharedWith)
      ? item.sharedWith.filter(
          (name: string) => names.includes(name as any) && name !== owner
        )
      : []
  }));
}

export async function GET() {
  const p = await currentProfile();

  if (!p) {
    return NextResponse.json(
      { error: "Profile session required." },
      { status: 401 }
    );
  }

  const otherName = names.find(n => n !== p)!;

  const own = (await readPrivate(`profiles/${p}/data.json`)) ?? blank;
  const other = (await readPrivate(`profiles/${otherName}/data.json`)) ?? blank;

  const ownPhotos = prepareItems(own.photos, p);
  const ownDiary = prepareItems(own.diary, p);

  const otherPhotos = prepareItems(other.photos, otherName)
    .filter(item => item.sharedWith.includes(p));

  const otherDiary = prepareItems(other.diary, otherName)
    .filter(item => item.sharedWith.includes(p));

  return NextResponse.json({
    photos: [...ownPhotos, ...otherPhotos],
    diary: [...ownDiary, ...otherDiary],
    ritual: own.ritual,
    profile: p
  });
}

export async function PUT(req: NextRequest) {
  const p = await currentProfile();

  if (!p) {
    return NextResponse.json(
      { error: "Profile session required." },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);

  if (
    !body ||
    !Array.isArray(body.photos) ||
    !Array.isArray(body.diary) ||
    !Array.isArray(body.ritual)
  ) {
    return NextResponse.json(
      { error: "Invalid scrapbook data." },
      { status: 400 }
    );
  }

  const ownPhotos = prepareItems(
    body.photos.filter((item: any) => !item.owner || item.owner === p),
    p
  );

  const ownDiary = prepareItems(
    body.diary.filter((item: any) => !item.owner || item.owner === p),
    p
  );

  if (
    ownPhotos.length > 500 ||
    ownDiary.length > 500 ||
    body.ritual.length > 20
  ) {
    return NextResponse.json(
      { error: "Scrapbook limit reached." },
      { status: 413 }
    );
  }

  await writePrivate(`profiles/${p}/data.json`, {
    photos: ownPhotos,
    diary: ownDiary,
    ritual: body.ritual
  });

  return NextResponse.json({ ok: true });
}
