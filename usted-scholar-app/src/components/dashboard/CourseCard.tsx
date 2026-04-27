"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";
import { BookOpen, ArrowRight } from "lucide-react";

interface CourseCardProps {
  course: {
    id: string;
    name: string;
    meta_tag?: string;
    final_renamed_title?: string;
  };
  index: number;
}

const BADGE_COLORS = ["ADVANCED", "TECHNICAL", "PEDAGOGY", "CORE", "APPLIED"];

// Light mode card gradient tops — warm tinted whites
const LIGHT_GRADIENTS = [
  "from-[#fde8ee] to-[#fef3f7]",
  "from-[#e8f0fe] to-[#f3f7ff]",
  "from-[#e8fef0] to-[#f3fff7]",
  "from-[#fef8e8] to-[#fffdf3]",
];

// Dark mode card gradient tops
const DARK_GRADIENTS = [
  "dark:from-[#0a1a2e] dark:to-[#0d2137]",
  "dark:from-[#1a0a0e] dark:to-[#2d0f1a]",
  "dark:from-[#0a1a0e] dark:to-[#0d2117]",
  "dark:from-[#1a1a0a] dark:to-[#2d2b0f]",
];

export function CourseCard({ course, index }: CourseCardProps) {
  const title = course.name || course.final_renamed_title || "Untitled Course";
  const tag = course.meta_tag || BADGE_COLORS[index % BADGE_COLORS.length];
  const lightGrad = LIGHT_GRADIENTS[index % LIGHT_GRADIENTS.length];
  const darkGrad = DARK_GRADIENTS[index % DARK_GRADIENTS.length];

  const [progress, setProgress] = useState(0);
  useEffect(() => {
    setProgress(Math.floor(Math.random() * 55) + 30);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="group"
    >
      <Link href={`/chat/${course.id}`} className="block">
        <div className="rounded-2xl border border-black/8 dark:border-white/5 bg-white dark:bg-[#0D0D0D] overflow-hidden hover:border-[#8C033B]/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#8C033B]/5">

          {/* Thumbnail Area */}
          <div className={`relative h-[140px] bg-gradient-to-br ${lightGrad} ${darkGrad} flex items-center justify-center overflow-hidden`}>
            <div className="absolute inset-0 opacity-30 dark:opacity-20" style={{
              backgroundImage: "radial-gradient(circle at 30% 40%, rgba(140,3,59,0.3) 0%, transparent 60%), radial-gradient(circle at 70% 70%, rgba(255,204,34,0.2) 0%, transparent 60%)"
            }} />
            <div className="relative z-10 text-center px-6">
              <div className="w-12 h-12 rounded-xl bg-white/60 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center mx-auto mb-2 shadow-sm">
                <BookOpen className="w-6 h-6 text-[#8C033B] dark:text-gray-300 opacity-80" />
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono tracking-widest opacity-70 uppercase line-clamp-2">
                {title.substring(0, 20)}
              </p>
            </div>

            {/* Badge */}
            <div className="absolute top-3 left-3">
              <span className="px-2.5 py-1 rounded-md bg-white/70 dark:bg-black/40 backdrop-blur-sm border border-black/10 dark:border-white/10 text-[9px] font-black tracking-widest text-gray-700 dark:text-white uppercase">
                {tag}
              </span>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-5">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2 mb-4 min-h-[40px]">
              {title}
            </h3>

            {/* Knowledge Loaded Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Knowledge Loaded</span>
                <span className="text-[9px] text-[#8C033B] font-black">{progress}%</span>
              </div>
              <div className="w-full h-1 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#8C033B] to-[#FFCC22] rounded-full transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* CTA Row */}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-gray-400">Start AI session</span>
              <div className="w-7 h-7 rounded-lg bg-[#8C033B]/10 border border-[#8C033B]/20 flex items-center justify-center group-hover:bg-[#8C033B] group-hover:border-[#8C033B] transition-all duration-300">
                <ArrowRight className="w-3.5 h-3.5 text-[#8C033B] group-hover:text-white transition-colors duration-300" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
