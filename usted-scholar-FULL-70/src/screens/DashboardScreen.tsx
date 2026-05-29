import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { Bell, Search, Star, TrendingUp, Zap, Lightbulb, Clock, Loader2, GraduationCap, BookOpen, Flame, Layers, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import ThemeToggle from '../components/theme/ThemeToggle';

export default function DashboardScreen() {
  const { userState, openCourse } = useApp();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [secretClicks, setSecretClicks] = useState(0);

  const greeting = new Date().getHours() < 12 ? 'Habari za asubuhi' : new Date().getHours() < 17 ? 'Habari za mchana' : 'Habari za jioni';

  const handleSecretClick = () => {
    setSecretClicks(prev => prev + 1);
    const timer = setTimeout(() => setSecretClicks(0), 2000);
    if (secretClicks + 1 >= 5) {
      clearTimeout(timer);
      navigate('/admin');
      setSecretClicks(0);
    }
  };

  useEffect(() => {
    async function fetchCourses() {
      let query = supabase.from('courses').select('*').neq('meta_tag', 'L200_S2');

      if (userState.programme) {
        query = query.or(`programme.eq."${userState.programme}",programme.eq.GENERAL,programme.is.null`);
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(12);
      if (!error && data) setCourses(data);
      setLoading(false);
    }
    fetchCourses();
  }, [userState.programme]);

  const sortedCourses = [...courses].sort((a, b) => {
    const aIndex = userState.recentlyOpenedIds?.indexOf(a.id);
    const bIndex = userState.recentlyOpenedIds?.indexOf(b.id);
    const aInRecent = aIndex !== undefined && aIndex !== -1;
    const bInRecent = bIndex !== undefined && bIndex !== -1;

    if (aInRecent && bInRecent) return aIndex - bIndex;
    if (aInRecent) return -1;
    if (bInRecent) return 1;
    return 0;
  });

  const filteredCourses = sortedCourses.filter(c =>
    (c.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.meta_tag || "").toLowerCase().includes(search.toLowerCase())
  );

  const recentCourses = filteredCourses.slice(1, 4);
  const archiveCourses = filteredCourses.slice(4);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300 relative">
      {/* Background Orbs */}
      <div className="fixed top-[-20%] right-[-10%] w-[800px] h-[800px] bg-gradient-to-br from-electric-blue/5 via-blue-500/5 to-transparent blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-sunset-orange/5 via-amber-500/5 to-transparent blur-[150px] rounded-full pointer-events-none" />

      <div className="relative z-10 p-6 pt-20 lg:p-10 max-w-7xl mx-auto pb-28 lg:pb-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-[var(--accent-primary)] uppercase tracking-[0.3em]">{greeting}</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-[var(--text-primary)] leading-none">
              Jambo,{' '}
              <span
                onClick={handleSecretClick}
                className="text-transparent bg-clip-text bg-gradient-to-r from-electric-blue via-blue-500 to-sunset-orange cursor-default select-none active:scale-95 transition-transform inline-block"
              >
                Scholar
              </span>
            </h1>
            <p className="text-[var(--text-tertiary)] mt-2 text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <GraduationCap className="w-3.5 h-3.5" />
              {userState.programme?.replace('B.Sc. ', '').replace('B.Ed. ', '') || 'IT Education'} • LEVEL {userState.level || '300'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group flex-1 md:min-w-[320px]">
              <div className="absolute inset-0 bg-electric-blue/5 blur-xl rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] group-focus-within:text-electric-blue transition-colors relative z-10" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search courses..."
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl py-3.5 pl-11 pr-6 focus:outline-none focus:ring-1 focus:ring-electric-blue/50 text-[var(--text-primary)] relative z-10 transition-all placeholder:text-[var(--text-tertiary)] font-bold text-sm shadow-sm"
              />
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="relative group bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[2rem] p-6 overflow-hidden hover:border-electric-blue/30 transition-all duration-500"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-electric-blue/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-electric-blue to-blue-600 flex items-center justify-center shadow-lg shadow-electric-blue/20">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Academic Path</span>
              </div>
              <p className="text-2xl font-black text-[var(--text-primary)] truncate mb-1" title={userState.programme || 'Not Set'}>
                {userState.programme ? userState.programme.replace('B.Sc. ', '').replace('B.Ed. ', '').replace('2-year Diploma in ', '') : 'Setup Needed'}
              </p>
              <p className="text-xs font-bold text-[var(--accent-secondary)]">Level {userState.level || 'Unknown'}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative group bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[2rem] p-6 overflow-hidden hover:border-sunset-orange/30 transition-all duration-500"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-sunset-orange/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sunset-orange to-amber-600 flex items-center justify-center shadow-lg shadow-sunset-orange/20">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Daily Streak</span>
              </div>
              <p className="text-2xl font-black text-[var(--text-primary)] mb-1">14 Days</p>
              <p className="text-xs font-bold text-electric-blue">Mastery Level: 4</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="relative group bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[2rem] p-6 overflow-hidden hover:border-emerald-500/30 transition-all duration-500"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Progress</span>
              </div>
              <p className="text-2xl font-black text-[var(--text-primary)] mb-1">72%</p>
              <p className="text-xs font-bold text-[var(--text-tertiary)]">Target: 90%</p>
            </div>
          </motion.div>
        </div>

        {/* Hero Section - Jump Back In */}
        {!loading && filteredCourses.length > 0 && !search && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-10"
          >
            <div className="relative group rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-[var(--bg-secondary)] via-[var(--bg-secondary)] to-[var(--bg-primary)] border border-[var(--border-color)] hover:border-electric-blue/30 transition-all duration-500 shadow-2xl shadow-blue-500/5">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-electric-blue/10 to-transparent blur-2xl rounded-full" />
              <div className="relative z-10 flex flex-col lg:flex-row items-stretch">
                <div className="lg:w-80 h-48 lg:h-auto relative overflow-hidden flex-shrink-0">
                  <img
                    src={filteredCourses[0].thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600'}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    alt="Recent Course"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[var(--bg-secondary)] hidden lg:block" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-secondary)] to-transparent lg:hidden" />
                </div>
                <div className="flex-1 p-8 lg:p-10 flex flex-col justify-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-electric-blue/10 rounded-full border border-electric-blue/20 mb-4 w-fit">
                    <Zap className="w-3 h-3 text-electric-blue" />
                    <span className="text-[9px] font-black text-electric-blue uppercase tracking-widest">Continue Learning</span>
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-black text-[var(--text-primary)] uppercase tracking-tight leading-tight mb-3">
                    {filteredCourses[0].name}
                  </h3>
                  <p className="text-[var(--text-secondary)] text-sm mb-6 max-w-lg leading-relaxed">
                    You were last reviewing this module. Your AI tutor has prepared a synthesis to help you resume right where you left off.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      to="/hub"
                      onClick={() => openCourse(filteredCourses[0])}
                      className="px-8 py-3.5 bg-gradient-to-r from-electric-blue to-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all inline-flex items-center gap-2"
                    >
                      Continue <ChevronRight className="w-4 h-4" />
                    </Link>
                    <Link
                      to="/library"
                      className="px-8 py-3.5 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-2xl font-black text-xs uppercase tracking-widest border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition-all"
                    >
                      Library
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Continue Learning */}
        {!loading && recentCourses.length > 0 && !search && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-[0.2em] flex items-center gap-3">
                <div className="h-4 w-1 bg-electric-blue rounded-full" />
                Recently Viewed
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentCourses.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                >
                  <Link
                    to="/hub"
                    onClick={() => openCourse(c)}
                    className="block h-full bg-[var(--bg-secondary)] rounded-[2rem] overflow-hidden border border-[var(--border-color)] hover:border-electric-blue/30 transition-all group shadow-sm hover:shadow-xl hover:-translate-y-0.5 duration-300"
                  >
                    <div className="h-40 relative overflow-hidden">
                      <img
                        src={c.thumbnail_url || `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600`}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        alt={c.name}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-secondary)] via-transparent to-transparent" />
                      <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
                        <span className="text-[9px] font-black text-electric-blue uppercase tracking-widest">{c.meta_tag}</span>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight line-clamp-1 mb-3">{c.name}</h3>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Mastery</span>
                        <span className="text-[9px] font-black text-electric-blue">70%</span>
                      </div>
                      <div className="h-1 bg-[var(--border-color)] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-electric-blue to-blue-500 rounded-full" style={{ width: '70%' }} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Academic Archive */}
        <section className="mb-20 lg:mb-0">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-[0.2em] flex items-center gap-3">
              <div className="h-4 w-1 bg-sunset-orange rounded-full" />
              {search ? `Results (${filteredCourses.length})` : 'Academic Archive'}
            </h2>
            {!search && (
              <div className="text-[9px] font-black text-[var(--text-tertiary)] uppercase tracking-widest bg-[var(--bg-secondary)] px-3 py-1.5 rounded-full border border-[var(--border-color)]">
                {filteredCourses.length} Modules
              </div>
            )}
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 bg-[var(--bg-secondary)] rounded-[2.5rem] border border-dashed border-[var(--border-color)]">
              <div className="relative">
                <div className="absolute inset-0 bg-electric-blue/20 blur-2xl rounded-full animate-pulse" />
                <Loader2 className="w-8 h-8 animate-spin text-electric-blue relative z-10" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Syncing Knowledge Base...</span>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 bg-[var(--bg-secondary)] rounded-[2.5rem] border border-dashed border-[var(--border-color)] text-center px-10">
              <Search className="w-8 h-8 text-[var(--text-tertiary)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)]">No matching modules found</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
              {(search ? filteredCourses : archiveCourses).map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (i % 10) * 0.03 }}
                >
                  <Link
                    to="/hub"
                    onClick={() => openCourse(c)}
                    className="block h-full bg-[var(--bg-secondary)] rounded-[2rem] overflow-hidden border border-[var(--border-color)] hover:border-sunset-orange/30 transition-all group shadow-sm hover:shadow-xl hover:-translate-y-1 duration-300"
                  >
                    <div className="aspect-[3/4] relative overflow-hidden">
                      <img
                        src={c.thumbnail_url || `https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=600`}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        alt={c.name}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)]/95 via-[var(--bg-primary)]/20 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="bg-sunset-orange text-black text-[8px] font-black uppercase px-2 py-0.5 rounded inline-block mb-1.5">
                          {c.meta_tag}
                        </div>
                        <h4 className="text-[var(--text-primary)] text-xs font-black uppercase tracking-tight line-clamp-2 leading-tight">
                          {c.name}
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
    </div>
  );
}
