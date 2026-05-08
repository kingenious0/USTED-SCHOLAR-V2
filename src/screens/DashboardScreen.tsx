import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { Bell, Search, Star, TrendingUp, Zap, Lightbulb, Clock, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import ThemeToggle from '../components/theme/ThemeToggle';

export default function DashboardScreen() {
  const { userState, openCourse } = useApp();
  const [courses, setCourses] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const greeting = new Date().getHours() < 12 ? 'Habari za asubuhi' : new Date().getHours() < 17 ? 'Habari za mchana' : 'Habari za jioni';

  useEffect(() => {
    async function fetchCourses() {
      // Order by created_at and filter out the duplicate/legacy L200_S2 entry
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .neq('meta_tag', 'L200_S2') // Exclude the legacy duplicate
        .order('created_at', { ascending: false })
        .limit(8);
      if (!error && data) setCourses(data);
      setLoading(false);
    }
    fetchCourses();
  }, []);


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

  return (
    <div className="p-6 pt-20 lg:p-10 max-w-7xl mx-auto flex flex-col gap-10 min-h-screen overflow-y-auto relative pb-28 lg:pb-0 bg-[var(--bg-primary)] transition-colors duration-300">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#2E5BFF]/5 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />

      {/* Header */}
      <header className="flex justify-between items-center relative z-10">
        <div className="welcome-msg">
          <div className="flex items-center gap-2 mb-1">
             <span className="text-[10px] font-black text-[var(--accent-primary)] uppercase tracking-[0.3em]">{greeting}</span>
             <div className="h-1 w-1 rounded-full bg-[var(--accent-primary)]" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-[var(--text-primary)] transition-colors">Jambo, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-primary)] to-[var(--accent-secondary)]">Scholar!</span></h1>
          <p className="text-[var(--text-tertiary)] mt-2 text-xs font-black uppercase tracking-widest">{userState.programme || 'IT Education'} • LEVEL {userState.level || '300'}</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="relative group hidden md:block min-w-[320px]">
            <div className="absolute inset-0 bg-[var(--accent-primary)]/10 blur-xl rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)] group-focus-within:text-[var(--accent-primary)] transition-colors relative z-10" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search academic knowledge..."
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl py-4 pl-12 pr-6 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]/50 text-[var(--text-primary)] relative z-10 transition-all placeholder:text-[var(--text-tertiary)] font-bold text-sm shadow-sm"
            />
          </div>
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Mobile Search Bar */}
      <div className="relative group md:hidden z-10 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search modules..."
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl py-3.5 pl-12 pr-6 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]/50 text-[var(--text-primary)] font-bold text-sm shadow-sm"
          />
        </div>
        <ThemeToggle />
      </div>

      {/* Stats Grid - Professional 3-Column */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
        <div className="stat-card group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
             <TrendingUp className="w-12 h-12 text-[var(--accent-primary)]" />
          </div>
          <div className="label">Current GPA</div>
          <div className="value">3.85</div>
          <div className="text-[var(--accent-secondary)] trend">+0.12 this semester</div>
        </div>
        <div className="stat-card group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
             <Zap className="w-12 h-12 text-[var(--accent-secondary)]" />
          </div>
          <div className="label">Daily Streak</div>
          <div className="value">14 Days</div>
          <div className="text-[var(--accent-primary)] trend">Mastery Level: 4</div>
        </div>
        <div className="stat-card group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
             <Star className="w-12 h-12 text-[var(--text-primary)]" />
          </div>
          <div className="label">Academic Progress</div>
          <div className="value">72%</div>
          <div className="text-[var(--text-tertiary)] trend">Target: 90%</div>
        </div>
      </div>
      
      {/* Hero Section: Continue Learning */}
      {!loading && filteredCourses.length > 0 && (
        <section className="mb-12 relative z-10">
          <div className="bg-gradient-to-r from-[var(--bg-secondary)] to-[var(--bg-primary)] p-1 rounded-[3rem] border border-[var(--border-color)] group hover:border-[var(--accent-primary)]/30 transition-all duration-500 overflow-hidden shadow-2xl shadow-blue-500/5">
            <div className="bg-[var(--bg-secondary)] rounded-[2.8rem] p-8 lg:p-10 flex flex-col lg:flex-row items-center gap-10">
              <div className="w-full lg:w-1/3 aspect-[4/3] rounded-[2.5rem] overflow-hidden relative shadow-2xl group-hover:scale-[1.02] transition-transform duration-700">
                <img 
                  src={filteredCourses[0].thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600'} 
                  className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700"
                  alt="Recent Course"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                   <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">In Progress • 70%</span>
                   </div>
                </div>
              </div>
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--accent-primary)]/10 rounded-full border border-[var(--accent-primary)]/20 mb-6">
                  <Zap className="w-3 h-3 text-[var(--accent-primary)]" />
                  <span className="text-[10px] font-black text-[var(--accent-primary)] uppercase tracking-widest">Jump Back In</span>
                </div>
                <h3 className="text-3xl lg:text-4xl font-black text-[var(--text-primary)] mb-4 uppercase tracking-tighter leading-none">
                  {filteredCourses[0].name}
                </h3>
                <p className="text-[var(--text-secondary)] mb-8 max-w-lg leading-relaxed font-medium">
                  You were last reviewing the core concepts of this module. Your AI Tutor has prepared a quick summary to help you resume.
                </p>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                  <Link 
                    to="/hub"
                    onClick={() => openCourse(filteredCourses[0])}
                    className="px-8 py-4 bg-[var(--accent-primary)] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/25 hover:scale-105 active:scale-95 transition-all"
                  >
                    Continue Synthesis
                  </Link>
                  <Link 
                    to="/library"
                    className="px-8 py-4 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-2xl font-black text-xs uppercase tracking-widest border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition-all"
                  >
                    Library Archive
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Active Modules - Professional Vertical Grid */}
      <section className="course-section relative z-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-[0.2em] flex items-center gap-3">
            <div className="h-4 w-1 bg-[var(--accent-primary)] rounded-full" />
            Recent Activity
          </h2>
          <Link to="/library" className="text-[var(--accent-primary)] text-[10px] font-black uppercase tracking-[0.2em] hover:underline">View All Archive</Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 bg-[var(--bg-secondary)] rounded-[3rem] border border-dashed border-[var(--border-color)]">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Syncing Academic Library...</span>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 bg-[var(--bg-secondary)] rounded-[3rem] border border-dashed border-[var(--border-color)]">
              <Search className="w-8 h-8 text-[var(--text-tertiary)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)]">No matching knowledge paths found</span>
            </div>
          ) : filteredCourses.slice(0, 4).map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link 
                to="/hub"
                onClick={() => openCourse(c)}
                className="block h-full bg-[var(--bg-secondary)] rounded-[2.5rem] overflow-hidden border border-[var(--border-color)] hover:border-[var(--accent-primary)]/30 transition-all group cursor-pointer shadow-lg relative"
              >
                <div 
                  className="h-40 flex flex-col justify-end p-8 relative overflow-hidden transition-all duration-500"
                  style={{ background: i % 4 === 0 ? 'linear-gradient(135deg, #1e3a8a, #2E5BFF)' : i % 4 === 1 ? 'linear-gradient(135deg, #7c2d12, #FFCC22)' : i % 4 === 2 ? 'linear-gradient(135deg, #064e3b, #10b981)' : 'linear-gradient(135deg, #4c1d95, #8b5cf6)' }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700" />
                  <div className="relative z-10">
                    <div className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">{c.meta_tag || 'MODULE'}</div>
                    <h3 className="text-xl font-black text-white leading-tight tracking-tighter uppercase">{c.name}</h3>
                  </div>
                </div>
                <div className="p-8 bg-[var(--bg-secondary)]">
                  <div className="flex justify-between items-center mb-4">
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Active</span>
                     </div>
                     <span className="text-xs font-black text-[var(--text-primary)] tracking-tighter">70%</span>
                  </div>
                  <div className="h-1 bg-[var(--border-color)] rounded-full overflow-hidden">
                     <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: '70%' }}
                       className="h-full bg-[#2E5BFF]" 
                     />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
