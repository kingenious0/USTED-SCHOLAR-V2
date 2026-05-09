"use client";

import { useState, useMemo } from "react";
import { CourseCard } from "@/components/dashboard/CourseCard";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Home,
  BookOpen,
  User,
  Bell,
  Search,
  Sparkles,
  TrendingUp,
  Clock,
  BookMarked,
  ChevronRight,
  X,
  Menu,
} from "lucide-react";
import Link from "next/link";
import { BottomNav } from "@/components/layout/BottomNav";

interface Course {
  id: string;
  name: string;
  meta_tag?: string;
  final_renamed_title?: string;
  program?: string;
}

interface LibraryClientProps {
  courses: Course[];
  program: string;
  level: string;
  semester: string;
}

export function LibraryClient({ courses, program, level, semester }: LibraryClientProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return courses;
    const q = search.toLowerCase();
    return courses.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.final_renamed_title || "").toLowerCase().includes(q) ||
        (c.meta_tag || "").toLowerCase().includes(q)
    );
  }, [courses, search]);

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-white font-sans overflow-hidden transition-colors duration-300">
      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#050505]">
        {/* Top Nav Bar */}
        <header className="sticky top-0 z-30 h-[72px] flex items-center justify-between px-8 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-md border-b border-black/8 dark:border-white/5 shrink-0 transition-colors duration-300">
          {/* Search */}
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses..."
              className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl pl-10 pr-10 py-2.5 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 outline-none focus:border-[#8C033B]/50 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 ml-6 shrink-0">
            <button className="relative w-9 h-9 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FFCC22] rounded-full"></span>
            </button>
            <button className="w-9 h-9 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              <Sparkles className="w-5 h-5" />
            </button>

            {/* ✨ THEME SWITCHER */}
            <ThemeToggle />

            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8C033B] to-[#FFCC22] flex items-center justify-center text-white font-black text-xs">
              ST
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 space-y-10">

          {/* ── HERO BANNER ── */}
          <section className="relative w-full rounded-3xl overflow-hidden border border-black/5 dark:border-white/5 min-h-[220px] flex items-end p-10 bg-gradient-to-br from-[#f5e6ea] via-[#fdf0e8] to-[#fff8e1] dark:from-[#0d0010] dark:via-[#0a001a] dark:to-[#0d0d0d]">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-[#8C033B]/10 blur-[100px] pointer-events-none" />
            <div className="absolute top-10 right-20 w-[200px] h-[200px] rounded-full bg-[#FFCC22]/5 blur-[60px] pointer-events-none" />
            <div className="relative z-10 max-w-2xl">
              <span className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-bold tracking-widest uppercase text-gray-300 mb-5">
                Semester 2 · 2025/2026 
              </span>
              <h2 className="text-4xl lg:text-5xl font-black leading-tight mb-4 font-['Outfit'] tracking-tight">
                Continue your <span className="text-[#FFCC22]">Scholarly</span>
                <br />
                <span className="text-[#8C033B]">Journey</span>
              </h2>
              <p className="text-gray-400 text-base">
                {courses.length} courses loaded · Powered by Gemini 2.5 Flash AI
              </p>
            </div>
          </section>

          {/* ── ACTIVE MODULES ── */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold">Active Modules</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {search ? (
                    <span><span className="text-[#8C033B] font-semibold">{filtered.length}</span> results for "{search}"</span>
                  ) : (
                    `Your primary academic focus areas for ${level}`
                  )}
                </p>
              </div>
              <button className="flex items-center gap-1 text-xs text-[#FFCC22] font-bold hover:opacity-80 transition-opacity">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {filtered.length === 0 ? (
              <div className="p-16 text-center border border-black/5 dark:border-white/5 rounded-3xl bg-black/[0.02] dark:bg-white/[0.02]">
                <BookMarked className="w-12 h-12 opacity-20 mx-auto mb-4" />
                <p className="text-lg font-medium">
                  {search ? `No courses found matching "${search}"` : `No course materials found for ${program}.`}
                </p>
                {search && (
                  <button onClick={() => setSearch("")} className="mt-3 text-sm text-[#8C033B] hover:underline">
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filtered.map((course, index) => (
                  <CourseCard key={course.id} course={course} index={index} />
                ))}
              </div>
            )}
          </section>

          {/* ── BOTTOM ROW ── */}
          <section className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 pb-4">
            <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-white dark:bg-white/[0.02] p-8 flex flex-col gap-6 shadow-sm dark:shadow-none">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#8C033B]/10 border border-[#8C033B]/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-[#8C033B]" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Learning Velocity</h4>
                  <p className="text-sm text-gray-500">AI is tracking your study patterns</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: courses.length, label: "Courses Loaded" },
                  { value: "2026", label: "Academic Year" },
                  { value: "A", label: "Target Grade" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-gray-50 dark:bg-white/[0.03] rounded-xl p-5 border border-black/5 dark:border-white/5 text-center">
                    <div className="text-3xl font-black mb-1">{stat.value}</div>
                    <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#FFCC22]/20 bg-[#FFCC22]/[0.03] p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[#FFCC22]/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-[#FFCC22]" />
                  </div>
                  <h4 className="font-bold">AI Suggestion</h4>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Open any course and let the Scholar AI generate an instant{" "}
                  <span className="text-[#FFCC22] font-semibold">Smart Summary</span>,{" "}
                  expert annotations, and a citation list — all from your lecture materials.
                </p>
              </div>
              <Link
                href={courses.length > 0 ? `/chat/${courses[0].id}` : "#"}
                className="mt-6 w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#FFCC22]/10 hover:bg-[#FFCC22]/20 border border-[#FFCC22]/30 text-[#FFCC22] font-bold text-sm transition-all"
              >
                <Clock className="w-4 h-4" />
                Start Review
              </Link>
            </div>
          </section>
        </main>
      </div>
      {/* ── BOTTOM NAV (Mobile) ── */}
      <BottomNav />
    </div>
  );
}
