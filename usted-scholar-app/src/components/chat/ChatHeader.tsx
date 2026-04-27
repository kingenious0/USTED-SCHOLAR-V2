"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Bot, Sparkles } from "lucide-react";

interface ChatHeaderProps {
  courseName?: string;
}

export function ChatHeader({ courseName = "AI Tutor" }: ChatHeaderProps) {
  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex items-center px-6 py-4 border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-xl shrink-0 sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
    >
      <Link 
        href="/" 
        className="mr-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all hover:scale-105 active:scale-95"
      >
        <ArrowLeft className="w-5 h-5" />
      </Link>
      
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-blue-600/20 border border-primary/30 flex items-center justify-center relative shadow-[0_0_15px_rgba(46,91,255,0.2)]">
          <Bot className="w-5 h-5 text-primary" />
          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#0A0A0A]"></div>
        </div>
        
        <div>
          <h1 className="text-lg font-bold font-['Outfit'] text-white flex items-center gap-2">
            {courseName}
          </h1>
          <p className="text-xs text-primary/80 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Powered by Gemini 2.5 Flash
          </p>
        </div>
      </div>
    </motion.header>
  );
}
