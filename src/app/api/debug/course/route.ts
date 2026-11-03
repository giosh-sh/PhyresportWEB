import { NextRequest, NextResponse } from "next/server";
import { getPublicCourse } from "@/lib/courses";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  try {
    const course = await getPublicCourse(slug);
    return NextResponse.json({ course });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e), stack: e?.stack }, { status: 500 });
  }
}
