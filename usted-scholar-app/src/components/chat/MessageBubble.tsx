"use client";

import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  role: "user" | "ai";
  text: string;
}

export function MessageBubble({ role, text }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div className={cn(
        "flex max-w-[85%] md:max-w-[75%] gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}>
        
        {/* Avatar */}
        <div className={cn(
          "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-auto",
          isUser 
            ? "bg-gradient-to-tr from-primary to-blue-500 shadow-[0_0_10px_rgba(46,91,255,0.3)]" 
            : "bg-[#1A1A1A] border border-white/10"
        )}>
          {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-primary" />}
        </div>

        {/* Bubble */}
        <div className={cn(
          "px-5 py-3.5 shadow-md backdrop-blur-md",
          isUser 
            ? "bg-primary text-white rounded-[24px] rounded-br-[4px] border border-primary-fixed" 
            : "bg-[#1A1A1A]/80 text-gray-200 rounded-[24px] rounded-bl-[4px] border border-white/5 shadow-black/20"
        )}>
          <div className="prose prose-invert prose-p:leading-relaxed prose-sm max-w-none font-['Outfit']">
            {text.split('\n').map((paragraph, i) => (
              <p key={i} className="mb-2 last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
