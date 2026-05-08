import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { Bell, Search, Star, TrendingUp, Zap, Lightbulb, Clock, Loader2 } from 'lucide-react';
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

  const recentCourses = filteredCourses.slice(0, 2);
  const archiveCourses = filteredCourses.slice(2);

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
          <h1 className="text-4xl font-black tracking-tight text-[var(--text-primary)] transition-colors">
            Jambo, <span 
              onClick={handleSecretClick}
              className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-primary)] to-[var(--accent-secondary)] cursor-default select-none active:scale-95 transition-transform inline-block"
            >
              Scholar!
            </span>
          </h1>
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
      
      {/* SECTION 1: Continue Learning (Horizontal Netflix Scroll) */}
      {!loading && recentCourses.length > 0 && !search && (
        <section className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-[0.2em] flex items-center gap-3">
              <div className="h-4 w-1 bg-[var(--accent-primary)] rounded-full" />
              Continue Learning
            </h2>
          </div>
          
          <div className="flex gap-6 overflow-x-auto pb-6 -mx-6 px-6 no-scrollbar snap-x">
            {recentCourses.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="flex-shrink-0 w-[280px] md:w-[350px] snap-start"
              >
                <Link 
                  to="/hub"
                  onClick={() => openCourse(c)}
                  className="block h-full bg-[var(--bg-secondary)] rounded-[2.5rem] overflow-hidden border border-[var(--border-color)] hover:border-[var(--accent-primary)]/30 transition-all group cursor-pointer shadow-xl relative"
                >
                  <div className="h-44 relative overflow-hidden">
                    <img 
                      src={c.thumbnail_url || `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600`}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      alt={c.name}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-secondary)] via-transparent to-transparent" />
                    <div className="absolute top-4 left-4 px-3 py-1 bg-[var(--bg-secondary)]/80 backdrop-blur-md rounded-full border border-white/10">
                      <span className="text-[9px] font-black text-[var(--accent-primary)] uppercase tracking-widest">{c.meta_tag}</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tighter mb-4 line-clamp-1">{c.name}</h3>
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] font-black text-[var(--text-tertiary)] uppercase">Mastery</span>
                       <span className="text-[10px] font-black text-[var(--accent-primary)]">70%</span>
                    </div>
                    <div className="h-1 bg-[var(--border-color)] rounded-full overflow-hidden">
                       <div className="h-full bg-[var(--accent-primary)]" style={{ width: '70%' }} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 2: Academic Archive (Vertical Grid) */}
      <section className="relative z-10 mb-20 lg:mb-0">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-[0.2em] flex items-center gap-3">
            <div className="h-4 w-1 bg-[var(--accent-secondary)] rounded-full" />
            {search ? `Search Results (${filteredCourses.length})` : 'Academic Archive'}
          </h2>
          {!search && (
            <div className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest bg-[var(--bg-secondary)] px-4 py-2 rounded-full border border-[var(--border-color)]">
              {filteredCourses.length} Modules Total
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 bg-[var(--bg-secondary)] rounded-[3rem] border border-dashed border-[var(--border-color)]">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Syncing Knowledge Base...</span>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 bg-[var(--bg-secondary)] rounded-[3rem] border border-dashed border-[var(--border-color)] text-center px-10">
            <Search className="w-8 h-8 text-[var(--text-tertiary)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)]">No matching modules found in your current path</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-8">
            {(search ? filteredCourses : archiveCourses).map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (i % 10) * 0.05 }}
              >
                <Link 
                  to="/hub"
                  onClick={() => openCourse(c)}
                  className="block h-full bg-[var(--bg-secondary)] rounded-[2rem] overflow-hidden border border-[var(--border-color)] hover:border-[var(--accent-secondary)]/30 transition-all group shadow-sm hover:shadow-xl hover:-translate-y-1 duration-300"
                >
                  <div className="aspect-[3/4] relative overflow-hidden">
                    <img 
                      src={c.thumbnail_url || `https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=600`}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      alt={c.name}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    
                    {/* Level Badge */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-[var(--accent-secondary)] text-black text-[8px] font-black uppercase px-2 py-0.5 rounded-sm inline-block mb-1">
                        {c.meta_tag}
                      </div>
                      <h4 className="text-white text-xs font-black uppercase tracking-tighter line-clamp-2 leading-tight">
                        {c.name}
                      </h4>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
            
            {/* If not searching and we have more, maybe show a "Load More" or just let the grid breathe */}
            {!search && archiveCourses.length === 0 && recentCourses.length > 0 && (
               <div className="col-span-full py-10 text-center opacity-30">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">End of Archive</p>
               </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
