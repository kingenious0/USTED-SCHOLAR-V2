import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ChevronRight, GraduationCap, ArrowRight, X, Mail, Loader2 } from 'lucide-react';
import { ACADEMIC_DATA } from '../lib/academicData';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function OnboardingScreen() {
  const { userState, setUserState } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [checking, setChecking] = useState(false);
  const [nameInput, setNameInput] = useState(userState.name || '');
  
  const [selections, setSelections] = useState({
    programme: userState.programme || '',
    level: userState.level || '',
    semester: userState.semester || ''
  });

  const levels = [
    { val: '100', label: 'Freshman' },
    { val: '200', label: 'Sophomore' },
    { val: '300', label: 'Junior' },
    { val: '400', label: 'Senior' },
  ];

  const handleComplete = () => {
    setUserState({
      hasCompletedOnboarding: true,
      isLoggedIn: true,
      name: nameInput.trim(),
      programme: selections.programme as any,
      level: selections.level as any,
      semester: selections.semester as any
    });
    navigate('/library');
  };

  // Check live DB — if any courses exist for this programme, it's ready
  const handleConfirmPath = async () => {
    if (!selections.programme) return;
    setChecking(true);
    try {
      const { count } = await supabase
        .from('courses')
        .select('id', { count: 'exact', head: true })
        .or(`programmes.cs.{"${selections.programme}"},programme.eq.${selections.programme}`);

      if (count && count > 0) {
        setStep(2);
      } else {
        // Also allow if programme is marked isReady in code (for IT/Cyber before column exists)
        const programData = ACADEMIC_DATA.programs.find(p => p.name === selections.programme);
        if (programData?.isReady) {
          setStep(2);
        } else {
          setShowWaitlist(true);
        }
      }
    } catch {
      // DB error — fall back to isReady flag
      const programData = ACADEMIC_DATA.programs.find(p => p.name === selections.programme);
      if (programData?.isReady) {
        setStep(2);
      } else {
        setShowWaitlist(true);
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
        {/* Background Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-electric-blue/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sunset-orange/10 rounded-full blur-[120px]" />

        <div className="w-full max-w-2xl relative z-10">
          <AnimatePresence mode="wait">
            {/* STEP 0 — Name */}
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="mb-10 text-center md:text-left">
                  <p className="text-[10px] font-black text-[var(--accent-primary)] uppercase tracking-[0.4em] mb-3">Step 1 of 3</p>
                  <h2 className="text-4xl font-black text-[var(--text-primary)] mb-3 leading-tight">What's your name?</h2>
                  <p className="text-[var(--text-tertiary)]">We'll personalise your Scholar workspace just for you.</p>
                </div>

                <div className="mb-10">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && nameInput.trim() && setStep(1)}
                    placeholder="e.g. Kwame Mensah"
                    autoFocus
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl py-5 px-6 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all text-lg font-bold text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]/40"
                  />
                </div>

                <button
                  disabled={!nameInput.trim()}
                  onClick={() => setStep(1)}
                  className="w-full py-5 bg-electric-blue text-white rounded-premium font-bold text-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-2"
                >
                  Continue <ChevronRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            {/* STEP 1 — Programme */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="mb-10 text-center md:text-left">
                  <p className="text-[10px] font-black text-[var(--accent-primary)] uppercase tracking-[0.4em] mb-3">Step 2 of 3</p>
                  <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
                    {nameInput ? `Hey ${nameInput.split(' ')[0]}, select your path` : 'Select Your Path'}
                  </h2>
                  <p className="text-[var(--text-tertiary)]">Tell us your Programme of Study to calibrate your AI workspace.</p>
                </div>

                <div className="mb-10">
                  <select
                    value={selections.programme}
                    onChange={(e) => setSelections(prev => ({ ...prev, programme: e.target.value }))}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl py-5 px-6 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all text-sm font-bold appearance-none cursor-pointer custom-scrollbar text-[var(--text-primary)]"
                    style={{ height: '70px' }}
                  >
                    <option value="" disabled>Choose your specific programme...</option>
                    {ACADEMIC_DATA.departments.map(dept => (
                      <optgroup key={dept} label={dept} className="bg-[var(--bg-primary)] text-[var(--text-secondary)] font-black text-xs uppercase tracking-widest mt-4">
                        {ACADEMIC_DATA.programs.filter(p => p.dept === dept).map(p => (
                          <option key={p.name} value={p.name} className="text-[var(--text-primary)] font-medium text-sm normal-case py-2">
                            {p.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <button
                  disabled={!selections.programme || checking}
                  onClick={handleConfirmPath}
                  className="w-full py-5 bg-electric-blue text-white rounded-premium font-bold text-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-2"
                >
                  {checking ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Checking availability...</>
                  ) : (
                    <>Confirm Path <ChevronRight className="w-5 h-5" /></>
                  )}
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="mb-10">
                  <div className="flex justify-between items-end mb-4">
                     <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">Step 3 of 3</p>
                     <p className="text-electric-blue font-bold">Academic Path</p>
                  </div>
                  <div className="h-1.5 w-full bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--accent-primary)] w-full shadow-[0_0_8px_rgba(46,91,255,0.3)]" />
                  </div>
                </div>

                <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-8">
                  {nameInput ? `Almost there, ${nameInput.split(' ')[0]}!` : 'Select Your Level'}
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                  {levels.map((l) => (
                    <button
                      key={l.val}
                      onClick={() => setSelections(prev => ({ ...prev, level: l.val }))}
                      className={`p-6 rounded-premium border transition-all duration-300 text-left relative overflow-hidden active:scale-95 ${
                        selections.level === l.val 
                          ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5 ring-1 ring-[var(--accent-primary)]/30' 
                          : 'border-[var(--border-color)] bg-[var(--bg-secondary)]/60'
                      }`}
                    >
                      <div className={`mb-4 ${selections.level === l.val ? 'text-[var(--accent-primary)]' : 'text-[var(--text-tertiary)]'}`}>
                        <GraduationCap className="w-8 h-8" />
                      </div>
                      <h3 className="font-bold text-[var(--text-primary)] leading-none">Level {l.val}</h3>
                      <p className="text-xs text-zinc-500 mt-1">{l.label}</p>
                      {selections.level === l.val && (
                        <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-[var(--accent-primary)] fill-[var(--accent-primary)]/10" />
                      )}
                    </button>
                  ))}
                </div>

                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">Academic Term</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                  {['1', '2'].map((sem) => (
                    <button
                      key={sem}
                      onClick={() => setSelections(prev => ({ ...prev, semester: sem }))}
                      className={`flex items-center gap-4 p-5 rounded-premium border transition-all duration-300 text-left ${
                        selections.semester === sem 
                          ? 'border-[var(--accent-secondary)] bg-[var(--accent-secondary)]/5' 
                          : 'border-[var(--border-color)] bg-[var(--bg-secondary)]/60'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                        selections.semester === sem ? 'bg-[var(--accent-secondary)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
                      }`}>
                        {sem}
                      </div>
                      <div>
                        <div className={`font-bold ${selections.semester === sem ? 'text-[var(--accent-secondary)]' : 'text-[var(--text-primary)]'}`}>
                          {sem === '1' ? 'First Semester' : 'Second Semester'}
                        </div>
                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                          {sem === '1' ? 'Harmattan Cycle' : 'Rain Cycle'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  disabled={!selections.level || !selections.semester}
                  onClick={handleComplete}
                  className="w-full py-5 bg-[var(--accent-primary)] text-white rounded-premium font-bold text-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  Launch Workspace
                  <ArrowRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Waitlist Modal */}
        <AnimatePresence>
          {showWaitlist && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-md bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[2rem] p-8 shadow-2xl relative overflow-hidden"
              >
                <button 
                  onClick={() => { setShowWaitlist(false); setWaitlistSuccess(false); }}
                  className="absolute top-6 right-6 p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-secondary)]/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                
                <div className="w-12 h-12 bg-[var(--accent-secondary)]/10 rounded-2xl flex items-center justify-center mb-6 border border-[var(--accent-secondary)]/20">
                  <Mail className="w-6 h-6 text-[var(--accent-secondary)]" />
                </div>

                <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2">We're coming soon!</h3>
                <p className="text-[var(--text-secondary)] text-sm mb-6 leading-relaxed">
                  Scholar AI is currently training neural models specifically for <strong className="text-[var(--accent-secondary)]">{selections.programme}</strong>. Enter your email to get VIP early access when we launch for your department!
                </p>

                {waitlistSuccess ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <p className="text-emerald-500 text-sm font-bold">You're on the VIP list!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input 
                      type="email" 
                      placeholder="Enter your student email..."
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl py-4 px-5 focus:outline-none focus:ring-2 focus:ring-[var(--accent-secondary)]/30 text-sm"
                    />
                    <button 
                      onClick={() => setWaitlistSuccess(true)}
                      disabled={!waitlistEmail.includes('@')}
                      className="w-full py-4 bg-[var(--accent-secondary)] text-white rounded-xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[var(--accent-secondary)]/20 disabled:opacity-50 disabled:grayscale"
                    >
                      Join Waitlist
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
}
