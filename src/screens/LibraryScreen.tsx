import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { Search, ChevronRight, Bookmark, BookOpen, Layers, Zap, Sparkles } from 'lucide-react';
import ThemeToggle from '../components/theme/ThemeToggle';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function LibraryScreen() {
  const { openCourse } = useApp();
  const [files, setFiles] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

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

  const filteredFiles = files.filter(f => 
    (f.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (f.meta_tag || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto bg-[var(--bg-primary)] min-h-screen transition-colors duration-300">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-2 leading-tight">Academic Library</h2>
          <p className="text-[var(--text-tertiary)] font-medium uppercase tracking-widest text-xs font-black">Continue your journey toward mastery •</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)] group-focus-within:text-[#2E5BFF] transition-colors" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search knowledge..."
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl py-3 pl-12 pr-6 focus:outline-none focus:ring-1 focus:ring-[#2E5BFF]/50 text-[var(--text-primary)] font-bold shadow-sm transition-all"
            />
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Netflix Horizontal Scrolls */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6 px-2">
          <h3 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-tight">
            <BookOpen className="w-5 h-5 text-[#2E5BFF]" />
            Continue Learning
          </h3>
          <button className="text-[#2E5BFF] text-xs font-black tracking-widest uppercase hover:underline">View All</button>
        </div>
        
        <div className="flex gap-5 overflow-x-auto pb-6 hide-scrollbar snap-x">
          {loading ? (
            <div className="text-white/20 animate-pulse font-black uppercase tracking-widest text-xs p-10 bg-[#0A0A0A] rounded-3xl w-full border border-dashed border-white/10">Syncing with Cloud...</div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-white/20 font-black uppercase tracking-widest text-xs p-10 bg-[#0A0A0A] rounded-3xl w-full border border-dashed border-white/10 text-center">No results for "{search}"</div>
          ) : filteredFiles.map((file, i) => (
            <Link 
              key={file.id}
              to="/hub"
              onClick={() => openCourse(file)}
              className="flex-none w-[240px] bg-[var(--bg-secondary)] rounded-3xl overflow-hidden group cursor-pointer border border-[var(--border-color)] hover:border-[#2E5BFF]/30 transition-all snap-start shadow-lg"
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="h-[140px] relative overflow-hidden">
                  <img 
                    src={file.thumbnail_url || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=400'}
                    alt={file.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[0.5] group-hover:grayscale-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent opacity-80" />
                  <span className="absolute top-3 left-3 bg-[#2E5BFF]/20 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-black text-[#2E5BFF] uppercase tracking-widest border border-[#2E5BFF]/20">
                    {file.file_type || 'PDF'}
                  </span>
                </div>
                <div className="p-5">
                  <div className="text-[10px] font-black text-[var(--text-tertiary)] uppercase mb-1 truncate tracking-widest">{file.meta_tag || 'COURSE'}</div>
                  <h4 className="text-[14px] font-black text-[var(--text-primary)] mb-4 truncate leading-tight uppercase tracking-tight group-hover:text-[#2E5BFF] transition-colors">{file.name || 'Untitled Course'}</h4>
                  <div className="h-1 bg-[var(--border-color)] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#2E5BFF] to-[#FFCC22]" style={{ width: `70%` }} />
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* Research Tracks Bento */}
      <section>
        <div className="mb-6 px-2">
          <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Layers className="w-5 h-5 text-sunset-orange" />
            Active Program
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 glass-card p-8 rounded-[2rem] flex items-center gap-6 group hover:translate-x-1 transition-all duration-300">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-electric-blue to-[#8C033B] flex items-center justify-center p-px shadow-lg">
                 <div className="w-full h-full bg-[var(--bg-secondary)] rounded-[15px] flex items-center justify-center">
                    <Zap className="w-10 h-10 text-[var(--text-primary)] fill-[var(--text-primary)]" />
                 </div>
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold text-[var(--text-primary)] mb-1">IT Education</h4>
                <p className="text-[var(--text-tertiary)]">Level 300 • Semester 2</p>
              </div>
              <ChevronRight className="w-6 h-6 text-[var(--text-tertiary)] group-hover:text-electric-blue transition-colors" />
            </div>

            <div className="glass-card p-6 rounded-[2rem] flex flex-col justify-center gap-3">
               <div className="flex items-center gap-2 text-[#FFCC22]">
                 <Sparkles className="w-5 h-5 fill-[#FFCC22]" />
                 <span className="text-xs font-bold uppercase tracking-widest">AI Curation</span>
               </div>
               <h4 className="text-lg font-bold text-[var(--text-primary)]">Course Materials</h4>
               <p className="text-xs text-[var(--text-tertiary)] font-medium">{files.length} Courses discovered in your library.</p>
            </div>
        </div>
      </section>
    </div>
  );
}
