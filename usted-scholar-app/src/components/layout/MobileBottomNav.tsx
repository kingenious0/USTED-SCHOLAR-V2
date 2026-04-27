"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Library", href: "/library", icon: BookOpen },
  { name: "Profile", href: "/profile", icon: UserCircle },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  // Hide on chat pages
  if (pathname.startsWith("/chat/")) return null;

  return (
    <motion.nav 
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-6 pb-6 pt-4 bg-[#0A0A0A]/80 backdrop-blur-2xl rounded-t-3xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        
        return (
          <Link
            key={item.name}
            href={item.href}
            className="relative flex flex-col items-center justify-center group"
          >
            {isActive && (
              <motion.div 
                layoutId="mobileNavIndicator"
                className="absolute inset-0 bg-primary/10 rounded-2xl -m-2"
                initial={false}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <motion.div
              whileTap={{ scale: 0.9 }}
              className="relative z-10 flex flex-col items-center"
            >
              <item.icon className={cn(
                "w-6 h-6 mb-1 transition-colors", 
                isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-200"
              )} />
              <span className={cn(
                "font-['Outfit'] text-[10px] uppercase tracking-widest font-bold",
                isActive ? "text-primary" : "text-gray-500 group-hover:text-gray-300"
              )}>
                {item.name}
              </span>
            </motion.div>
          </Link>
        );
      })}
    </motion.nav>
  );
}
