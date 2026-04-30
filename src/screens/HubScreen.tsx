import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Sparkles, FileText, ZoomIn, Search, Maximize2, X, CheckCircle2, Lightbulb, Loader2 } from 'lucide-react';

import { generateSynthesis, streamChat } from '../lib/ai';

export default function HubScreen() {
  const { selectedFile } = useApp();
  const [messages, setMessages] = useState([
    { role: 'ai', text: `Hello Scholar! I've loaded ${selectedFile?.name || 'your notes'}. Would you like a quick summary or a quiz to test your understanding?` }
  ]);
  const [input, setInput] = useState('');
  const [synthesis, setSynthesis] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [errorCooldown, setErrorCooldown] = useState(0);

  const [synthesisStage, setSynthesisStage] = useState('');

  useEffect(() => {
    async function fetchSynthesis() {
      const targetId = selectedFile?.file_id || selectedFile?.id;
      if (!targetId) return;
      
      setIsSynthesizing(true);
      setSynthesisStage('Checking neural cache...');
      try {
        await generateSynthesis(targetId, (text, stage) => {
          if (stage) setSynthesisStage(stage);
          setSynthesis(text);
        });
      } catch (error: any) {
        console.error('Synthesis error:', error);
        if (error.message?.includes('429')) setErrorCooldown(10);
        setSynthesis(`### AI Synthesis Unavailable\n\n${error?.message || 'Check your internet and try again.'}`);
      } finally {
        setIsSynthesizing(false);
      }
    }
    fetchSynthesis();
  }, [selectedFile]);

  useEffect(() => {
    if (errorCooldown > 0) {
      const timer = setTimeout(() => setErrorCooldown(errorCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [errorCooldown]);

  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (text: string = input) => {
    if (typeof text !== 'string' || !text.trim() || isLoading || errorCooldown > 0) return;
    
    const targetId = selectedFile?.file_id || selectedFile?.id;
    const userMsg = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const aiMsgId = Date.now();
      setMessages(prev => [...prev, { role: 'ai', text: '', id: aiMsgId }]);
      setIsLoading(false);

      await streamChat(targetId || '', text, messages, (accumulated) => {
        setMessages(prev => prev.map(m => 
          m.id === aiMsgId ? { ...m, text: accumulated } : m
        ));
      }, synthesis);
    } catch (error: any) {
      console.error('Chat error:', error);
      setIsLoading(false);
      if (error.message?.includes('429')) setErrorCooldown(10);
      setMessages(prev => [...prev, { role: 'ai', text: 'All neural pathways are currently busy. Please wait a moment.' }]);
    }
  };

  return (
    <div className="h-[100dvh] lg:h-screen flex flex-col lg:flex-row bg-[#050505] overflow-hidden relative">
      {/* Mobile Top Header Spacer */}
      <div className="h-16 lg:hidden shrink-0" />
      {/* Left: PDF/Document Viewer */}
      <section className="flex-1 flex flex-col min-h-0 border-r border-white/5 relative">
        {/* Abstract Background Glow */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-electric-blue/5 blur-[120px] rounded-full pointer-events-none" />

        <header className="p-4 border-b border-white/5 flex items-center justify-between bg-[#020202]/50 backdrop-blur-xl sticky top-0 z-30">
           <div className="flex items-center gap-3">
             <div className="bg-[#2E5BFF]/10 p-2.5 rounded-xl text-[#2E5BFF] hidden sm:block">
               <FileText className="w-5 h-5" />
             </div>
             <div className="max-w-[200px] sm:max-w-md">
               <div className="flex items-center gap-2 mb-0.5">
                 <p className="text-[10px] font-black tracking-[0.2em] text-white/30 uppercase">Synthesis Link</p>
                 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
               </div>
               <h3 className="text-sm font-black text-white truncate uppercase tracking-tight">{selectedFile?.name || 'Academic Material'}</h3>
             </div>
           </div>
           <div className="flex items-center gap-3">
             <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Confidence: 98%</span>
             </div>
             <Link to="/dashboard" className="p-2 text-white/40 hover:text-white transition-colors bg-white/5 rounded-lg border border-white/5">
               <X className="w-4 h-4" />
             </Link>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 lg:p-16 scroll-smooth bg-[#050505] custom-scrollbar relative z-10">
           <div className="max-w-3xl mx-auto">
             {isSynthesizing ? (
                <div className="flex flex-col items-center justify-center h-full py-32 space-y-6 text-center">
                  <div className="relative">
                     <div className="absolute inset-0 bg-[#2E5BFF]/20 blur-2xl rounded-full animate-pulse" />
                     <Loader2 className="w-12 h-12 text-[#2E5BFF] animate-spin relative z-10" />
                  </div>
                  <div>
                     <p className="text-sm font-black tracking-[0.2em] text-white uppercase animate-pulse">{synthesisStage || 'Initializing Neural Sync...'}</p>
                     <p className="text-[10px] text-zinc-500 font-bold uppercase mt-2">Mapping conceptual dependencies...</p>
                  </div>
                </div>
             ) : synthesis ? (
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="prose prose-invert prose-lg max-w-none 
                 prose-headings:text-white prose-headings:font-black prose-headings:tracking-tight
                 prose-p:text-zinc-400 prose-p:leading-relaxed prose-p:text-lg
                 prose-strong:text-white prose-strong:font-black
                 prose-code:text-[#FFCC22] prose-code:bg-white/5 prose-code:px-2 prose-code:py-0.5 prose-code:rounded-md prose-code:font-bold
                 prose-li:text-zinc-500 prose-li:font-medium
                 prose-blockquote:border-l-[#2E5BFF] prose-blockquote:bg-[#2E5BFF]/5 prose-blockquote:py-1 prose-blockquote:px-6 prose-blockquote:rounded-r-2xl"
               >
                 <ReactMarkdown remarkPlugins={[remarkGfm]}>{synthesis}</ReactMarkdown>
               </motion.div>
             ) : (
               <div className="flex flex-col items-center justify-center h-full py-32 text-center">
                 <div className="w-20 h-20 rounded-[2.5rem] bg-white/5 border border-white/5 flex items-center justify-center mb-8 rotate-12">
                    <Sparkles className="w-10 h-10 text-white/10" />
                 </div>
                 <h4 className="text-xl font-bold text-white/30">Awaiting Knowledge Input</h4>
                 <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest mt-2">Select a course from your dashboard to begin</p>
               </div>
             )}
           </div>
        </div>
      </section>

      {/* Right: AI Assistant */}
      <aside className="w-full lg:w-[400px] h-full flex flex-col bg-[#020202] border-l border-white/10 relative z-20 pb-24 lg:pb-0">
         <header className="p-6 border-b border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-[#2E5BFF] flex items-center justify-center shadow-lg shadow-[#2E5BFF]/20">
               <Sparkles className="w-6 h-6 text-white fill-white" />
             </div>
             <div>
               <h4 className="font-extrabold text-white leading-none">Scholar AI</h4>
               <p className="text-[10px] text-white/40 font-extrabold uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                 <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                 Connected to DB
               </p>
             </div>
           </div>
           <Link className="text-white/40 hover:text-white" to="/dashboard">
             <X className="w-5 h-5" />
           </Link>
         </header>

         <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            <AnimatePresence>
              {messages.map((m, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                    m.role === 'user' 
                      ? 'bg-[#2E5BFF] text-white rounded-tr-none' 
                      : 'bg-white/5 text-white/80 rounded-tl-none border border-white/5'
                  }`}>
                    {m.role === 'ai' ? (
                      m.text ? (
                        <div className="prose prose-invert prose-sm max-w-none 
                          prose-p:leading-relaxed prose-p:my-1
                          prose-li:my-0.5 prose-strong:text-white prose-strong:font-black">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                        </div>
                      ) : (
                        <div className="flex gap-1 py-1 px-2">
                          <motion.div 
                            animate={{ opacity: [0.3, 1, 0.3] }} 
                            transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}
                            className="w-1.5 h-1.5 rounded-full bg-[#2E5BFF]" 
                          />
                          <motion.div 
                            animate={{ opacity: [0.3, 1, 0.3] }} 
                            transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                            className="w-1.5 h-1.5 rounded-full bg-[#2E5BFF]" 
                          />
                          <motion.div 
                            animate={{ opacity: [0.3, 1, 0.3] }} 
                            transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
                            className="w-1.5 h-1.5 rounded-full bg-[#2E5BFF]" 
                          />
                        </div>
                      )
                    ) : (
                      <p className="text-sm font-medium leading-relaxed">{m.text}</p>
                    )}
                  </div>
                  <span className="text-[9px] text-white/20 mt-1 uppercase font-extrabold tracking-widest">
                    {m.role === 'user' ? 'You • Just now' : 'AI • Just now'}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
         </div>

         <div className="p-6 bg-[#020202] space-y-4">
            <div className="grid grid-cols-2 gap-3">
               <button 
                onClick={() => handleSend("Summarize the key concepts of this section in bullet points.")}
                className="py-2.5 px-3 bg-white/5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest text-[#2E5BFF] hover:bg-[#2E5BFF]/5 transition-all text-center border border-[#2E5BFF]/20"
               >
                 Summarize
               </button>
               <Link 
                to="/quiz"
                className="py-2.5 px-3 bg-white/5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest text-[#FFCC22] hover:bg-[#FFCC22]/5 transition-all text-center border border-[#FFCC22]/20"
               >
                 Quiz Me
               </Link>
            </div>
            
            <div className="relative group">
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                placeholder="Ask and it shall be given unto thee..."
                className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-5 pr-14 text-sm text-white/80 focus:outline-none focus:ring-1 focus:ring-[#2E5BFF]/50 resize-none h-24"
              />
              <button 
                onClick={() => handleSend()}
                className="absolute bottom-4 right-4 p-2.5 bg-[#2E5BFF] text-white rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#2E5BFF]/20"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
         </div>
      </aside>
    </div>
  );
}
