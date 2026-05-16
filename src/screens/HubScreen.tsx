import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Sparkles, FileText, ZoomIn, Search, Maximize2, X, CheckCircle2, Lightbulb, Loader2, Brain, ImagePlus, MessageSquarePlus, Trash2, Menu, RefreshCw } from 'lucide-react';

import { generateSynthesis, streamChat } from '../lib/ai';
import { supabase } from '../lib/supabase';

export default function HubScreen() {
  const { selectedFile, setSelectedFile } = useApp();
  const location = useLocation();
  const [messages, setMessages] = useState<{role: string, text: string, imageUrl?: string|null, id?: number}[]>([]);
  const [threads, setThreads] = useState<{id: string, title: string}[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [input, setInput] = useState('');
  const [synthesis, setSynthesis] = useState('');
  const [activeTab, setActiveTab] = useState<'synthesis' | 'chat'>('synthesis');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [errorCooldown, setErrorCooldown] = useState(0);
  const [synthesisStage, setSynthesisStage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSyncingThreads, setIsSyncingThreads] = useState(false);
  const [isSyncingMessages, setIsSyncingMessages] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isInitializingRef = React.useRef(false);

  // Sync from navigation state if provided (Handshake Fix)
  useEffect(() => {
    console.log("HubScreen Mount Check - SelectedFile:", selectedFile);
    console.log("HubScreen Navigation State:", location.state);
    
    if (location.state?.course) {
      console.log("Restoring course from Navigation State:", location.state.course);
      setSelectedFile(location.state.course);
    } else if (selectedFile) {
      console.log("Continuing with Context File:", selectedFile);
    }
  }, [location.state, setSelectedFile]);

  // Handle Header and Initial Sync
  // Force a re-render if selectedFile is found in context
  const targetId = selectedFile?.file_id || selectedFile?.id;
  const courseName = selectedFile?.name || "Academic Knowledge Base";

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          if (file.size > 5 * 1024 * 1024) {
            alert('Image must be less than 5MB');
            return;
          }
          setSelectedImage(file);
          const reader = new FileReader();
          reader.onloadend = () => setImagePreview(reader.result as string);
          reader.readAsDataURL(file);
          e.preventDefault();
          break;
        }
      }
    }
  };

  // 1. Load threads for the course from Supabase
  useEffect(() => {
    const targetId = selectedFile?.file_id || selectedFile?.id;
    if (targetId) {
      const fetchThreads = async () => {
        if (isInitializingRef.current) return;
        isInitializingRef.current = true;
        setIsSyncingThreads(true);
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) return;

          let { data: dbThreads, error } = await supabase
            .from('chat_threads')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('file_id', targetId)
            .order('created_at', { ascending: true });

          if (error) throw error;

          if (!dbThreads || dbThreads.length === 0) {
            let retryCount = 0;
            let lastCreateError: any = null;
            
            while (retryCount < 3) {
              const { data: newThread, error: createError } = await supabase
                .from('chat_threads')
                .insert([{ user_id: session.user.id, file_id: targetId, title: 'Session 1' }])
                .select()
                .single();

              if (!createError) {
                dbThreads = [newThread];
                break;
              }

              lastCreateError = createError;
              if (createError.code === '23505') {
                 const { data: refetch } = await supabase.from('chat_threads').select('*').eq('user_id', session.user.id).eq('file_id', targetId);
                 dbThreads = refetch;
                 break;
              } else if (createError.code === '23503') {
                // Wait for profile sync
                console.warn("Identity sync in progress, retrying in 1s...");
                await new Promise(r => setTimeout(r, 1000));
                retryCount++;
              } else {
                throw createError;
              }
            }

            if (!dbThreads && lastCreateError) throw lastCreateError;
          }

          if (dbThreads && dbThreads.length > 0) {
            setThreads(dbThreads);
            const lastThreadId = dbThreads[dbThreads.length - 1].id;
            setActiveThreadId(lastThreadId);
            loadMessages(lastThreadId);
          }
        } catch (err) {
          console.error('Error fetching threads:', err);
          // Fallback to localStorage if DB fails? No, better to let user know.
        } finally {
          setIsSyncingThreads(false);
          isInitializingRef.current = false;
        }
      };
      
      fetchThreads();
    }
  }, [selectedFile]);

  const loadMessages = async (threadId: string) => {
    setIsSyncingMessages(true);
    try {
      const { data: dbMessages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (dbMessages && dbMessages.length > 0) {
        setMessages(dbMessages.map(m => ({
          role: m.role,
          text: m.text,
          imageUrl: m.image_url,
          id: m.id
        })));
      } else {
        setMessages([{ role: 'ai', text: `Hello Scholar! I've loaded ${selectedFile?.name || 'your notes'}. Would you like a quick summary or a quiz to test your understanding?` }]);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setIsSyncingMessages(false);
    }
  };

  // Synchronous thread switching
  const switchThread = (newId: string) => {
    setActiveThreadId(newId);
    loadMessages(newId);
  };

  // 3. Auto-name the thread
  useEffect(() => {
    const targetId = selectedFile?.file_id || selectedFile?.id;
    if (targetId && activeThreadId && messages.length > 0) {
      const currentThread = threads.find(t => t.id === activeThreadId);
      if (currentThread && currentThread.title.startsWith('Session')) {
        const firstUserMsg = messages.find(m => m.role === 'user');
        // @ts-ignore - we add isGeneratingTitle dynamically to prevent loops
        if (firstUserMsg && firstUserMsg.text && !currentThread.isGeneratingTitle) {
          
          setThreads(prev => prev.map(t => t.id === activeThreadId ? { ...t, isGeneratingTitle: true } : t));
          
          import('../lib/ai').then(({ generateThreadTitle }) => {
            generateThreadTitle(firstUserMsg.text).then(async (newTitle) => {
              // Update title in DB
              const { error } = await supabase
                .from('chat_threads')
                .update({ title: newTitle })
                .eq('id', activeThreadId);

              if (!error) {
                setThreads(prev => prev.map(t => 
                  t.id === activeThreadId ? { ...t, title: newTitle, isGeneratingTitle: undefined } : t
                ));
              }
            });
          });
        }
      }
    }
  }, [messages]); 

  const startNewChat = async () => {
    const targetId = selectedFile?.file_id || selectedFile?.id;
    if (targetId) {
      setIsSyncingThreads(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data: newThread, error } = await supabase
          .from('chat_threads')
          .insert({
            user_id: session.user.id,
            file_id: targetId,
            title: `Session ${threads.length + 1}`
          })
          .select()
          .single();

        if (error) throw error;

        setThreads(prev => [...prev, newThread]);
        setActiveThreadId(newThread.id);
        setMessages([{ role: 'ai', text: `Hello Scholar! I've loaded ${selectedFile?.name || 'your notes'}. Would you like a quick summary or a quiz to test your understanding?` }]);
      } catch (err) {
        console.error('Error starting new chat:', err);
      } finally {
        setIsSyncingThreads(false);
      }
    }
  };

  const deleteThreadById = async (id: string) => {
    if (window.confirm("Delete this session permanently?")) {
      const targetId = selectedFile?.file_id || selectedFile?.id;
      if (targetId) {
        try {
          const { error } = await supabase
            .from('chat_threads')
            .delete()
            .eq('id', id);

          if (error) throw error;

          const newThreads = threads.filter(t => t.id !== id);
          
          if (newThreads.length === 0) {
            // Re-fetch to trigger initial thread creation
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              const { data: newThread } = await supabase
                .from('chat_threads')
                .insert({ user_id: session.user.id, file_id: targetId, title: 'Session 1' })
                .select()
                .single();
              
              if (newThread) {
                setThreads([newThread]);
                switchThread(newThread.id);
              }
            }
          } else {
            setThreads(newThreads);
            if (activeThreadId === id) {
              switchThread(newThreads[newThreads.length - 1].id);
            }
          }
        } catch (err) {
          console.error('Error deleting thread:', err);
        }
      }
    }
  };

  const deleteThread = () => deleteThreadById(activeThreadId);

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
    if ((!text.trim() && !selectedImage) || isLoading || errorCooldown > 0) return;
    
    const targetId = selectedFile?.file_id || selectedFile?.id;
    const userMsg = { role: 'user', text, imageUrl: imagePreview };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const currentImage = selectedImage;
    setSelectedImage(null);
    setImagePreview(null);
    setIsLoading(true);

    try {
      const aiMsgId = Date.now().toString(); // Temporary local ID
      setMessages(prev => [...prev, { role: 'ai', text: '', id: aiMsgId as any }]);
      setIsLoading(false);

      let finalAiText = '';
      await streamChat(targetId || '', text, messages, (accumulated) => {
        finalAiText = accumulated;
        setMessages(prev => prev.map(m => 
          m.id === aiMsgId as any ? { ...m, text: accumulated } : m
        ));
      }, synthesis, currentImage);

      // Save both messages to DB
      if (activeThreadId) {
        await supabase.from('chat_messages').insert([
          { thread_id: activeThreadId, role: 'user', text, image_url: imagePreview },
          { thread_id: activeThreadId, role: 'ai', text: finalAiText }
        ]);
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      setIsLoading(false);
      if (error.message?.includes('429')) setErrorCooldown(10);
      setMessages(prev => [...prev, { role: 'ai', text: 'All neural pathways are currently busy. Please wait a moment.' }]);
    }
  };

  return (
    <div className="h-[100dvh] lg:h-screen flex flex-col lg:flex-row bg-[var(--bg-primary)] overflow-hidden relative transition-colors duration-300">
      {/* Left: PDF/Document Viewer */}
      <section className={`${activeTab === 'synthesis' ? 'flex-1' : 'flex-none'} flex flex-col min-h-0 border-r border-[var(--border-color)] relative transition-all duration-300`}>
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
                  <button 
                    onClick={() => {
                      if (!selectedFile) return;
                      setSynthesis('');
                      setSynthesisStage('Regenerating neural link...');
                      // @ts-ignore
                      generateSynthesis(selectedFile.id, (text, stage) => {
                        if (stage) setSynthesisStage(stage);
                        setSynthesis(text);
                      }, true);
                    }}
                    className="ml-1 p-1 hover:bg-[var(--accent-primary)]/10 rounded-md text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-all flex items-center gap-1 group"
                  >
                    <RefreshCw className="w-2.5 h-2.5 group-active:rotate-180 transition-transform" />
                    <span className="text-[8px] font-black uppercase tracking-widest hidden sm:inline">Re-Sync</span>
                  </button>
                </div>
                <h3 className="text-sm font-black text-[var(--text-primary)] truncate uppercase tracking-tight">{selectedFile?.name || 'Academic Material'}</h3>
              </div>
           </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-[var(--bg-secondary)] rounded-full border border-[var(--border-color)]">
                 <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Confidence: 98%</span>
              </div>
              {activeTab === 'chat' && (
                <button 
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="p-2 text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors rounded-lg lg:hidden bg-[var(--bg-secondary)] border border-[var(--border-color)]"
                >
                  <Menu className="w-4 h-4" />
                </button>
              )}
              <Link to="/dashboard" className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
                <X className="w-4 h-4" />
              </Link>
            </div>
        </header>

        {/* Mobile Tab Switcher */}
        <div className="flex lg:hidden bg-[var(--bg-secondary)] border-b border-[var(--border-color)] p-2 sticky top-0 z-40">
           <div className="flex w-full bg-[var(--bg-tertiary)] rounded-xl p-1 relative">
              <motion.div 
                className="absolute top-1 bottom-1 bg-[var(--bg-primary)] rounded-lg shadow-sm border border-[var(--border-color)]"
                initial={false}
                animate={{ 
                  left: activeTab === 'synthesis' ? '4px' : '50%',
                  width: 'calc(50% - 4px)'
                }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              />
              <button 
                onClick={() => setActiveTab('synthesis')}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest relative z-10 transition-colors ${activeTab === 'synthesis' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-tertiary)]'}`}
              >
                Synthesis
              </button>
              <button 
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest relative z-10 transition-colors ${activeTab === 'chat' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-tertiary)]'}`}
              >
                AI Assistant
              </button>
           </div>
        </div>

        <div className={`flex-1 overflow-y-auto p-8 lg:p-16 scroll-smooth bg-[var(--bg-primary)] custom-scrollbar relative z-10 ${activeTab === 'chat' ? 'hidden lg:block' : 'block'}`}>
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
      <aside className={`w-full lg:w-[400px] ${activeTab === 'chat' ? 'flex-1' : 'flex-none'} min-h-0 lg:h-full flex flex-col bg-[var(--bg-secondary)] border-l border-[var(--border-color)] relative z-20 pb-24 lg:pb-0 ${activeTab === 'synthesis' ? 'hidden lg:flex' : 'flex'}`}>
          <header className="p-6 border-b border-[var(--border-color)] hidden lg:flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)] flex items-center justify-center shadow-lg shadow-[var(--accent-primary)]/20">
                <Sparkles className="w-6 h-6 text-white fill-white" />
              </div>
              <div>
                <h4 className="font-extrabold text-[var(--text-primary)] leading-none">Scholar AI</h4>
                <p className="text-[10px] text-[var(--text-tertiary)] font-extrabold uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isSyncingThreads || isSyncingMessages ? 'bg-amber-500 animate-spin' : 'bg-blue-500 animate-pulse'}`} />
                  {isSyncingThreads || isSyncingMessages ? 'Syncing...' : 'Connected to DB'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select 
                value={activeThreadId}
                onChange={(e) => switchThread(e.target.value)}
                className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-2 py-1.5 text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-wider max-w-[120px] truncate outline-none focus:ring-1 focus:ring-[var(--accent-primary)] cursor-pointer"
              >
                {threads.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
              <button onClick={deleteThread} className="text-[var(--text-tertiary)] hover:bg-red-500/10 hover:text-red-500 transition-colors p-1.5 rounded-lg" title="Delete Session">
                <Trash2 className="w-4 h-4" />
              </button>
              <button onClick={startNewChat} className="bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white transition-colors p-1.5 rounded-lg" title="New Session">
                <MessageSquarePlus className="w-4 h-4" />
              </button>
              <Link className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1 ml-2" to="/dashboard">
                <X className="w-5 h-5" />
              </Link>
            </div>
          </header>

          {/* Mobile Chat Controls Drawer */}
          <AnimatePresence>
            {isMobileMenuOpen && activeTab === 'chat' && (
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
                className="fixed inset-y-0 left-0 w-[85%] max-w-[320px] bg-[var(--bg-secondary)] border-r border-[var(--border-color)] z-[100] flex flex-col shadow-2xl lg:hidden"
              >
                <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-primary)] pt-12">
                  <h4 className="font-extrabold text-[var(--text-primary)] text-xl">Chat History</h4>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-[var(--text-tertiary)] hover:bg-[var(--bg-secondary)] rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-4 border-b border-[var(--border-color)]">
                  <button 
                    onClick={() => { startNewChat(); setIsMobileMenuOpen(false); }} 
                    className="w-full py-4 bg-[var(--accent-primary)] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[var(--accent-primary)]/20 active:scale-95 transition-all"
                  >
                    <MessageSquarePlus className="w-5 h-5" />
                    New Session
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {threads.map(t => (
                    <div 
                      key={t.id} 
                      className={`w-full text-left p-4 rounded-2xl border flex items-center justify-between group transition-all ${
                        activeThreadId === t.id 
                          ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/30 text-[var(--accent-primary)]' 
                          : 'bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]'
                      }`}
                    >
                      <button 
                        onClick={() => { switchThread(t.id); setIsMobileMenuOpen(false); }}
                        className="flex-1 font-bold text-sm truncate pr-2 text-left"
                      >
                        {t.title}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteThreadById(t.id); }}
                        className="p-2 text-[var(--text-tertiary)] hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Overlay to dismiss drawer */}
          <AnimatePresence>
             {isMobileMenuOpen && activeTab === 'chat' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="fixed inset-0 bg-black/60 z-[90] lg:hidden backdrop-blur-sm cursor-pointer"
                />
             )}
          </AnimatePresence>

         <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar relative z-10">
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
                    {m.imageUrl && (
                      <img src={m.imageUrl} alt="Uploaded reference" className="max-w-full h-auto rounded-lg mb-2 object-cover max-h-48" />
                    )}
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
          <div className="p-4 bg-[var(--bg-primary)] border-t border-[var(--border-color)] space-y-3">
            <div className="grid grid-cols-3 gap-2">
               <button 
                onClick={() => handleSend("Summarize the key concepts of this section in bullet points.")}
                className="py-1.5 px-2 bg-[var(--bg-tertiary)] rounded-lg text-[9px] font-black uppercase tracking-widest text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 transition-all text-center border border-[var(--accent-primary)]/10"
               >
                 Summary
               </button>
               <Link 
                to="/flashcards"
                className="py-1.5 px-2 bg-[var(--bg-tertiary)] rounded-lg text-[9px] font-black uppercase tracking-widest text-[var(--accent-secondary)] hover:bg-[var(--accent-secondary)]/5 transition-all text-center border border-[var(--accent-secondary)]/10"
               >
                 Deck
               </Link>
               <Link 
                to="/quiz"
                className="py-1.5 px-2 bg-[var(--bg-tertiary)] rounded-lg text-[9px] font-black uppercase tracking-widest text-emerald-500 hover:bg-emerald-500/5 transition-all text-center border border-emerald-500/10"
               >
                 Quiz
               </Link>
            </div>
            
            <div className="relative group">
              {imagePreview && (
                <div className="absolute bottom-full mb-2 left-0 w-32 h-32 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] shadow-lg overflow-hidden group">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button onClick={() => { setSelectedImage(null); setImagePreview(null); }} className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full hover:bg-black/70">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                onPaste={handlePaste}
                placeholder="Ask or upload an image..."
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-3 pl-12 pr-12 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]/30 resize-none h-12 min-h-[48px] max-h-32 placeholder:text-[var(--text-tertiary)] custom-scrollbar transition-all"
              />
              <input 
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageSelect}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1.5 left-1.5 p-2 text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors rounded-lg hover:bg-[var(--accent-primary)]/10"
              >
                <ImagePlus className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleSend()}
                className="absolute bottom-1.5 right-1.5 p-2 bg-[var(--accent-primary)] text-white rounded-lg hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[var(--accent-primary)]/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
         </div>
      </aside>
    </div>
  );
}
