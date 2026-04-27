import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { StudyDashboard } from "@/components/chat/StudyDashboard";
import { LayoutDashboard, BookOpen, GraduationCap, FlaskConical, Settings } from "lucide-react";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Fetch course from Supabase
  const { data: course, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !course) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Course not found</h2>
          <Link href="/" className="text-[#1E90FF] hover:underline">Return to Library</Link>
        </div>
      </div>
    );
  }

  const title = course.name || course.final_renamed_title || "Untitled Course";

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] bg-[#050505] text-white font-sans overflow-hidden">
      
      {/* 1. Left Pane: Navigation Sidebar (Matching Image) */}
      <aside className="w-[260px] shrink-0 border-r border-white/5 hidden lg:flex flex-col bg-[#020202]">
        <div className="p-8 pb-10">
          <Link href="/" className="block group">
            <h1 className="text-xl font-black tracking-tighter text-[#1E90FF] transition-opacity group-hover:opacity-80">
              USTED<span className="text-white">SCHOLAR</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] opacity-40 font-bold mt-1.5 text-gray-400">Academic Hub</p>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors">
            <LayoutDashboard className="w-5 h-5 opacity-60" /> Dashboard
          </Link>
          <Link href="/" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-white bg-[#1a2639] border border-blue-900/30 rounded-xl shadow-inner">
            <BookOpen className="w-5 h-5 text-[#1E90FF]" /> My Library
          </Link>
          <Link href="#" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors">
            <GraduationCap className="w-5 h-5 opacity-60" /> Course Modules
          </Link>
          <Link href="#" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors">
            <FlaskConical className="w-5 h-5 opacity-60" /> Research Lab
          </Link>
          <Link href="#" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors mt-8">
            <Settings className="w-5 h-5 opacity-60" /> Settings
          </Link>
        </nav>
      </aside>

      {/* 2. Middle Pane: Smart Summary Dashboard */}
      <main className="flex-1 flex flex-col min-w-0 relative bg-[#050505]">
        <StudyDashboard fileId={course.file_id} title={title} />
      </main>

      {/* 3. Right Pane: Chat Interface */}
      <aside className="w-full lg:w-[420px] xl:w-[480px] shrink-0 flex flex-col relative z-20">
        <ChatInterface courseId={course.id} fileId={course.file_id} />
      </aside>

    </div>
  );
}
