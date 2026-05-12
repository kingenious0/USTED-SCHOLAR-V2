import { useApp } from '../context/AppContext';
import { Settings, Shield, Bell, HelpCircle, ChevronRight, User, GraduationCap, Award, Palette, LogOut, Zap, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';

export default function ProfileScreen() {
  const { userState, setUserState } = useApp();
  const navigate = useNavigate();
  const [secretTaps, setSecretTaps] = useState(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleVersionTap = () => {
    const next = secretTaps + 1;
    setSecretTaps(next);
    // Reset tap count after 3 seconds of inactivity
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => setSecretTaps(0), 3000);
    if (next >= 5) {
      clearTimeout(tapTimer.current!);
      setSecretTaps(0);
      navigate('/admin');
    }
  };

  const settingsGroups = [
    {
      title: 'Academic Profile',
      items: [
        { icon: User, label: 'Account Information', desc: 'Personal details and credentials' },
        { icon: GraduationCap, label: 'Course Enrollment', desc: 'Manage your active modules' },
        { icon: Award, label: 'Achievements', desc: 'View your faculty awards' },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { icon: Palette, label: 'Theme Mode', desc: `Current: ${userState.theme === 'dark' ? 'Digital Obsidian' : 'Academic Light'}`, action: () => setUserState({ theme: userState.theme === 'dark' ? 'light' : 'dark' }) },
        { icon: Bell, label: 'Notifications', desc: 'Lecture alerts and quiz reminders' },
        { icon: Shield, label: 'Security', desc: '2FA and access logs' },
      ]
    }
  ];

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto pb-32 lg:pb-10">
      {/* Profile Header */}
      <section className="flex flex-col items-center text-center mb-12">
        <div className="relative mb-6">
          <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="w-32 h-32 rounded-full border-4 border-electric-blue p-1.5"
          >
            <img 
               src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userState.programme}&backgroundColor=0a0a0a`}
               alt="Profile" 
               className="w-full h-full object-cover rounded-full bg-[#1A1A1A]"
            />
          </motion.div>
        </div>
        
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2 leading-none">Chidi Okafor</h2>
        <p className="text-zinc-500 font-medium mb-4">{userState.programme} • Level {userState.level}</p>
        
        <div className="flex gap-4">
           <div className="flex items-center gap-2 px-4 py-1.5 glass-card rounded-full">
              <Flame className="w-4 h-4 text-sunset-orange fill-sunset-orange" />
              <span className="text-xs font-bold text-sunset-orange">14 DAY STREAK</span>
           </div>
           <div className="flex items-center gap-2 px-4 py-1.5 glass-card rounded-full border-electric-blue/20">
              <Zap className="w-4 h-4 text-electric-blue fill-electric-blue" />
              <span className="text-xs font-bold text-electric-blue">RANK #42</span>
           </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
         {[
           { label: 'Academic Path', val: userState.programme ? userState.programme.replace('B.Sc. ', '').replace('B.Ed. ', '').replace('2-year Diploma in ', '').substring(0, 15) + (userState.programme.length > 15 ? '...' : '') : 'Not Set', change: 'L' + (userState.level || 'Unknown') },
           { label: 'Modules Ready', val: '12', change: 'On Track' },
           { label: 'Global Rank', val: 'Top 3%', change: 'Faculty' },
           { label: 'Scholar XP', val: '14,200', change: '+450' }
         ].map((stat, i) => (
           <div key={i} className="bg-surface-dark border border-white/5 p-6 rounded-2xl text-center hover:border-white/10 transition-all cursor-default">
              <p className="text-[10px] font-extrabold text-white/40 uppercase tracking-widest mb-2">{stat.label}</p>
              <p className="text-2xl font-extrabold text-white mb-1 tracking-tight">{stat.val}</p>
              <p className="text-[10px] font-extrabold text-sunset-orange bg-sunset-orange/10 px-2 py-0.5 rounded-full inline-block">{stat.change}</p>
           </div>
         ))}
      </section>

      {/* Settings Sections */}
      <div className="space-y-10">
        {settingsGroups.map((group, i) => (
          <div key={i}>
            <h3 className="text-xs font-extrabold text-[var(--text-tertiary)] uppercase tracking-[0.3em] mb-6 px-2">{group.title}</h3>
            <div className="space-y-2">
              {group.items.map((item, j) => (
                <button
                  key={j}
                  onClick={item.action}
                  className="w-full flex items-center justify-between p-5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl hover:border-[var(--accent-primary)]/30 transition-all group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-tertiary)] group-hover:text-electric-blue transition-colors">
                       <item.icon className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-[var(--text-primary)] transition-colors">{item.label}</p>
                      <p className="text-xs text-[var(--text-tertiary)] font-medium">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[var(--border-color)] group-hover:text-electric-blue transition-colors" />
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="pt-6">
           <button 
            onClick={() => {
              setUserState({ hasCompletedOnboarding: false, programme: undefined, level: undefined, semester: undefined });
              navigate('/');
            }}
            className="w-full flex items-center justify-center gap-3 p-5 rounded-premium bg-red-500/5 border border-red-500/10 text-red-500 font-bold hover:bg-red-500/10 transition-all active:scale-95"
           >
             <LogOut className="w-5 h-5" />
             Log Out & Reset Session
           </button>
           <div className="text-center mt-6" onClick={handleVersionTap}>
             <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest select-none cursor-default">
               USTED Scholar v1.0.4 • Alpha Environment
             </p>
             {/* Secret tap progress — only visible after 2+ taps */}
             <AnimatePresence>
               {secretTaps >= 2 && (
                 <motion.div
                   initial={{ opacity: 0, y: 4 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0 }}
                   className="flex justify-center gap-1 mt-2"
                 >
                   {[1,2,3,4,5].map(i => (
                     <div
                       key={i}
                       className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                         i <= secretTaps ? 'bg-[var(--accent-primary)]' : 'bg-zinc-700'
                       }`}
                     />
                   ))}
                 </motion.div>
               )}
             </AnimatePresence>
           </div>
        </div>
      </div>
    </div>
  );
}
