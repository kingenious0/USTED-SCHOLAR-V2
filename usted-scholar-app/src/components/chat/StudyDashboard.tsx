"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PencilLine, Quote, Languages, FileText, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Tab = "summarize" | "annotate" | "cite" | "translate";

const TAB_PROMPTS: Record<Tab, string> = {
  summarize: `Analyze this lecture material. Create a "Study Dashboard" including: 1. A high-level Executive Summary, 2. A list of Key Definitions, 3. 5 Essential Takeaways, and 4. A "Why this matters" section.`,
  annotate: `You are an expert academic annotator. Go through this lecture material and produce rich, insightful annotations. For every major claim, concept, or argument: highlight the core idea, provide a brief critical commentary, and flag anything a student should pay extra attention to for an exam. Use Markdown headers and bullet points. Be thorough.`,
  cite: `Extract all citable sources, references, key authors, and theories mentioned in this lecture material. Format them in a clean, APA-style reference list. If no explicit citations exist, identify the core theories and authors implied by the content and create properly formatted academic citations for them. Group them by topic.`,
  translate: `Translate the core concepts of this lecture material into plain, simple English that a first-year student with no prior knowledge could understand. Avoid all jargon. Use analogies and everyday examples. Structure it with clear headings for each concept. The goal is maximum comprehension, not formality.`,
};

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "annotate", label: "ANNOTATE", icon: <PencilLine className="w-3.5 h-3.5" /> },
  { id: "cite", label: "CITE", icon: <Quote className="w-3.5 h-3.5" /> },
  { id: "translate", label: "TRANSLATE", icon: <Languages className="w-3.5 h-3.5" /> },
  { id: "summarize", label: "SUMMARIZE", icon: <FileText className="w-3.5 h-3.5" /> },
];

export function StudyDashboard({ fileId, title }: { fileId: string; title: string }) {
  const [activeTab, setActiveTab] = useState<Tab>("summarize");
  const [content, setContent] = useState<Partial<Record<Tab, string>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cache = useRef<Partial<Record<Tab, string>>>({});

  const fetchContent = async (tab: Tab) => {
    // Use cache to avoid re-fetching
    if (cache.current[tab]) {
      setContent(prev => ({ ...prev, [tab]: cache.current[tab] }));
      return;
    }

    setLoading(true);
    setError(null);
    setContent(prev => ({ ...prev, [tab]: "" })); 

    try {
      const response = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId, prompt: TAB_PROMPTS[tab] })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate content");
      }

      if (!response.body) throw new Error("No response body stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let lastUpdateTime = Date.now();

      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          accumulated += decoder.decode(value, { stream: true });
          
          const now = Date.now();
          if (now - lastUpdateTime > 50 || done) {
            setContent(prev => ({ ...prev, [tab]: accumulated }));
            lastUpdateTime = now;
          }
        }
      }

      cache.current[tab] = accumulated;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent(activeTab);
  }, [activeTab, fileId]);

  const currentContent = content[activeTab];

  const tabLabels: Record<Tab, string> = {
    summarize: "Chapter Analysis & Breakdown",
    annotate: "Expert Annotations",
    cite: "Reference List & Citations",
    translate: "Plain-English Translation",
  };

  return (
    <div className="w-full h-full relative flex flex-col bg-[#050505] overflow-hidden text-gray-200">
      {/* Top Toolbar */}
      <div className="h-[72px] px-8 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#050505] z-10">
        <div className="flex items-center gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 text-[11px] font-bold tracking-widest px-4 h-[72px] transition-all border-b-2 ${
                activeTab === tab.id
                  ? "text-[#FF8C00] border-[#FF8C00]"
                  : "text-gray-500 border-transparent hover:text-white hover:border-white/20"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-5">
          {/* Reload current tab */}
          <button
            onClick={() => { delete cache.current[activeTab]; fetchContent(activeTab); }}
            disabled={loading}
            className="text-gray-500 hover:text-white transition-colors disabled:opacity-30"
            title="Regenerate"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest opacity-50 font-bold mb-1.5">{title}</div>
              <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="w-[68%] h-full bg-[#1E90FF] rounded-full"></div>
              </div>
            </div>
            <div className="text-xs font-black text-[#1E90FF] leading-tight">
              68%<br /><span className="text-[8px] tracking-widest opacity-80 text-gray-400">READ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-6 sm:px-12 py-8 sm:py-16 relative custom-scrollbar overscroll-contain">
        <div className="max-w-4xl mx-auto w-full">
          <h2 className="text-[#FF8C00] text-xs font-bold tracking-[0.2em] uppercase mb-6">
            {tabLabels[activeTab]}
          </h2>

          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-white/5"></div>
                <div className="absolute inset-0 rounded-full border-4 border-[#1E90FF] border-t-transparent animate-spin"></div>
              </div>
              <p className="text-sm font-bold opacity-60 animate-pulse tracking-widest uppercase">Synthesizing {activeTab}...</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center text-center p-6 border border-red-500/20 rounded-2xl bg-red-500/5 mt-10">
              <h3 className="font-bold text-lg mb-2 text-red-400">Synthesis Failed</h3>
              <p className="text-sm opacity-70 mb-4">{error}</p>
              <button
                onClick={() => { delete cache.current[activeTab]; fetchContent(activeTab); }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-bold transition-all"
              >
                Try Again
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {currentContent && !loading && (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="prose prose-invert prose-p:text-gray-300 prose-p:leading-relaxed prose-headings:font-normal prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-[#FF8C00] prose-h3:text-sm prose-h3:tracking-widest prose-h3:uppercase prose-h3:font-bold prose-a:text-[#1E90FF] prose-strong:text-white max-w-none pb-20"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {currentContent}
                </ReactMarkdown>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
