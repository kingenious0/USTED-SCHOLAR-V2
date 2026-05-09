import { Sparkles, Construction } from "lucide-react";

export default function AiTutorPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center">
      <div className="w-20 h-20 rounded-3xl bg-[#8C033B]/10 border border-[#8C033B]/20 flex items-center justify-center mb-6">
        <Sparkles className="w-10 h-10 text-[#FFCC22]" />
      </div>
      <h1 className="text-4xl font-black tracking-tighter mb-4">AI Research <span className="text-[#8C033B]">Lab</span></h1>
      <p className="text-gray-400 max-w-md leading-relaxed mb-8">
        The dedicated AI Tutoring Lab is currently under development. Soon, you will be able to cross-reference multiple lecture materials and generate global study guides.
      </p>
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-gray-500">
        <Construction className="w-3.5 h-3.5" />
        COMING SOON
      </div>
    </div>
  );
}
