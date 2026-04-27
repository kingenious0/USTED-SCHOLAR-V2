"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface HeroSectionProps {
  program: string;
  level: string;
}

export function HeroSection({ program, level }: HeroSectionProps) {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="mb-12"
    >
      <div className="relative overflow-hidden rounded-[2rem] h-[300px] flex items-center p-8 md:p-12 bg-[#1A1A1A] border border-white/5 shadow-[0_0_40px_rgba(46,91,255,0.15)] group">
        {/* Background Gradients & Glows */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent z-10"></div>
        <div className="absolute top-0 right-0 w-2/3 h-full bg-primary/20 mix-blend-screen blur-3xl z-0 transition-opacity duration-1000 group-hover:opacity-60"></div>
        
        {/* Abstract Image Background */}
        <div className="absolute right-0 top-0 w-2/3 h-full opacity-40 z-0 scale-105 group-hover:scale-100 transition-transform duration-1000">
          {/* Using a sleek placeholder gradient instead of external images for robustness, or an external one if requested */}
          <div className="w-full h-full bg-gradient-to-bl from-blue-600/30 via-purple-600/20 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-20 max-w-xl">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-6 backdrop-blur-md shadow-[0_0_15px_rgba(46,91,255,0.2)]">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              {program} • {level}
            </span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-4xl md:text-5xl font-extrabold mb-4 font-['Outfit'] leading-tight tracking-tight text-white"
          >
            Continue your <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-primary to-purple-400 drop-shadow-sm">
              Scholarly Journey
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-gray-400 text-sm md:text-base max-w-md leading-relaxed"
          >
            Access your course materials instantly via your personal AI Tutor. Master your program with targeted insights.
          </motion.p>
        </div>
      </div>
    </motion.section>
  );
}
