import { useApp } from '../context/AppContext';
import { Shield, Bell, Palette, ChevronRight, LogOut, GraduationCap, BookOpen, CalendarDays, Camera, AlertTriangle, Sparkles, Moon, Sun, User, Mail, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

export default function ProfileScreen() {
  const { userState, setUserState } = useApp();
  const navigate = useNavigate();
  const [secretTaps, setSecretTaps] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserState({ avatarUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVersionTap = () => {
    const next = secretTaps + 1;
    setSecretTaps(next);
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
      title: 'Preferences',
      items: [
        {
          icon: userState.theme === 'dark' ? Moon : Sun,
          label: 'Theme Mode',
          desc: `Switch to ${userState.theme === 'dark' ? 'Light' : 'Dark'} mode`,
          action: () => setUserState({ theme: userState.theme === 'dark' ? 'light' : 'dark' })
        },
        { icon: Bell, label: 'Notifications', desc: 'Lecture alerts and quiz reminders', comingSoon: true },
        { icon: Shield, label: 'Security', desc: '2FA and access logs', comingSoon: true },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300 relative">
      {/* Background Orbs */}
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-bl from-electric-blue/5 to-transparent blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-gradient-to-tr from-sunset-orange/5 to-transparent blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 p-6 lg:p-10 max-w-3xl mx-auto pb-32 lg:pb-10">
        {/* Profile Header */}
        <section className="flex flex-col items-center text-center mb-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-28 h-28 rounded-full bg-gradient-to-br from-electric-blue to-blue-600 p-[3px] mb-5 group cursor-pointer shadow-2xl shadow-electric-blue/20"
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-[#1A1A1A] relative">
              <img
                src={userState.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userState.name || userState.programme || 'scholar')}&backgroundColor=0a0a0a`}
                alt="Profile avatar"
                className="w-full h-full object-cover transition-all group-hover:brightness-50"
              />
              <label className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="w-8 h-8 text-white drop-shadow-md" />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
          </motion.div>

          <h1 className="text-3xl font-black text-[var(--text-primary)] leading-none mb-1">
            {userState.name || 'Scholar'}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] font-medium flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-electric-blue" />
            {userState.programme || 'No programme set'}
          </p>
        </section>

        {/* Academic Info Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-5 flex items-start gap-4 hover:border-electric-blue/30 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-electric-blue to-blue-600 flex items-center justify-center shadow-lg shadow-electric-blue/20 shrink-0">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest mb-0.5">Level</p>
              <p className="text-lg font-black text-[var(--text-primary)]">{userState.level ? `Level ${userState.level}` : '—'}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-5 flex items-start gap-4 hover:border-sunset-orange/30 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sunset-orange to-amber-600 flex items-center justify-center shadow-lg shadow-sunset-orange/20 shrink-0">
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest mb-0.5">Semester</p>
              <p className="text-lg font-black text-[var(--text-primary)]">{userState.semester ? `Sem. ${userState.semester}` : '—'}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-5 flex items-start gap-4 hover:border-emerald-500/30 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest mb-0.5">Status</p>
              <p className="text-lg font-black text-[var(--text-primary)]">Active</p>
            </div>
          </motion.div>
        </section>

        {/* Preferences */}
        <div className="space-y-2 mb-10">
          <h3 className="text-xs font-extrabold text-[var(--text-tertiary)] uppercase tracking-[0.3em] mb-4 px-1">Preferences</h3>
          {settingsGroups[0].items.map((item, j) => (
            <motion.div
              key={j}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + j * 0.05 }}
            >
              <button
                onClick={item.comingSoon ? undefined : item.action}
                disabled={item.comingSoon}
                className={`w-full flex items-center justify-between p-5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl transition-all group ${
                  item.comingSoon
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:border-electric-blue/30 active:scale-[0.99]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${
                    item.label === 'Theme Mode'
                      ? 'from-electric-blue to-blue-600'
                      : 'from-[var(--bg-tertiary)] to-[var(--bg-tertiary)]'
                  } flex items-center justify-center text-white shadow-sm`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-[var(--text-primary)]">{item.label}</p>
                      {item.comingSoon && (
                        <span className="text-[8px] font-black uppercase tracking-widest bg-zinc-700/60 text-zinc-400 px-2 py-0.5 rounded-full">
                          Soon
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-tertiary)] font-medium">{item.desc}</p>
                  </div>
                </div>
                {!item.comingSoon && (
                  <ChevronRight className="w-5 h-5 text-[var(--border-color)] group-hover:text-electric-blue transition-colors" />
                )}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Log Out */}
        <div className="space-y-3">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              setUserState({
                hasCompletedOnboarding: false,
                isLoggedIn: false,
                name: undefined,
                avatarUrl: undefined,
                level: undefined,
                semester: undefined,
                programme: undefined,
                recentlyOpenedIds: []
              });
              navigate('/');
            }}
            className="w-full flex items-center justify-center gap-3 p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] font-bold hover:border-red-500/30 hover:text-red-500 transition-all active:scale-95 text-[var(--text-primary)] group"
          >
            <LogOut className="w-5 h-5 text-[var(--text-tertiary)] group-hover:text-red-500 transition-colors" />
            Log Out
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full text-center py-2 text-xs font-bold text-red-500/50 hover:text-red-500 transition-colors"
          >
            Delete Local Profile
          </button>
        </div>

        {/* Version / Admin Tap */}
        <div className="text-center mt-8" onClick={handleVersionTap}>
          <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest select-none cursor-default flex items-center justify-center gap-2">
            <Sparkles className="w-3 h-3 text-electric-blue/50" />
            V1.0.4 • BETA
          </p>
          <AnimatePresence>
            {secretTaps >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex justify-center gap-1 mt-2"
              >
                {[1, 2, 3, 4, 5].map(i => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                      i <= secretTaps ? 'bg-electric-blue' : 'bg-zinc-700'
                    }`}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Delete Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center"
              >
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-black text-[var(--text-primary)] mb-2">Delete Profile?</h3>
                <p className="text-sm font-medium text-[var(--text-tertiary)] mb-8">
                  This action is permanent. Your name, programme, and local preferences will be completely wiped.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      setUserState({
                        hasCompletedOnboarding: false,
                        isLoggedIn: false,
                        name: undefined,
                        avatarUrl: undefined,
                        level: undefined,
                        semester: undefined,
                        programme: undefined,
                        recentlyOpenedIds: []
                      });
                      navigate('/');
                    }}
                    className="w-full py-4 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    Yes, Delete My Data
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="w-full py-4 rounded-xl font-bold text-[var(--text-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors border border-[var(--border-color)]"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
