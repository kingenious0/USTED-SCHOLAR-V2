import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { Search, ChevronRight, Bookmark, BookOpen, Layers, Zap } from 'lucide-react';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function LibraryScreen() {
  const { setScreen, setSelectedFile } = useApp();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourses() {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('name', { ascending: true });
      
      if (!error && data) setFiles(data);
      setLoading(false);
    }
    fetchCourses();
  }, []);

  const handleFileClick = (file: any) => {
    setSelectedFile(file);
    setScreen('hub');
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-2 leading-tight">Academic Library</h2>
          <p className="text-zinc-500 font-medium">Continue your journey toward mastery.</p>
        </div>
        <div className="relative group min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-electric-blue transition-colors" />
          <input 
            type="text" 
            placeholder="Search knowledge..."
            className="w-full bg-[#1A1A1A] border-white/5 rounded-2xl py-3 pl-12 pr-6 focus:outline-none focus:ring-1 focus:ring-electric-blue/50 text-zinc-300"
          />
        </div>
      </header>

      {/* Netflix Horizontal Scrolls */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6 px-2">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-electric-blue" />
            Continue Learning
          </h3>
          <button className="text-electric-blue text-xs font-bold tracking-widest uppercase hover:underline">View All</button>
        </div>
        
        <div className="flex gap-5 overflow-x-auto pb-6 hide-scrollbar snap-x">
          {loading ? (
            <div className="text-white/20 animate-pulse font-bold uppercase tracking-widest text-xs p-10">Syncing with Cloud...</div>
          ) : files.map((file, i) => (
            <motion.div 
              key={file.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => handleFileClick(file)}
              className="flex-none w-[240px] bg-surface-dark rounded-2xl overflow-hidden group cursor-pointer border border-white/5 hover:border-white/10 transition-all snap-start"
            >
              <div className="h-[120px] relative overflow-hidden">
                <img 
                   src={file.thumbnail_url || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=400'}
                   alt={file.name}
                   className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-dark to-transparent opacity-80" />
                <span className="absolute top-3 left-3 bg-electric-blue/20 backdrop-blur-md px-2 py-1 rounded text-[10px] font-extrabold text-electric-blue uppercase tracking-tighter border border-electric-blue/20">
                  {file.file_type || 'PDF'}
                </span>
              </div>
              <div className="p-4">
                <div className="text-[10px] font-extrabold text-white/40 uppercase mb-1 truncate">{file.meta_tag || file.program || 'Course'}</div>
                <h4 className="text-[14px] font-semibold text-white mb-3 truncate leading-tight uppercase">{file.name || 'Untitled Course'}</h4>
                <div className="progress-bar">
                   <div className="progress-fill" style={{ width: `70%` }} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Research Tracks Bento */}
      <section>
        <div className="mb-6 px-2">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-sunset-orange" />
            Active Program
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="md:col-span-2 glass-card p-8 rounded-[2rem] flex items-center gap-6 group hover:translate-x-1 duration-300">
             <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-electric-blue to-sunset-orange flex items-center justify-center p-px shadow-lg">
                <div className="w-full h-full bg-[#131313] rounded-[15px] flex items-center justify-center">
                   <Zap className="w-10 h-10 text-white fill-white" />
                </div>
             </div>
             <div className="flex-1">
               <h4 className="text-xl font-bold text-white mb-1">IT Education</h4>
               <p className="text-zinc-500">Level 300 • Semester 2</p>
             </div>
             <ChevronRight className="w-6 h-6 text-zinc-800 group-hover:text-electric-blue" />
           </div>

           <div className="glass-card p-6 rounded-[2rem] flex flex-col justify-center gap-3">
              <div className="flex items-center gap-2 text-sunset-orange">
                <Sparkles className="w-5 h-5 fill-sunset-orange" />
                <span className="text-xs font-bold uppercase tracking-widest">AI Curation</span>
              </div>
              <h4 className="text-lg font-bold text-white">Course Materials</h4>
              <p className="text-xs text-zinc-500">{files.length} Courses discovered in your Google Drive.</p>
           </div>
        </div>
      </section>
    </div>
  );
}
