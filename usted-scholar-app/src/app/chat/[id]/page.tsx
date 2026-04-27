"use client";

import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { StudyDashboard } from "@/components/chat/StudyDashboard";
import { QuizUI } from "@/components/chat/QuizUI";
import { BottomNav } from "@/components/layout/BottomNav";
import { 
  LayoutDashboard, 
  BookOpen, 
  GraduationCap, 
  FlaskConical, 
  Settings, 
  Bell, 
  Search, 
  ChevronLeft,
  Sparkles,
  FileText,
  MessageSquare,
  HelpCircle
} from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";

export default function ChatPage() {
  const { id } = useParams() as { id: string };
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileView, setMobileView] = useState<"summary" | "chat">("summary");
  const [showQuiz, setShowQuiz] = useState(false);

  useEffect(() => {
    async function fetchCourse() {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("id", id)
        .single();
      if (!error) setCourse(data);
      setLoading(false);
    }
    fetchCourse();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#FFCC22]"></div>
    </div>
  );

  if (!course) return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 text-center">
      <div>
        <h2 className="text-2xl font-bold mb-4">Course not found</h2>
        <Link href="/" className="text-[#FFCC22] hover:underline">Return to Library</Link>
      </div>
    </div>
  );

  const title = course.name || course.final_renamed_title || "Untitled Course";

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] bg-[#050505] text-white font-sans overflow-hidden">
      
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="w-[260px] shrink-0 border-r border-white/5 hidden lg:flex flex-col bg-[#020202]">
        <div className="p-8 pb-10">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8C033B] to-[#FFCC22] flex items-center justify-center">
              <span className="text-white font-black text-xs">U</span>
            </div>
            <h1 className="text-xl font-black tracking-tighter text-white transition-opacity group-hover:opacity-80">
              USTED<span className="text-[#8C033B]">SCHOLAR</span>
            </h1>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {[
            { href: "/", label: "Dashboard", icon: LayoutDashboard },
            { href: "/", label: "My Library", icon: BookOpen, active: true },
            { href: "#", label: "Course Modules", icon: GraduationCap },
            { href: "#", label: "Research Lab", icon: FlaskConical },
            { href: "#", label: "Settings", icon: Settings, mt: "mt-8" },
          ].map((item, i) => (
            <Link 
              key={i} 
              href={item.href} 
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                item.active 
                  ? "text-white bg-[#8C033B]/10 border border-[#8C033B]/30" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              } ${item.mt || ""}`}
            >
              <item.icon className={`w-5 h-5 ${item.active ? "text-[#FFCC22]" : "opacity-60"}`} />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* MOBILE TOP BAR (Matching Image) */}
        <header className="lg:hidden h-[72px] px-6 border-b border-white/5 flex items-center justify-between bg-[#050505] z-30">
          <div className="flex items-center gap-3">
             <Link href="/" className="w-8 h-8 flex items-center justify-center text-gray-400">
                <ChevronLeft className="w-6 h-6" />
             </Link>
             <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#8C033B] to-[#FFCC22] flex items-center justify-center">
                  <span className="text-white font-black text-[10px]">U</span>
                </div>
                <span className="font-black text-sm tracking-tight text-white uppercase">USTED <span className="text-[#8C033B]">Scholar</span></span>
             </div>
          </div>
          <div className="flex items-center gap-4 text-gray-400">
             <Bell className="w-5 h-5" />
             <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10">
                <Image src="/logo.png" alt="User" width={32} height={32} />
             </div>
          </div>
        </header>

        {/* MOBILE COURSE HEADER (Matching Image) */}
        <div className="lg:hidden px-6 pt-6 pb-2">
           <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded-md bg-[#8C033B]/10 border border-[#8C033B]/20 text-[10px] font-bold text-[#8C033B] uppercase tracking-wider">Advanced Learning</span>
              <span className="text-[10px] text-gray-500 font-bold tracking-widest">• MODULE {course.level || '1'}</span>
           </div>
           <h2 className="text-2xl font-black leading-tight tracking-tight text-white">
              {title}
           </h2>
        </div>

        {/* CONTENT TOGGLE FOR MOBILE */}
        <div className="flex-1 overflow-hidden relative">
          <div className={`absolute inset-0 transition-transform duration-500 ${mobileView === "summary" ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
             <StudyDashboard fileId={course.file_id} title={title} />
          </div>
          <div className={`absolute inset-0 transition-transform duration-500 bg-[#0A0A0A] ${mobileView === "chat" ? "translate-x-0" : "translate-x-full lg:translate-x-0 lg:relative lg:block hidden lg:w-[420px] xl:w-[480px]"}`}>
             <ChatInterface courseId={course.id} fileId={course.file_id} />
          </div>
        </div>

        {/* MOBILE ACTION BUTTONS (Matching Image) */}
        <div className="lg:hidden absolute bottom-24 left-0 right-0 flex justify-center gap-4 z-40 pointer-events-none">
           <button 
             onClick={() => { setMobileView("summary"); setShowQuiz(false); }}
             className="pointer-events-auto flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl transition-all active:scale-95"
           >
              <div className="w-8 h-8 rounded-full bg-[#8C033B] flex items-center justify-center text-white">
                 <FileText className="w-4 h-4" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-white">Summarize</span>
           </button>
           <button 
             onClick={() => setShowQuiz(true)}
             className="pointer-events-auto flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl transition-all active:scale-95"
           >
              <div className="w-8 h-8 rounded-full bg-[#FFCC22] flex items-center justify-center text-black">
                 <HelpCircle className="w-4 h-4" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-white">Quiz Me</span>
           </button>
        </div>

        {/* MOBILE CHAT FAB (Matching Image) */}
        <button 
          onClick={() => setMobileView(mobileView === "chat" ? "summary" : "chat")}
          className="lg:hidden absolute bottom-8 right-6 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8C033B] to-[#FFCC22] flex items-center justify-center shadow-[0_0_30px_rgba(140,3,59,0.4)] z-50 active:scale-90 transition-transform"
        >
          {mobileView === "chat" ? <ChevronLeft className="w-6 h-6 text-white" /> : <Sparkles className="w-6 h-6 text-white" />}
        </button>

        <BottomNav />
      </div>

      {/* ── DESKTOP CHAT PANE (Hidden on Mobile) ── */}
      <aside className="hidden lg:flex w-[420px] xl:w-[480px] shrink-0 flex-col relative z-20 border-l border-white/5">
         <ChatInterface courseId={course.id} fileId={course.file_id} />
      </aside>

      {/* QUIZ OVERLAY */}
      {showQuiz && (
        <QuizUI fileId={course.file_id} onClose={() => setShowQuiz(false)} />
      )}

    </div>
  );
}
