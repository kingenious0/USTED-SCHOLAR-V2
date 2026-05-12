import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { Search, BookOpen } from 'lucide-react';
import ThemeToggle from '../components/theme/ThemeToggle';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function LibraryScreen() {
  const { userState, openCourse } = useApp();
  const [files, setFiles] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const greeting = new Date().getHours() < 12
    ? 'Good Morning'
    : new Date().getHours() < 17
    ? 'Good Afternoon'
    : 'Good Evening';

  useEffect(() => {
    async function fetchCourses() {
      try {
        let query = supabase.from('courses').select('*');

        // Filter by level + semester using meta_tag (always available)
        if (userState.level && userState.semester) {
          const metaTag = `L${userState.level}_S${userState.semester}`;
          query = query.eq('meta_tag', metaTag);
        }

        if (userState.programme) {
          // Use new array column with contains — matches if programme is in the array OR GENERAL is in the array
          const { data, error } = await query
            .or(`programmes.cs.{"${userState.programme}"},programmes.cs.{GENERAL},programme.eq."${userState.programme}",programme.eq.GENERAL,programme.is.null`)
            .order('name', { ascending: true });

          if (error) throw error;
          if (data) { setFiles(data); setLoading(false); return; }
        }

        // Fallback: just level+semester filter, no programme filter
        const { data, error } = await query.order('name', { ascending: true });
        if (!error && data) setFiles(data);
      } catch {
        // Final fallback — no filters at all, show everything
        const { data } = await supabase.from('courses').select('*').order('name', { ascending: true });
        if (data) setFiles(data);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, [userState.programme, userState.level, userState.semester]);

  const filteredFiles = files.filter(f =>
    (f.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (f.meta_tag || '').toLowerCase().includes(search.toLowerCase())
  );

  // Last Opened — just the single most recently opened course
  const lastOpened = (userState.recentlyOpenedIds || [])
    .map(id => files.find(f => f.id === id))
    .filter(Boolean)[0] || null;

  // Everything (including previously recent ones) goes in the Archive
  const archiveCourses = filteredFiles.filter(f => f.id !== lastOpened?.id);

  return (
    <div className="p-6 pt-24 lg:pt-10 lg:p-10 max-w-7xl mx-auto bg-[var(--bg-primary)] min-h-screen transition-colors duration-300 relative pb-28 lg:pb-10">

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 relative z-10">
        <div>
          <p className="text-[10px] font-black text-[var(--accent-primary)] uppercase tracking-[0.4em] mb-1">{greeting}</p>
          <h1 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] leading-none tracking-tighter uppercase mb-2">
            Scholar <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]">Library</span>
          </h1>
          <p className="text-[var(--text-tertiary)] font-bold uppercase tracking-widest text-[10px]">
            {userState.programme
              ? `${userState.programme.replace('B.Sc. ', '').replace('B.Ed. ', '')} • Level ${userState.level || '?'}`
              : 'All Programmes'} • {files.length} Modules
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative group flex-1 md:min-w-[380px]">
            <div className="absolute inset-0 bg-[var(--accent-primary)]/5 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] group-focus-within:text-[var(--accent-primary)] transition-colors z-10" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search modules..."
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl py-4 pl-12 pr-6 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]/50 text-[var(--text-primary)] font-bold shadow-sm transition-all relative z-10 text-sm placeholder:text-[var(--text-tertiary)]"
            />
          </div>
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* SECTION 1: Last Opened — single hero banner */}
      {!loading && lastOpened && !search && (
        <section className="mb-12 relative z-10">
          <div className="flex items-center gap-3 mb-4 px-1">
            <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
            <h2 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-[0.25em]">Last Opened</h2>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link
              to="/hub"
              onClick={() => openCourse(lastOpened)}
              className="flex flex-col md:flex-row items-stretch bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[2rem] overflow-hidden hover:border-[var(--accent-primary)]/40 transition-all group shadow-lg cursor-pointer"
            >
              {/* Thumbnail */}
              <div className="md:w-64 h-40 md:h-auto relative overflow-hidden flex-shrink-0">
                <img
                  src={lastOpened.thumbnail_url || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=600'}
                  alt={lastOpened.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 grayscale-[0.15] group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[var(--bg-secondary)] hidden md:block" />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-secondary)] to-transparent md:hidden" />
              </div>

              {/* Info */}
              <div className="flex-1 p-6 md:p-8 flex flex-col justify-center gap-3">
                <div className="inline-flex">
                  <span className="bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-[var(--accent-primary)]/20">
                    {lastOpened.meta_tag}
                  </span>
                </div>
                <h3 className="text-lg md:text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight leading-tight group-hover:text-[var(--accent-primary)] transition-colors line-clamp-2">
                  {lastOpened.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <BookOpen className="w-4 h-4 text-[var(--accent-primary)]" />
                  <span className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Resume where you left off →</span>
                </div>
              </div>
            </Link>
          </motion.div>
        </section>
      )}

      {/* SECTION 2: Full Academic Archive */}
      <section className="relative z-10">
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[var(--accent-secondary)]" />
            <h2 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-[0.25em]">
              {search ? `${filteredFiles.length} Results Found` : 'Academic Archive'}
            </h2>
          </div>
          {!search && (
            <span className="hidden md:block text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">A–Z Order</span>
          )}
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4 bg-[var(--bg-secondary)] rounded-[2.5rem] border border-dashed border-[var(--border-color)]">
            <div className="w-7 h-7 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-tertiary)]">Indexing Modules...</span>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4 bg-[var(--bg-secondary)] rounded-[2.5rem] border border-dashed border-[var(--border-color)] text-center px-10">
            <Search className="w-8 h-8 text-[var(--text-tertiary)]" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)]">No modules match your query</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {(search ? filteredFiles : archiveCourses).map((file, i) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (i % 10) * 0.05 }}
              >
                <Link
                  to="/hub"
                  onClick={() => openCourse(file)}
                  className="block h-full bg-[var(--bg-secondary)] rounded-[1.75rem] overflow-hidden border border-[var(--border-color)] hover:border-[var(--accent-secondary)]/40 transition-all group shadow-sm hover:shadow-2xl hover:-translate-y-1.5 duration-500"
                >
                  <div className="aspect-[3/4] relative overflow-hidden">
                    <img
                      src={file.thumbnail_url || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=600'}
                      alt={file.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)]/95 via-[var(--bg-primary)]/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-[var(--accent-secondary)] text-black text-[8px] font-black uppercase px-2 py-0.5 rounded inline-block mb-1.5">
                        {file.meta_tag}
                      </div>
                      <h3 className="text-[var(--text-primary)] text-[11px] font-black uppercase tracking-tight line-clamp-2 leading-tight group-hover:text-[var(--accent-secondary)] transition-colors">
                        {file.name}
                      </h3>
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
