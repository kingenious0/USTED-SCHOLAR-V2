"use client";

import { motion } from "framer-motion";
import { 
  TrendingUp, 
  Flame, 
  Target, 
  Clock, 
  BookOpen, 
  Sparkles,
  ArrowRight,
  GraduationCap
} from "lucide-react";
import { CourseCard } from "./CourseCard";
import Link from "next/link";

interface DashboardClientProps {
  recentCourses: any[];
}

export function DashboardClient({ recentCourses }: DashboardClientProps) {
  const stats = [
    { label: "Current GPA", value: "3.85", sub: "+0.12 this sem", icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Daily Streak", value: "14 Days", sub: "Mastery Level: 4", icon: Flame, color: "text-orange-500", bg: "bg-orange-500/10" },
    { label: "Progress", value: "72%", sub: "Target: 90%", icon: Target, color: "text-green-500", bg: "bg-green-500/10" },
  ];

  return (
    <div className="p-8 space-y-10 max-w-7xl mx-auto">
      {/* Header */}
      <header>
        <p className="text-[#FFCC22] text-xs font-black tracking-[0.2em] uppercase mb-2">Habari za asubuhi •</p>
        <h1 className="text-4xl font-black tracking-tighter">Jambo, <span className="text-[#8C033B]">Scholar!</span></h1>
        <p className="text-gray-400 text-sm mt-1">IT EDUCATION • LEVEL 300</p>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-xl relative overflow-hidden group hover:border-white/10 transition-all"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity`} />
            <div className="flex justify-between items-start mb-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</p>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="text-3xl font-black mb-1">{stat.value}</div>
            <p className={`text-[10px] font-bold ${stat.color} tracking-wide`}>{stat.sub}</p>
          </motion.div>
        ))}
      </section>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Recent Modules */}
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#8C033B]" />
              Recent Modules
            </h3>
            <Link href="/coursehub" className="text-xs text-[#FFCC22] font-black uppercase tracking-widest hover:opacity-80 flex items-center gap-1">
              Course Hub <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recentCourses.length > 0 ? (
              recentCourses.map((course, i) => (
                <CourseCard key={course.id} course={course} index={i} />
              ))
            ) : (
              <div className="col-span-2 p-12 text-center rounded-3xl bg-white/5 border border-white/5 border-dashed">
                <BookOpen className="w-10 h-10 opacity-20 mx-auto mb-4" />
                <p className="text-gray-500">No courses synced yet.</p>
                <Link href="/coursehub" className="text-[#8C033B] text-sm font-bold hover:underline mt-2 inline-block">Visit Library</Link>
              </div>
            )}
          </div>
        </section>

        {/* Sidebar Widgets */}
        <aside className="space-y-6">
           {/* AI Suggestion */}
           <div className="p-8 rounded-3xl bg-gradient-to-br from-[#8C033B]/20 to-transparent border border-[#8C033B]/20 relative overflow-hidden">
              <Sparkles className="w-8 h-8 text-[#FFCC22] mb-4" />
              <h4 className="font-bold text-lg mb-2">AI Tutoring Active</h4>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">
                Llama 3.3 has analyzed your recent history and suggests focusing on <strong>Database Development</strong> today.
              </p>
              <button className="w-full py-3 rounded-xl bg-white text-black font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-transform">
                Start Session
              </button>
           </div>

           {/* Quiz Hub Shortcut */}
           <div className="p-8 rounded-3xl bg-white/5 border border-white/5 flex flex-col justify-between min-h-[200px]">
              <div>
                <GraduationCap className="w-8 h-8 text-[#FFCC22] mb-4" />
                <h4 className="font-bold text-lg mb-1">Quiz Hub</h4>
                <p className="text-xs text-gray-500">Practice with AI generated exams.</p>
              </div>
              <Link href="/quizzes" className="mt-6 flex items-center justify-between text-sm font-bold group">
                <span className="text-gray-300 group-hover:text-white transition-colors">Enter Testing Lab</span>
                <ArrowRight className="w-4 h-4 text-[#8C033B]" />
              </Link>
           </div>
        </aside>
      </div>
    </div>
  );
}
