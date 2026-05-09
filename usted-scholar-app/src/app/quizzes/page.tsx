import { GraduationCap, Trophy } from "lucide-react";

export default function QuizzesPage() {
  return (
    <div className="p-8 space-y-10 max-w-7xl mx-auto">
      <header>
        <p className="text-[#FFCC22] text-xs font-black tracking-[0.2em] uppercase mb-2">Performance Center •</p>
        <h1 className="text-4xl font-black tracking-tighter">Quiz <span className="text-[#8C033B]">History</span></h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-12 rounded-3xl bg-white/5 border border-white/5 flex flex-col items-center text-center">
          <Trophy className="w-12 h-12 text-[#FFCC22] mb-6" />
          <h3 className="text-xl font-bold mb-2">Global Ranking</h3>
          <p className="text-gray-500 text-sm mb-6">You are in the top 5% of Level 300 IT students.</p>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
             <div className="w-[85%] h-full bg-gradient-to-r from-[#8C033B] to-[#FFCC22]" />
          </div>
        </div>

        <div className="p-12 rounded-3xl bg-white/5 border border-white/5 flex flex-col items-center text-center justify-center opacity-50">
           <GraduationCap className="w-12 h-12 text-gray-500 mb-4" />
           <p className="text-sm">No recent quiz sessions found.</p>
           <p className="text-xs text-gray-600 mt-1 italic">Complete a course quiz to see your stats here.</p>
        </div>
      </div>
    </div>
  );
}
