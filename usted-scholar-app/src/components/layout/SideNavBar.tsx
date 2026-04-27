"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, UserCircle, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Library", href: "/library", icon: BookOpen },
  { name: "Profile", href: "/profile", icon: UserCircle },
];

export function SideNavBar() {
  const pathname = usePathname();

  return (
    <motion.aside 
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="hidden md:flex flex-col fixed left-0 top-0 w-64 z-40 bg-[#0A0A0A]/95 backdrop-blur-2xl h-screen border-r border-white/5 rounded-r-3xl shadow-[5px_0_30px_rgba(0,0,0,0.5)]"
    >
      <div className="p-8">
        <h2 className="text-2xl font-black tracking-tighter text-white font-['Outfit']">USTED</h2>
        <p className="text-xs text-primary/70 font-medium font-['Outfit'] tracking-wider uppercase mt-1">Tech-Modern Learning</p>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className="relative block"
            >
              {isActive && (
                <motion.div 
                  layoutId="activeNavIndicator"
                  className="absolute inset-0 bg-primary/10 border-l-4 border-primary rounded-xl"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <div className={cn(
                "relative flex items-center gap-3 px-4 py-3.5 rounded-xl font-['Outfit'] font-medium text-sm transition-colors z-10",
                isActive ? "text-primary" : "text-gray-500 hover:text-gray-200 hover:bg-white/5"
              )}>
                <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-gray-500")} />
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 mt-auto">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="relative overflow-hidden bg-gradient-to-br from-blue-600/20 to-purple-900/20 p-5 rounded-2xl border border-white/10 group"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/20 blur-2xl rounded-full group-hover:bg-primary/40 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Rocket className="w-4 h-4 text-primary" />
              <p className="text-white text-sm font-bold">Premium AI Access</p>
            </div>
            <p className="text-white/60 text-xs mb-4 leading-relaxed">Unlock advanced research tools and deep AI tutoring sessions.</p>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full py-2.5 bg-white text-black rounded-lg text-xs font-bold shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-shadow hover:shadow-[0_0_25px_rgba(255,255,255,0.5)]"
            >
              Upgrade Now
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.aside>
  );
}
