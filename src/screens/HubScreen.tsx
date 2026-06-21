import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Sparkles, FileText, ZoomIn, Search, Maximize2, X, CheckCircle2, Lightbulb, Loader2, Brain, ImagePlus, MessageSquarePlus, Trash2, Menu, RefreshCw, ChevronLeft, BookOpen, Layers, Award } from 'lucide-react';

import { generateSynthesis, streamChat } from '../lib/ai';
import { supabase } from '../lib/supabase';

export default function HubScreen() {
  const { selectedFile, setSelectedFile } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<{role: string, text: string, imageUrl?: string|null, id?: number}[]>([]);
  const [threads, setThreads] = useState<{id: string, title: string}[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [input, setInput] = useState('');
  const [synthesis, setSynthesis] = useState(selectedFile?.synthesis || '');
  const [activeTab, setActiveTab] = useState<'synthesis' | 'chat'>('synthesis');
  const [isSynthesizing, setIsSynthesizing] = useState(!selectedFile?.synthesis);
  const [errorCooldown, setErrorCooldown] = useState(0);
  const [synthesisStage, setSynthesisStage] = useState(selectedFile?.synthesis ? 'Ready' : 'Checking neural cache...');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSyncingThreads, setIsSyncingThreads] = useState(false);
  const [isSyncingMessages, setIsSyncingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isInitializingRef = React.useRef(false);

  // Redirect if no course selected
  useEffect(() => {
    if (!selectedFile && !location.state?.course) {
      navigate('/library', { replace: true });
    }
  }, []);

  // Sync from navigation state
  useEffect(() => {
    if (location.state?.course) {
      setSelectedFile(location.state.course);
    }
  }, [location.state, setSelectedFile]);

  const targetId = selectedFile?.file_id || selectedFile?.id;
  const courseName = selectedFile?.name || 'Academic Knowledge Base';

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

  // Load threads
  useEffect(() => {
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
        } finally {
          setIsSyncingThreads(false);
          isInitializingRef.current = false;
        }
      };

      fetchThreads();
    }
  }, [targetId]);

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

  const switchThread = (newId: string) => {
    setActiveThreadId(newId);
    loadMessages(newId);
  };

  // Auto-name threads
  useEffect(() => {
    if (targetId && activeThreadId && messages.length > 0) {
      const currentThread = threads.find(t => t.id === activeThreadId);
      if (currentThread && currentThread.title.startsWith('Session')) {
        const firstUserMsg = messages.find(m => m.role === 'user');
        if (firstUserMsg && firstUserMsg.text && !(currentThread as any).isGeneratingTitle) {
          setThreads(prev => prev.map(t => t.id === activeThreadId ? { ...t, isGeneratingTitle: true } : t));

          import('../lib/ai').then(({ generateThreadTitle }) => {
            generateThreadTitle(firstUserMsg.text, courseName).then(async (newTitle) => {
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
      if (targetId) {
        try {
          const { error } = await supabase
            .from('chat_threads')
            .delete()
            .eq('id', id);

          if (error) throw error;

          const newThreads = threads.filter(t => t.id !== id);

          if (newThreads.length === 0) {
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
      console.log("🖥️ HubScreen: fetchSynthesis effect triggered. targetId:", targetId);
      if (!targetId) {
        console.warn("🖥️ HubScreen: targetId is empty! Aborting synthesis fetch.");
        return;
      }

      // 1. Direct fast-path check using current state/context
      if (selectedFile?.synthesis) {
        setSynthesis(selectedFile.synthesis);
        setIsSynthesizing(false);
        setSynthesisStage('Ready');
        return;
      }

      setIsSynthesizing(true);
      setSynthesisStage('Checking neural cache...');
      try {
        // 2. Direct database query to fetch cached synthesis BEFORE doing any extraction or AI calling!
        console.log("🖥️ HubScreen: Querying database cache directly for targetId:", targetId);
        const isTargetUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
        let query = supabase.from('courses').select('synthesis, full_text');
        if (isTargetUUID) query = query.or(`id.eq.${targetId},file_id.eq.${targetId}`);
        else query = query.eq('file_id', targetId);
        
        const { data: list, error: dbError } = await query.order('created_at', { ascending: false });
        if (dbError) {
          console.error("🖥️ HubScreen: Cache query error:", dbError);
        }
        
        const latestCourse = list?.[0];
        if (latestCourse?.synthesis) {
          console.log("🖥️ HubScreen: Direct database cache hit! synthesis length:", latestCourse.synthesis.length);
          setSynthesis(latestCourse.synthesis);
          setSynthesisStage('Ready');
          
          // Lock the synthesis and full_text into our client-side state so it bypasses all subsequent reloads
          if (selectedFile) {
            setSelectedFile({ 
              ...selectedFile, 
              synthesis: latestCourse.synthesis,
              full_text: latestCourse.full_text || selectedFile.full_text
            });
          }
          return;
        }

        // 3. Fallback: If no cache exists, only then trigger generateSynthesis cascade
        console.log("🖥️ HubScreen: Cache miss. Dispatching generateSynthesis for targetId:", targetId);
        let finalSynthesis = '';
        await generateSynthesis(targetId, (text, stage) => {
          if (stage) setSynthesisStage(stage);
          setSynthesis(text);
          finalSynthesis = text;
        });
        
        console.log("🖥️ HubScreen: generateSynthesis execution completed successfully!");
        if (finalSynthesis && selectedFile) {
          setSelectedFile({ 
            ...selectedFile, 
            synthesis: finalSynthesis,
            full_text: latestCourse?.full_text || selectedFile.full_text
          });
        }
      } catch (error: any) {
        console.error('🖥️ HubScreen: generateSynthesis CAUGHT ERROR:', error);
        if (error.message?.includes('429')) setErrorCooldown(10);
        setSynthesis(`### AI Synthesis Unavailable\n\n${error?.message || 'Check your internet and try again.'}`);
      } finally {
        setIsSynthesizing(false);
      }
    }
    fetchSynthesis();
  }, [targetId]);

  useEffect(() => {
    if (errorCooldown > 0) {
      const timer = setTimeout(() => setErrorCooldown(errorCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [errorCooldown]);

  const handleSend = async (text: string = input) => {
    if ((!text.trim() && !selectedImage) || isSending || errorCooldown > 0 || !targetId) return;

    const userMsg = { role: 'user', text, imageUrl: imagePreview };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const currentImage = selectedImage;
    setSelectedImage(null);
    setImagePreview(null);
    setIsSending(true);

    try {
      const aiMsgId = Date.now().toString();
      setMessages(prev => [...prev, { role: 'ai', text: '', id: aiMsgId as any }]);

      let finalAiText = '';
      await streamChat(targetId, text, messages, (accumulated) => {
        finalAiText = accumulated;
        setMessages(prev => prev.map(m =>
          m.id === aiMsgId as any ? { ...m, text: accumulated } : m
        ));
      }, synthesis, currentImage);

      if (activeThreadId) {
        await supabase.from('chat_messages').insert([
          { thread_id: activeThreadId, role: 'user', text, image_url: imagePreview },
          { thread_id: activeThreadId, role: 'ai', text: finalAiText }
        ]);
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      if (error.message?.includes('429')) setErrorCooldown(10);
      setMessages(prev => [...prev, { role: 'ai', text: 'All neural pathways are currently busy. Please wait a moment.' }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="h-[100dvh] lg:h-screen flex flex-col lg:flex-row bg-[var(--bg-primary)] overflow-hidden relative transition-colors duration-300">
      {/* Left: Synthesis Panel */}
      <section className={`${activeTab === 'synthesis' ? 'flex-1' : 'flex-none'} lg:flex-1 flex flex-col min-h-0 border-r border-[var(--border-color)] relative transition-all duration-300`}>
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-electric-blue/5 blur-[120px] rounded-full pointer-events-none" />

        {/* Header */}
        <header className="p-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-primary)]/50 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/library" className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] lg:hidden">
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <div className="bg-gradient-to-br from-electric-blue/20 to-blue-600/20 p-2.5 rounded-xl text-electric-blue hidden sm:block">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-[10px] font-black tracking-[0.2em] text-[var(--text-tertiary)] uppercase">Synthesis</p>
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <button
                  onClick={async () => {
                    if (!targetId) return;
                    setSynthesis('');
                    setIsSynthesizing(true);
                    setSynthesisStage('Regenerating...');
                    try {
                      await generateSynthesis(targetId, (text, stage) => {
                        if (stage) setSynthesisStage(stage);
                        setSynthesis(text);
                      }, true);
                    } catch (error: any) {
                      console.error('Re-sync error:', error);
                      setSynthesis(`### AI Synthesis Unavailable\n\n${error?.message || 'Check your internet and try again.'}`);
                    } finally {
                      setIsSynthesizing(false);
                    }
                  }}
                  className="ml-1 p-1 hover:bg-electric-blue/10 rounded-md text-[var(--text-tertiary)] hover:text-electric-blue transition-all flex items-center gap-1 group"
                >
                  <RefreshCw className="w-2.5 h-2.5 group-active:rotate-180 transition-transform" />
                  <span className="text-[8px] font-black uppercase tracking-widest hidden sm:inline">Re-Sync</span>
                </button>
              </div>
              <h3 className="text-sm font-black text-[var(--text-primary)] truncate uppercase tracking-tight">{courseName}</h3>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-[var(--bg-secondary)] rounded-full border border-[var(--border-color)]">
              <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">AI: 98%</span>
            </div>
            {activeTab === 'chat' && (
              <button onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors rounded-lg lg:hidden bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                <Menu className="w-4 h-4" />
              </button>
            )}
            {/* Focus Mode Toggle (Desktop only) */}
            <button
              onClick={() => setIsFocusMode(!isFocusMode)}
              className={`p-2 transition-all rounded-lg border border-[var(--border-color)] hidden lg:flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${isFocusMode ? 'bg-electric-blue text-white shadow-lg shadow-electric-blue/20' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]'}`}
              title={isFocusMode ? 'Exit Focus Mode' : 'Enter Focus Mode'}
            >
              {isFocusMode ? (
                <>
                  <Maximize2 className="w-3.5 h-3.5 rotate-180 text-white" />
                  <span>Exit Focus</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Focus Mode</span>
                </>
              )}
            </button>

            <Link to="/library" className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
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
            <button onClick={() => setActiveTab('synthesis')}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest relative z-10 transition-colors ${activeTab === 'synthesis' ? 'text-electric-blue' : 'text-[var(--text-tertiary)]'}`}>
              Synthesis
            </button>
            <button onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest relative z-10 transition-colors ${activeTab === 'chat' ? 'text-electric-blue' : 'text-[var(--text-tertiary)]'}`}>
              AI Assistant
            </button>
          </div>
        </div>

        {/* Synthesis Content */}
        <div className={`flex-1 overflow-y-auto p-6 lg:p-12 scroll-smooth bg-[var(--bg-primary)] custom-scrollbar relative z-10 ${activeTab === 'chat' ? 'hidden lg:block' : 'block'}`}>
          <div className="max-w-3xl mx-auto">
            {isSynthesizing && !synthesis ? (
              <div className="flex flex-col items-center justify-center h-full py-32 space-y-6 text-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-electric-blue/20 blur-2xl rounded-full animate-pulse" />
                  <Loader2 className="w-12 h-12 text-electric-blue animate-spin relative z-10" />
                </div>
                <div>
                  <p className="text-sm font-black tracking-[0.2em] text-white uppercase animate-pulse">{synthesisStage || 'Initializing...'}</p>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase mt-2">Processing document</p>
                </div>
              </div>
            ) : synthesis ? (
              <div className="space-y-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="prose dark:prose-invert prose-lg max-w-none
                  prose-headings:text-[var(--text-primary)] prose-headings:font-black prose-headings:tracking-tight
                  prose-p:text-[var(--text-secondary)] prose-p:leading-relaxed prose-p:text-lg
                  prose-strong:text-[var(--text-primary)] prose-strong:font-black
                  prose-code:text-gold prose-code:bg-[var(--bg-secondary)] prose-code:px-2 prose-code:py-0.5 prose-code:rounded-md prose-code:font-bold
                  prose-li:text-[var(--text-tertiary)] prose-li:font-medium
                  prose-blockquote:border-l-electric-blue prose-blockquote:bg-electric-blue/5 prose-blockquote:py-1 prose-blockquote:px-6 prose-blockquote:rounded-r-2xl"
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{synthesis}</ReactMarkdown>
                </motion.div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-32 text-center">
                <div className="w-20 h-20 rounded-[2.5rem] bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center mb-6">
                  <Sparkles className="w-10 h-10 text-[var(--text-tertiary)]/20" />
                </div>
                <h4 className="text-xl font-bold text-[var(--text-tertiary)]/40">Awaiting Knowledge Input</h4>
                <p className="text-xs text-[var(--text-tertiary)] font-bold uppercase tracking-widest mt-2">Select a course from your dashboard to begin</p>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Study Center Toolbar (Fitts's Law Cards) */}
        {synthesis && (
          <div className="p-4 bg-[var(--bg-primary)] border-t border-[var(--border-color)] relative z-30">
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
              <div className="hidden md:block">
                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Study Center</h4>
                <p className="text-[8px] text-zinc-500 font-bold uppercase mt-0.5">Academic Toolkit</p>
              </div>
              <div className="flex-1 flex gap-3">
                {/* Summary Button */}
                <button
                  onClick={() => {
                    setActiveTab('chat');
                    handleSend("Summarize the key concepts of this section in bullet points.");
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:scale-[1.02] active:scale-[0.98] transition-all hover:bg-electric-blue/5 hover:border-electric-blue/20 group cursor-pointer flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-4 h-4 text-electric-blue group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-primary)]">Summary</span>
                </button>

                {/* Flashcard Deck Button */}
                <Link
                  to="/flashcards"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:scale-[1.02] active:scale-[0.98] transition-all hover:bg-sunset-orange/5 hover:border-sunset-orange/20 group cursor-pointer flex items-center justify-center gap-2"
                >
                  <Layers className="w-4 h-4 text-sunset-orange group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-primary)]">Flashcards</span>
                </Link>

                {/* Quiz Button */}
                <Link
                  to="/quiz"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:scale-[1.02] active:scale-[0.98] transition-all hover:bg-emerald-500/5 hover:border-emerald-500/20 group cursor-pointer flex items-center justify-center gap-2"
                >
                  <Award className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-primary)]">Take Quiz</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Right: AI Assistant */}
      <aside className={`w-full lg:w-[420px] ${activeTab === 'chat' ? 'flex-1' : 'flex-none'} lg:flex-none min-h-0 lg:h-full flex flex-col bg-[var(--bg-secondary)] border-l border-[var(--border-color)] relative z-20 pb-24 lg:pb-0 ${activeTab === 'synthesis' ? 'hidden lg:flex' : 'flex'} ${isFocusMode ? 'lg:hidden' : ''}`}>
        {/* Desktop Header */}
        <header className="p-5 border-b border-[var(--border-color)] hidden lg:flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-electric-blue to-blue-600 flex items-center justify-center shadow-lg shadow-electric-blue/20">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-extrabold text-[var(--text-primary)] leading-none text-sm">Scholar AI</h4>
              <p className="text-[10px] text-[var(--text-tertiary)] font-extrabold uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isSyncingThreads || isSyncingMessages ? 'bg-amber-500 animate-spin' : 'bg-emerald-500 animate-pulse'}`} />
                {isSyncingThreads || isSyncingMessages ? 'Syncing...' : 'Ready'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={activeThreadId}
              onChange={(e) => switchThread(e.target.value)}
              className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-2 py-1.5 text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-wider max-w-[180px] lg:max-w-[220px] truncate outline-none focus:ring-1 focus:ring-electric-blue cursor-pointer"
            >
              {threads.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
            <button onClick={deleteThread} className="text-[var(--text-tertiary)] hover:bg-red-500/10 hover:text-red-500 transition-colors p-1.5 rounded-lg" title="Delete Session">
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={startNewChat} className="bg-electric-blue/10 text-electric-blue hover:bg-electric-blue hover:text-white transition-colors p-1.5 rounded-lg" title="New Session">
              <MessageSquarePlus className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Mobile Drawer */}
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
                <h4 className="font-extrabold text-[var(--text-primary)] text-xl">History</h4>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-[var(--text-tertiary)] hover:bg-[var(--bg-secondary)] rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 border-b border-[var(--border-color)]">
                <button onClick={() => { startNewChat(); setIsMobileMenuOpen(false); }}
                  className="w-full py-4 bg-gradient-to-r from-electric-blue to-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-electric-blue/20 active:scale-95 transition-all">
                  <MessageSquarePlus className="w-5 h-5" />
                  New Session
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {threads.map(t => (
                  <div key={t.id}
                    className={`w-full text-left p-4 rounded-2xl border flex items-center justify-between group transition-all ${
                      activeThreadId === t.id
                        ? 'bg-electric-blue/10 border-electric-blue/30 text-electric-blue'
                        : 'bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]'
                    }`}
                  >
                    <button onClick={() => { switchThread(t.id); setIsMobileMenuOpen(false); }}
                      className="flex-1 font-bold text-sm truncate pr-2 text-left">
                      {t.title}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteThreadById(t.id); }}
                      className="p-2 text-[var(--text-tertiary)] hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overlay */}
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

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar relative z-10">
          <AnimatePresence>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-electric-blue/20 to-blue-600/20 flex items-center justify-center mb-4">
                  <Brain className="w-7 h-7 text-electric-blue" />
                </div>
                <p className="text-sm font-bold text-[var(--text-tertiary)]">Start a conversation</p>
                <p className="text-[10px] text-[var(--text-tertiary)] font-medium mt-1">Ask anything about your course</p>
              </div>
            )}
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className={`max-w-[88%] px-4 py-3 rounded-2xl ${
                  m.role === 'user'
                    ? 'bg-gradient-to-br from-electric-blue to-blue-600 text-white rounded-tr-none shadow-md shadow-electric-blue/10'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-tl-none border border-[var(--border-color)] shadow-sm'
                }`}>
                  {m.imageUrl && (
                    <img src={m.imageUrl} alt="Upload" className="max-w-full h-auto rounded-lg mb-2 object-cover max-h-48" />
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
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}
                          className="w-1.5 h-1.5 rounded-full bg-electric-blue" />
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                          className="w-1.5 h-1.5 rounded-full bg-electric-blue" />
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
                          className="w-1.5 h-1.5 rounded-full bg-electric-blue" />
                      </div>
                    )
                  ) : (
                    <p className="text-sm font-medium leading-relaxed">{m.text}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Input */}
        <div className="p-4 bg-[var(--bg-primary)] border-t border-[var(--border-color)] space-y-3">

          <div className="relative group">
            {imagePreview && (
              <div className="absolute bottom-full mb-2 left-0 w-32 h-32 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] shadow-lg overflow-hidden group">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                  className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full hover:bg-black/70">
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
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-3 pl-12 pr-12 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-electric-blue/30 resize-none h-12 min-h-[48px] max-h-32 placeholder:text-[var(--text-tertiary)] custom-scrollbar transition-all"
            />
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageSelect} />
            <button onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-1.5 left-1.5 p-2 text-[var(--text-tertiary)] hover:text-electric-blue transition-colors rounded-lg hover:bg-electric-blue/10">
              <ImagePlus className="w-4 h-4" />
            </button>
            <button onClick={() => handleSend()}
              className="absolute bottom-1.5 right-1.5 p-2 bg-gradient-to-r from-electric-blue to-blue-600 text-white rounded-lg hover:scale-105 active:scale-95 transition-all shadow-lg shadow-electric-blue/20">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
