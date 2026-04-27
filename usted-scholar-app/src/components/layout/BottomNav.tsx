"use client";

import { Home, BookOpen, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-xl border-t border-black/5 dark:border-white/5 px-6 py-3 shadow-[0_-1px_15px_rgba(0,0,0,0.05)]">
      <nav className="flex items-center justify-between max-w-md mx-auto">
        <Link 
          href="/" 
          className={`flex flex-col items-center gap-1 group transition-all ${isActive('/') ? 'text-[#8C033B] dark:text-white' : 'text-gray-400'}`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${isActive('/') ? 'bg-[#8C033B]/10 dark:bg-[#8C033B]/20' : 'group-hover:bg-gray-100 dark:group-hover:bg-white/5'}`}>
            <Home className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
        </Link>

        <Link 
          href="/" 
          className={`flex flex-col items-center gap-1 group transition-all ${pathname.includes('/library') || isActive('/') ? 'text-[#8C033B] dark:text-white' : 'text-gray-400'}`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${isActive('/') ? 'bg-[#8C033B]/10 dark:bg-[#8C033B]/20' : 'group-hover:bg-gray-100 dark:group-hover:bg-white/5'}`}>
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Library</span>
        </Link>

        <Link 
          href="#" 
          className="flex flex-col items-center gap-1 group transition-all text-gray-400"
        >
          <div className="p-1.5 rounded-xl transition-colors group-hover:bg-gray-100 dark:group-hover:bg-white/5">
            <User className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Profile</span>
        </Link>
      </nav>
    </div>
  );
}
