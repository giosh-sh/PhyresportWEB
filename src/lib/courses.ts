import { createPublicClient } from "@/lib/supabase/public";
import { courses as staticCourses } from "@/lib/data";

export interface Course {
  id: string;
  slug: string;
  title: string;
  date: string;
  description: string;
  image_url: string;
  image_full_url: string;
  program_pdf: string;
}

const FALLBACK: Course[] = staticCourses.map((c, i) => ({
  id: `static-${i}`,
  slug: c.slug,
  title: c.title,
  date: c.date,
  description: c.description,
  image_url: c.image,
  image_full_url: c.imageFull,
  program_pdf: c.programPdf,
}));

export async function getPublicCourses(): Promise<Course[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("courses")
      .select("id, slug, title, date, description, image_url, image_full_url, program_pdf")
      .eq("active", true)
      .order("sort_order", { ascending: true });

    if (error || !data || data.length === 0) return FALLBACK;

    return (data as Course[]).map((c) => ({
      ...c,
      image_url: c.image_url || c.image_full_url,
      image_full_url: c.image_full_url || c.image_url,
    }));
  } catch {
    return FALLBACK;
  }
}

export async function getPublicCourse(slug: string): Promise<Course | null> {
  const all = await getPublicCourses();
  return all.find((c) => c.slug === slug) ?? null;
}
