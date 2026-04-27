"use client";

import { motion } from "framer-motion";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
  input: string;
  setInput: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export function ChatInput({ input, setInput, onSubmit, isLoading }: ChatInputProps) {
  return (
    <motion.footer 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="p-4 md:p-6 bg-[#0A0A0A] shrink-0 border-t border-white/5 relative z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]"
    >
      <div className="max-w-4xl mx-auto relative">
        <form onSubmit={onSubmit} className="relative flex items-center group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your AI Tutor about the notes..."
            className="w-full bg-[#1A1A1A] border border-white/10 rounded-full py-4 pl-6 pr-16 text-sm text-gray-200 focus:outline-none focus:border-primary/50 focus:bg-[#202020] transition-all shadow-inner font-['Outfit']"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-primary flex items-center justify-center text-white hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(46,91,255,0.3)] hover:shadow-[0_0_20px_rgba(46,91,255,0.5)]"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5 ml-1" />
            )}
          </button>
        </form>
        <p className="text-center text-[10px] text-gray-500 mt-3 uppercase tracking-widest font-['Outfit'] font-semibold">
          AI can make mistakes. Verify important information.
        </p>
      </div>
    </motion.footer>
  );
}
