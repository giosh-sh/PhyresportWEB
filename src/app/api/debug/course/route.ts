import { NextRequest, NextResponse } from "next/server";
import { getPublicCourse } from "@/lib/courses";
import CourseDetailPage, { generateMetadata } from "@/app/cursos/[slug]/page";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  const out: Record<string, unknown> = {};
  try {
    out.course = await getPublicCourse(slug);
  } catch (e: any) {
    out.courseError = { message: e?.message || String(e), stack: e?.stack };
  }
  try {
    out.metadata = await generateMetadata({ params: Promise.resolve({ slug }) });
  } catch (e: any) {
    out.metadataError = { message: e?.message || String(e), stack: e?.stack };
  }
  try {
    const element = await CourseDetailPage({ params: Promise.resolve({ slug }) });
    out.pageElement = { ok: true, type: typeof element };
  } catch (e: any) {
    out.pageError = { message: e?.message || String(e), stack: e?.stack };
  }
  return NextResponse.json(out);
}
