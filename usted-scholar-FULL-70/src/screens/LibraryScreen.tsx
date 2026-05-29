import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { Search, BookOpen, GraduationCap, ChevronRight, Clock, ArrowRight, Sparkles } from 'lucide-react';
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

        if (userState.level && userState.semester) {
          const metaTag = `L${userState.level}_S${userState.semester}`;
          query = query.eq('meta_tag', metaTag);
        }

        if (userState.programme) {
          const { data, error } = await query
            .or(`programmes.cs.{"${userState.programme}"},programmes.cs.{GENERAL},programme.eq."${userState.programme}",programme.eq.GENERAL,programme.is.null`)
            .order('name', { ascending: true });

          if (error) throw error;
          if (data) { setFiles(data); setLoading(false); return; }
        }

        const { data, error } = await query.order('name', { ascending: true });
        if (!error && data) setFiles(data);
      } catch {
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

  const lastOpened = (userState.recentlyOpenedIds || [])
    .map(id => files.find(f => f.id === id))
    .filter(Boolean)[0] || null;

  const archiveCourses = filteredFiles.filter(f => f.id !== lastOpened?.id);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300 relative">
      {/* Background Orbs */}
      <div className="fixed top-[-15%] right-[-10%] w-[700px] h-[700px] bg-gradient-to-bl from-electric-blue/5 via-blue-500/5 to-transparent blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-15%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-tr from-sunset-orange/5 via-amber-500/5 to-transparent blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 p-6 pt-24 lg:pt-10 lg:p-10 max-w-7xl mx-auto pb-28 lg:pb-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-[10px] font-black text-electric-blue uppercase tracking-[0.4em] mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {greeting}{userState.name ? `, ${userState.name.split(' ')[0]}` : ''}
            </p>
            <h1 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] leading-none tracking-tight uppercase mb-2">
              Scholar{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-blue to-sunset-orange">Library</span>
            </h1>
            <p className="text-[var(--text-tertiary)] font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
              <GraduationCap className="w-3 h-3" />
              {userState.programme
                ? `${userState.programme.replace('B.Sc. ', '').replace('B.Ed. ', '')} • Level ${userState.level || '?'}`
                : 'All Programmes'} • {files.length} Modules
            </p>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative group flex-1 md:min-w-[380px]">
              <div className="absolute inset-0 bg-electric-blue/5 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] group-focus-within:text-electric-blue transition-colors z-10" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search modules..."
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl py-3.5 pl-12 pr-6 focus:outline-none focus:ring-1 focus:ring-electric-blue/50 text-[var(--text-primary)] font-bold shadow-sm transition-all relative z-10 text-sm placeholder:text-[var(--text-tertiary)]"
              />
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Last Opened Hero */}
        {!loading && lastOpened && !search && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4 px-1">
              <Clock className="w-3.5 h-3.5 text-electric-blue" />
              <h2 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-[0.25em]">Pick Up Where You Left Off</h2>
            </div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Link
                to="/hub"
                onClick={() => openCourse(lastOpened)}
                className="flex flex-col md:flex-row items-stretch bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[2rem] overflow-hidden hover:border-electric-blue/40 transition-all group shadow-lg cursor-pointer"
              >
                <div className="md:w-72 h-44 md:h-auto relative overflow-hidden flex-shrink-0">
                  <img
                    src={lastOpened.thumbnail_url || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=600'}
                    alt={lastOpened.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 grayscale-[0.1] group-hover:grayscale-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[var(--bg-secondary)] hidden md:block" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-secondary)] to-transparent md:hidden" />
                </div>
                <div className="flex-1 p-6 md:p-8 flex flex-col justify-center gap-3">
                  <div className="inline-flex">
                    <span className="bg-electric-blue/10 text-electric-blue text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-electric-blue/20">
                      {lastOpened.meta_tag}
                    </span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight leading-tight group-hover:text-electric-blue transition-colors line-clamp-2">
                    {lastOpened.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <BookOpen className="w-4 h-4 text-electric-blue" />
                    <span className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest flex items-center gap-1">
                      Resume <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          </section>
        )}

        {/* Full Archive */}
        <section>
          <div className="flex items-center justify-between mb-6 px-1">
            <div className="flex items-center gap-3">
              <div className="h-4 w-1 bg-sunset-orange rounded-full" />
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
              <div className="relative">
                <div className="absolute inset-0 bg-electric-blue/20 blur-2xl rounded-full animate-pulse" />
                <div className="w-8 h-8 border-2 border-electric-blue border-t-transparent rounded-full animate-spin relative z-10" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-tertiary)]">Indexing Modules...</span>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4 bg-[var(--bg-secondary)] rounded-[2.5rem] border border-dashed border-[var(--border-color)] text-center px-10">
              <Search className="w-8 h-8 text-[var(--text-tertiary)]" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)]">No modules match your query</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
              {(search ? filteredFiles : archiveCourses).map((file, i) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (i % 10) * 0.04 }}
                >
                  <Link
                    to="/hub"
                    onClick={() => openCourse(file)}
                    className="block h-full bg-[var(--bg-secondary)] rounded-[1.75rem] overflow-hidden border border-[var(--border-color)] hover:border-sunset-orange/40 transition-all group shadow-sm hover:shadow-2xl hover:-translate-y-1.5 duration-500"
                  >
                    <div className="aspect-[3/4] relative overflow-hidden">
                      <img
                        src={file.thumbnail_url || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=600'}
                        alt={file.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)]/95 via-[var(--bg-primary)]/20 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="bg-sunset-orange text-black text-[8px] font-black uppercase px-2 py-0.5 rounded inline-block mb-1.5">
                          {file.meta_tag}
                        </div>
                        <h3 className="text-[var(--text-primary)] text-[11px] font-black uppercase tracking-tight line-clamp-2 leading-tight group-hover:text-sunset-orange transition-colors">
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
    </div>
  );
}
