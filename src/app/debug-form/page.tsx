import { CourseRegistrationForm } from "@/components/sections/course-registration-form";

export const dynamic = "force-dynamic";

export default function DebugFormPage() {
  return (
    <div className="p-10">
      <h1>Debug form</h1>
      <CourseRegistrationForm
        courseId="78d25bc3-086b-4693-a913-6d77789c93ed"
        courseSlug="cursos-ecografia-muscoloesqueletico"
        courseTitle="Ecografía Muscoloesquelético"
      />
    </div>
  );
}
