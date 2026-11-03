import CourseDetailPage from "@/app/cursos/[slug]/page";

export const dynamic = "force-dynamic";

export default async function DebugCoursePage() {
  return CourseDetailPage({
    params: Promise.resolve({ slug: "cursos-ecografia-muscoloesqueletico" }),
  });
}
