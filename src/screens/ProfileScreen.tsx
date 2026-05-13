import { useApp } from '../context/AppContext';
import { Shield, Bell, Palette, ChevronRight, LogOut, GraduationCap, BookOpen, CalendarDays, Camera, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';

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
          icon: Palette,
          label: 'Theme Mode',
          desc: `Current: ${userState.theme === 'dark' ? 'Digital Obsidian' : 'Academic Light'}`,
          action: () => setUserState({ theme: userState.theme === 'dark' ? 'light' : 'dark' })
        },
        { icon: Bell,   label: 'Notifications', desc: 'Lecture alerts and quiz reminders', comingSoon: true },
        { icon: Shield, label: 'Security',       desc: '2FA and access logs',              comingSoon: true },
      ]
    }
  ];

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto pb-32 lg:pb-10">

      {/* ── Profile Header ── */}
      <section className="flex flex-col items-center text-center mb-10">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative w-28 h-28 rounded-full border-4 border-electric-blue p-1.5 mb-5 group cursor-pointer"
        >
          <label className="w-full h-full block rounded-full overflow-hidden cursor-pointer relative">
            <img
              src={userState.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userState.name || userState.programme || 'scholar')}&backgroundColor=0a0a0a`}
              alt="Profile avatar"
              className="w-full h-full object-cover bg-[#1A1A1A] transition-all group-hover:brightness-50"
            />
            {/* Hover overlay with camera icon */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-8 h-8 text-white drop-shadow-md" />
            </div>
            {/* Hidden file input */}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </label>
        </motion.div>

        <h1 className="text-3xl font-black text-[var(--text-primary)] leading-none mb-1">
          {userState.name || 'Scholar'}
        </h1>
        <p className="text-sm text-zinc-500 font-medium">
          {userState.programme || 'No programme set'}
        </p>
      </section>

      {/* ── Academic Info Cards ── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-electric-blue/10 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5 text-electric-blue" />
          </div>
          <div>
            <p className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest mb-0.5">Level</p>
            <p className="text-lg font-black text-[var(--text-primary)]">{userState.level ? `Level ${userState.level}` : '—'}</p>
          </div>
        </div>

        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-electric-blue/10 flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5 text-electric-blue" />
          </div>
          <div>
            <p className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest mb-0.5">Semester</p>
            <p className="text-lg font-black text-[var(--text-primary)]">{userState.semester ? `Sem. ${userState.semester}` : '—'}</p>
          </div>
        </div>

        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-electric-blue/10 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-electric-blue" />
          </div>
          <div>
            <p className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest mb-0.5">Status</p>
            <p className="text-lg font-black text-[var(--text-primary)]">Active</p>
          </div>
        </div>
      </section>

      {/* ── Settings ── */}
      <div className="space-y-2 mb-10">
        <h3 className="text-xs font-extrabold text-[var(--text-tertiary)] uppercase tracking-[0.3em] mb-4 px-1">Preferences</h3>
        {settingsGroups[0].items.map((item, j) => (
          <button
            key={j}
            onClick={item.comingSoon ? undefined : item.action}
            disabled={item.comingSoon}
            className={`w-full flex items-center justify-between p-5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl transition-all group ${
              item.comingSoon
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:border-[var(--accent-primary)]/30 active:scale-[0.99]'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-tertiary)] transition-colors ${!item.comingSoon && 'group-hover:text-electric-blue'}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-[var(--text-primary)]">{item.label}</p>
                  {item.comingSoon && (
                    <span className="text-[9px] font-black uppercase tracking-widest bg-zinc-700/60 text-zinc-400 px-2 py-0.5 rounded-full">
                      Coming Soon
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
        ))}
      </div>

      {/* ── Log Out & Reset ── */}
      <div className="space-y-3">
        <button
          onClick={() => {
            setUserState({ isLoggedIn: false });
            navigate('/');
          }}
          className="w-full flex items-center justify-center gap-3 p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] font-bold hover:border-[var(--accent-primary)]/30 transition-all active:scale-95 text-[var(--text-primary)]"
        >
          <LogOut className="w-5 h-5 text-[var(--text-tertiary)]" />
          Log Out
        </button>

        <button
          onClick={() => setShowDeleteModal(true)}
          className="w-full text-center py-2 text-xs font-bold text-red-500/70 hover:text-red-500 transition-colors"
        >
          Delete Local Profile
        </button>
      </div>

      {/* ── Version / Secret Admin Tap ── */}
      <div className="text-center mt-8" onClick={handleVersionTap}>
        <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest select-none cursor-default">
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
                    i <= secretTaps ? 'bg-[var(--accent-primary)]' : 'bg-zinc-700'
                  }`}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Custom Delete Confirmation Modal ── */}
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
                  onClick={() => {
                    setUserState({ hasCompletedOnboarding: false, isLoggedIn: false, name: undefined, programme: undefined, level: undefined, semester: undefined, avatarUrl: undefined });
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
  );
}
