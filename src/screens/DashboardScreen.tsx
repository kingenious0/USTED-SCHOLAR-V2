import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { Bell, Search, Star, TrendingUp, Zap, Lightbulb, Clock, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function DashboardScreen() {
  const { userState, setScreen, setSelectedFile } = useApp();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const greeting = new Date().getHours() < 12 ? 'Habari za asubuhi' : new Date().getHours() < 17 ? 'Habari za mchana' : 'Habari za jioni';

  useEffect(() => {
    async function fetchCourses() {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .limit(5);
      if (!error && data) setCourses(data);
      setLoading(false);
    }
    fetchCourses();
  }, []);

  const handleCourseClick = (course: any) => {
    setSelectedFile(course);
    setScreen('hub');
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto flex flex-col gap-8 min-h-screen overflow-y-auto relative">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-electric-blue/5 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />

      {/* Header */}
      <header className="flex justify-between items-center relative z-10">
        <div className="welcome-msg">
          <div className="flex items-center gap-2 mb-1">
             <span className="text-[10px] font-black text-electric-blue uppercase tracking-[0.3em]">{greeting}</span>
             <div className="h-1 w-1 rounded-full bg-electric-blue" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white">Jambo, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40">Scholar!</span></h1>
          <p className="text-zinc-500 mt-2 text-sm font-bold uppercase tracking-widest">{userState.programme || 'IT Education'} • LEVEL {userState.level || '300'}</p>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
        <div className="stat-card group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
             <TrendingUp className="w-12 h-12 text-electric-blue" />
          </div>
          <div className="label">Current GPA</div>
          <div className="value">3.85</div>
          <div className="trend text-sunset-orange font-bold text-[10px] uppercase tracking-widest">+0.12 this semester</div>
        </div>
        <div className="stat-card group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
             <Zap className="w-12 h-12 text-sunset-orange" />
          </div>
          <div className="label">Daily Streak</div>
          <div className="value">14 Days</div>
          <div className="trend text-electric-blue font-bold text-[10px] uppercase tracking-widest">Mastery Level: 4</div>
        </div>
        <div className="stat-card group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
             <Star className="w-12 h-12 text-white" />
          </div>
          <div className="label">Academic Progress</div>
          <div className="value">72%</div>
          <div className="trend text-white/40 font-bold text-[10px] uppercase tracking-widest">Target: 90%</div>
        </div>
      </div>

      {/* Active Courses */}
      <section className="course-section relative z-10">
        <h2 className="text-lg font-black mb-6 text-white uppercase tracking-[0.2em] flex items-center gap-3">
          <div className="h-4 w-1 bg-electric-blue rounded-full" />
          Active Modules 
        </h2>
        <div className="flex gap-6 overflow-x-auto pb-6 hide-scrollbar snap-x">
          {loading ? (
            <div className="flex items-center gap-3 text-white/20 font-black uppercase tracking-widest text-xs p-10 bg-white/5 rounded-3xl w-full border border-dashed border-white/10">
              <Loader2 className="w-5 h-5 animate-spin text-electric-blue" />
              Initializing Neural Sync...
            </div>
          ) : courses.map((c, i) => (
            <motion.div 
              key={c.id} 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => handleCourseClick(c)}
              className="min-w-[280px] bg-surface-dark/40 backdrop-blur-md rounded-[2.5rem] overflow-hidden border border-white/5 hover:border-electric-blue/30 transition-all group cursor-pointer hover:-translate-y-2 snap-start shadow-xl"
            >
              <div 
                className="h-36 flex items-center justify-center font-black text-white text-xl tracking-tighter uppercase p-6 text-center relative overflow-hidden"
                style={{ background: i % 3 === 0 ? 'linear-gradient(135deg, #1e3a8a, #3b82f6)' : i % 3 === 1 ? 'linear-gradient(135deg, #7c2d12, #f97316)' : 'linear-gradient(135deg, #064e3b, #10b981)' }}
              >
                {/* Decorative Overlay */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                <span className="relative z-10 drop-shadow-lg">{c.name}</span>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-3">
                  <div className="text-[10px] font-black text-electric-blue uppercase tracking-widest">{c.meta_tag || 'COURSE'}</div>
                  <div className="text-[10px] font-black text-white/20 uppercase tracking-widest">70%</div>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                   <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '70%' }}
                    transition={{ duration: 1, delay: i * 0.2 }}
                    className="h-full bg-gradient-to-r from-sunset-orange to-red-500" 
                   />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

    </div>
  );
}
