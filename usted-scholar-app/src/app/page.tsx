import { supabase } from "@/lib/supabase";
import { LibraryClient } from "@/components/dashboard/LibraryClient";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

const PROGRAM = "IT Education";
const LEVEL = "Level 300";
const SEMESTER = "Sem 2";

export default async function CourseLibrary() {
  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .eq("program", PROGRAM);

  return (
    <LibraryClient
      courses={courses || []}
      program={PROGRAM}
      level={LEVEL}
      semester={SEMESTER}
    />
  );
}
