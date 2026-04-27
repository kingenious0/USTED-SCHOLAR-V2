"use client";

import { motion } from "framer-motion";
import { Search, Bell, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function TopAppBar() {
  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex justify-between items-center px-6 py-4 w-full sticky top-0 z-30 bg-[#0A0A0A]/60 backdrop-blur-xl border-b border-white/10"
    >
      <div className="flex items-center gap-4">
        <motion.span 
          whileHover={{ scale: 1.05 }}
          className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-orange-500 font-['Outfit'] tracking-tight"
        >
          USTED Scholar
        </motion.span>
      </div>
      
      <div className="flex items-center gap-5">
        <div className="hidden md:flex items-center bg-white/5 hover:bg-white/10 transition-colors rounded-full px-4 py-2 border border-white/10 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 group">
          <Search className="w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors mr-2" />
          <input
            className="bg-transparent border-none outline-none focus:ring-0 text-sm text-on-surface w-64 placeholder:text-gray-500"
            placeholder="Search courses..."
            type="text"
          />
        </div>
        
        <motion.button 
          whileHover={{ scale: 1.1, rotate: 10 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 text-gray-400 hover:text-white transition-colors relative"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse border border-[#0A0A0A]"></span>
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.1, rotate: -10 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 text-gray-400 hover:text-primary transition-colors"
        >
          <Sparkles className="w-5 h-5" />
        </motion.button>
        
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center border-2 border-white/10 shadow-[0_0_15px_rgba(46,91,255,0.3)] cursor-pointer"
        >
          <User className="w-5 h-5 text-white" />
        </motion.div>
      </div>
    </motion.header>
  );
}
