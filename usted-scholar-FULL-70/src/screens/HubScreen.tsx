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
    <div className="h-[100dvh] lg:h-screen flex flex-col lg:flex-row bg-[var(--bg-primary)] overflow-hidden relative transition-colors duration-300">
      {/* Mobile Top Header Spacer */}
      <div className="h-16 lg:hidden shrink-0" />
      {/* Left: PDF/Document Viewer */}
      <section className="flex-1 flex flex-col min-h-0 border-r border-[var(--border-color)] relative">
        {/* Abstract Background Glow */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-electric-blue/5 blur-[120px] rounded-full pointer-events-none" />

        <header className="p-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-primary)]/50 backdrop-blur-xl sticky top-0 z-30">
           <div className="flex items-center gap-3">
             <div className="bg-[var(--accent-primary)]/10 p-2.5 rounded-xl text-[var(--accent-primary)] hidden sm:block">
               <FileText className="w-5 h-5" />
             </div>
              <div className="max-w-[200px] sm:max-w-md">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[10px] font-black tracking-[0.2em] text-[var(--text-tertiary)] uppercase">Synthesis Link</p>
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <h3 className="text-sm font-black text-[var(--text-primary)] truncate uppercase tracking-tight">{selectedFile?.name || 'Academic Material'}</h3>
              </div>
           </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-[var(--bg-secondary)] rounded-full border border-[var(--border-color)]">
                 <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Confidence: 98%</span>
              </div>
              <Link to="/dashboard" className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
                <X className="w-4 h-4" />
              </Link>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 lg:p-16 scroll-smooth bg-[var(--bg-primary)] custom-scrollbar relative z-10">
           <div className="max-w-3xl mx-auto">
             {isSynthesizing ? (
                <div className="flex flex-col items-center justify-center h-full py-32 space-y-6 text-center">
                  <div className="relative">
                     <div className="absolute inset-0 bg-[var(--accent-primary)]/20 blur-2xl rounded-full animate-pulse" />
                     <Loader2 className="w-12 h-12 text-[var(--accent-primary)] animate-spin relative z-10" />
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
                 className="prose dark:prose-invert prose-lg max-w-none 
                 prose-headings:text-[var(--text-primary)] prose-headings:font-black prose-headings:tracking-tight
                 prose-p:text-[var(--text-secondary)] prose-p:leading-relaxed prose-p:text-lg
                 prose-strong:text-[var(--text-primary)] prose-strong:font-black
                 prose-code:text-[#FFCC22] prose-code:bg-[var(--bg-secondary)] prose-code:px-2 prose-code:py-0.5 prose-code:rounded-md prose-code:font-bold
                 prose-li:text-[var(--text-tertiary)] prose-li:font-medium
                 prose-blockquote:border-l-electric-blue prose-blockquote:bg-electric-blue/5 prose-blockquote:py-1 prose-blockquote:px-6 prose-blockquote:rounded-r-2xl"
               >
                 <ReactMarkdown remarkPlugins={[remarkGfm]}>{synthesis}</ReactMarkdown>
               </motion.div>
             ) : (
                <div className="flex flex-col items-center justify-center h-full py-32 text-center">
                  <div className="w-20 h-20 rounded-[2.5rem] bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center mb-8 rotate-12">
                     <Sparkles className="w-10 h-10 text-[var(--text-tertiary)]/20" />
                  </div>
                  <h4 className="text-xl font-bold text-[var(--text-tertiary)]/40">Awaiting Knowledge Input</h4>
                  <p className="text-xs text-[var(--text-tertiary)] font-bold uppercase tracking-widest mt-2">Select a course from your dashboard to begin</p>
                </div>
             )}
           </div>
        </div>
      </section>

      {/* Right: AI Assistant */}
      <aside className="w-full lg:w-[400px] h-full flex flex-col bg-[var(--bg-secondary)] border-l border-[var(--border-color)] relative z-20 pb-24 lg:pb-0">
          <header className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)] flex items-center justify-center shadow-lg shadow-[var(--accent-primary)]/20">
                <Sparkles className="w-6 h-6 text-white fill-white" />
              </div>
              <div>
                <h4 className="font-extrabold text-[var(--text-primary)] leading-none">Scholar AI</h4>
                <p className="text-[10px] text-[var(--text-tertiary)] font-extrabold uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  Connected to DB
                </p>
              </div>
            </div>
            <Link className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]" to="/dashboard">
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
                      ? 'bg-[var(--accent-primary)] text-white rounded-tr-none shadow-md shadow-[var(--accent-primary)]/10' 
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-tl-none border border-[var(--border-color)] shadow-sm'
                  }`}>
                    {m.role === 'ai' ? (
                      m.text ? (
                        <div className="prose dark:prose-invert prose-sm max-w-none 
                          prose-p:leading-relaxed prose-p:my-1
                          prose-li:my-0.5 prose-strong:text-[var(--text-primary)] prose-strong:font-black text-[var(--text-secondary)]">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                        </div>
                      ) : (
                        <div className="flex gap-1 py-1 px-2">
                           <motion.div 
                             animate={{ opacity: [0.3, 1, 0.3] }} 
                             transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}
                             className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" 
                           />
                           <motion.div 
                             animate={{ opacity: [0.3, 1, 0.3] }} 
                             transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                             className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" 
                           />
                           <motion.div 
                             animate={{ opacity: [0.3, 1, 0.3] }} 
                             transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
                             className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" 
                           />
                        </div>
                      )
                    ) : (
                      <p className="text-sm font-medium leading-relaxed">{m.text}</p>
                    )}
                  </div>
                  <span className="text-[9px] text-[var(--text-tertiary)] mt-1 uppercase font-extrabold tracking-widest">
                    {m.role === 'user' ? 'You • Just now' : 'AI • Just now'}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
         </div>

         <div className="p-6 bg-[var(--bg-primary)] border-t border-[var(--border-color)] space-y-4">
            <div className="grid grid-cols-2 gap-3">
               <button 
                onClick={() => handleSend("Summarize the key concepts of this section in bullet points.")}
                className="py-2.5 px-3 bg-[var(--bg-tertiary)] rounded-xl text-[10px] font-extrabold uppercase tracking-widest text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 transition-all text-center border border-[var(--accent-primary)]/20"
               >
                 Summarize
               </button>
               <Link 
                to="/quiz"
                className="py-2.5 px-3 bg-[var(--bg-tertiary)] rounded-xl text-[10px] font-extrabold uppercase tracking-widest text-[var(--accent-secondary)] hover:bg-[var(--accent-secondary)]/5 transition-all text-center border border-[var(--accent-secondary)]/20"
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
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl py-4 pl-5 pr-14 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]/50 resize-none h-24 placeholder:text-[var(--text-tertiary)]"
              />
              <button 
                onClick={() => handleSend()}
                className="absolute bottom-4 right-4 p-2.5 bg-[var(--accent-primary)] text-white rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[var(--accent-primary)]/20"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
         </div>
      </aside>
    </div>
  );
}
