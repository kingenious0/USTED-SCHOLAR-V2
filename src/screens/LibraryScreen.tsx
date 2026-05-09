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

  const recentFiles = filteredFiles.slice(0, 2);
  const archiveFiles = filteredFiles.slice(2);

  return (
    <div className="p-6 pt-24 lg:pt-10 lg:p-10 max-w-7xl mx-auto bg-[var(--bg-primary)] min-h-screen transition-colors duration-300 relative pb-28 lg:pb-10">
      {/* Header with Search */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-1 w-8 bg-[var(--accent-primary)] rounded-full" />
            <span className="text-[10px] font-black text-[var(--accent-primary)] uppercase tracking-[0.4em]">Resource Hub</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-[var(--text-primary)] mb-2 leading-none tracking-tighter uppercase">Academic <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]">Library</span></h2>
          <p className="text-[var(--text-tertiary)] font-bold uppercase tracking-widest text-[10px]">Level {files[0]?.level || '300'} • {files.length} Modules Discovered</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative group flex-1 md:min-w-[400px]">
            <div className="absolute inset-0 bg-[var(--accent-primary)]/5 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)] group-focus-within:text-[var(--accent-primary)] transition-colors relative z-10" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search knowledge paths..."
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[1.5rem] py-5 pl-14 pr-6 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]/50 text-[var(--text-primary)] font-bold shadow-sm transition-all relative z-10 text-sm placeholder:text-[var(--text-tertiary)]"
            />
          </div>
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* SECTION 1: Continue Learning (Horizontal) */}
      {!loading && recentFiles.length > 0 && !search && (
        <section className="mb-16 relative z-10">
          <div className="flex items-center justify-between mb-8 px-2">
            <h3 className="text-sm font-black text-[var(--text-primary)] flex items-center gap-3 uppercase tracking-[0.2em]">
              <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
              Continue Learning
            </h3>
          </div>
          
          <div className="flex gap-6 overflow-x-auto pb-6 -mx-6 px-6 no-scrollbar snap-x">
            {recentFiles.map((file, i) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex-shrink-0 w-[280px] md:w-[320px] snap-start"
              >
                <Link 
                  to="/hub"
                  onClick={() => openCourse(file)}
                  className="block h-full bg-[var(--bg-secondary)] rounded-[2.5rem] overflow-hidden border border-[var(--border-color)] hover:border-[var(--accent-primary)]/30 transition-all group cursor-pointer shadow-xl relative"
                >
                  <div className="h-44 relative overflow-hidden">
                    <img 
                      src={file.thumbnail_url || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=400'}
                      alt={file.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[0.3] group-hover:grayscale-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-secondary)] to-transparent" />
                    <div className="absolute top-4 left-4 bg-[var(--bg-primary)]/80 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black text-[var(--accent-primary)] uppercase tracking-widest border border-[var(--border-color)]">
                      {file.meta_tag}
                    </div>
                  </div>
                  <div className="p-6">
                    <h4 className="text-md font-black text-[var(--text-primary)] mb-4 line-clamp-1 uppercase tracking-tight group-hover:text-[var(--accent-primary)] transition-colors">{file.name}</h4>
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[9px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Progress</span>
                       <span className="text-[9px] font-black text-[var(--accent-primary)] tracking-widest">72%</span>
                    </div>
                    <div className="h-1 bg-[var(--border-color)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--accent-primary)]" style={{ width: `72%` }} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 2: Academic Archive (Vertical Grid) */}
      <section className="relative z-10">
        <div className="flex items-center justify-between mb-8 px-2">
          <h3 className="text-sm font-black text-[var(--text-primary)] flex items-center gap-3 uppercase tracking-[0.2em]">
            <div className="w-2 h-2 rounded-full bg-[var(--accent-secondary)]" />
            {search ? `Found ${filteredFiles.length} Matches` : 'Academic Archive'}
          </h3>
          {!search && (
            <div className="hidden md:flex items-center gap-4 text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">
              <span>All Modules</span>
              <div className="w-1 h-1 rounded-full bg-[var(--border-color)]" />
              <span>A-Z Order</span>
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 bg-[var(--bg-secondary)] rounded-[3rem] border border-dashed border-[var(--border-color)]">
            <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Indexing Modules...</span>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 bg-[var(--bg-secondary)] rounded-[3rem] border border-dashed border-[var(--border-color)] text-center px-10">
            <Search className="w-8 h-8 text-[var(--text-tertiary)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)]">No modules match your query</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-8">
            {(search ? filteredFiles : archiveFiles).map((file, i) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (i % 10) * 0.05 }}
              >
                <Link 
                  to="/hub"
                  onClick={() => openCourse(file)}
                  className="block h-full bg-[var(--bg-secondary)] rounded-[2rem] overflow-hidden border border-[var(--border-color)] hover:border-[var(--accent-secondary)]/30 transition-all group shadow-sm hover:shadow-2xl hover:-translate-y-2 duration-500"
                >
                  <div className="aspect-[3/4] relative overflow-hidden">
                    <img 
                      src={file.thumbnail_url || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=600'}
                      alt={file.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)]/90 via-[var(--bg-primary)]/20 to-transparent" />
                    
                    <div className="absolute bottom-5 left-5 right-5">
                      <div className="bg-[var(--accent-secondary)] text-black text-[8px] font-black uppercase px-2 py-0.5 rounded-sm inline-block mb-2">
                        {file.meta_tag}
                      </div>
                      <h4 className="text-[var(--text-primary)] text-xs font-black uppercase tracking-tighter line-clamp-2 leading-tight group-hover:text-[var(--accent-secondary)] transition-colors">
                        {file.name}
                      </h4>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
