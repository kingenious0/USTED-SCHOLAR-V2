import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ChevronRight, GraduationCap, Code2, Database, ShieldAlert, Cpu, ArrowRight } from 'lucide-react';

export default function OnboardingScreen() {
  const { setScreen, setUserState } = useApp();
  const [step, setStep] = useState(1);
  const [selections, setSelections] = useState({
    programme: '',
    level: '',
    semester: ''
  });

  const programmes = [
    { name: 'Computer Science', icon: Code2, desc: 'Core Software Engineering' },
    { name: 'Information Tech', icon: Cpu, desc: 'Network & Systems' },
    { name: 'Data Analytics', icon: Database, desc: 'Intelligence & Big Data' },
    { name: 'Cyber Security', icon: ShieldAlert, desc: 'Digital Defense Systems' },
  ];

  const levels = [
    { val: '100', label: 'Freshman' },
    { val: '200', label: 'Sophomore' },
    { val: '300', label: 'Junior' },
    { val: '400', label: 'Senior' },
  ];

  const handleComplete = () => {
    setUserState({
      hasCompletedOnboarding: true,
      programme: selections.programme as any,
      level: selections.level as any,
      semester: selections.semester as any
    });
    setScreen('dashboard');
  };

  return (
    <div className="min-h-screen bg-background-dark flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-electric-blue/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sunset-orange/10 rounded-full blur-[120px]" />

        <div className="w-full max-w-2xl relative z-10">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="mb-10 text-center md:text-left">
                  <h2 className="text-3xl font-bold text-white mb-2">Select Your Path</h2>
                  <p className="text-zinc-400">Tell us your Programme of Study to calibrate your AI workspace.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                  {programmes.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => setSelections(prev => ({ ...prev, programme: p.name }))}
                      className={`flex items-center gap-4 p-6 rounded-premium border transition-all duration-300 text-left hover:scale-[1.02] ${
                        selections.programme === p.name 
                          ? 'border-electric-blue bg-electric-blue/5 shadow-[0_0_15px_rgba(46,91,255,0.2)]' 
                          : 'border-white/5 bg-[#1A1A1A]/60'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        selections.programme === p.name ? 'bg-electric-blue text-white' : 'bg-white/5 text-zinc-500'
                      }`}>
                        <p.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className={`font-bold font-sans ${selections.programme === p.name ? 'text-electric-blue' : 'text-white'}`}>
                          {p.name}
                        </div>
                        <div className="text-xs text-zinc-500">{p.desc}</div>
                      </div>
                      {selections.programme === p.name && (
                        <CheckCircle2 className="w-5 h-5 text-electric-blue fill-electric-blue/10" />
                      )}
                    </button>
                  ))}
                </div>

                <button
                  disabled={!selections.programme}
                  onClick={() => setStep(2)}
                  className="w-full py-5 bg-electric-blue text-white rounded-premium font-bold text-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-2"
                >
                  Confirm Path
                  <ChevronRight className="w-5 h-5" />
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
                     <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">Step 2 of 2</p>
                     <p className="text-electric-blue font-bold">Academic Path</p>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-electric-blue w-full shadow-[0_0_8px_rgba(46,91,255,0.6)]" />
                  </div>
                </div>

                <h2 className="text-3xl font-bold text-white mb-8">Select Your Level</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                  {levels.map((l) => (
                    <button
                      key={l.val}
                      onClick={() => setSelections(prev => ({ ...prev, level: l.val }))}
                      className={`p-6 rounded-premium border transition-all duration-300 text-left relative overflow-hidden active:scale-95 ${
                        selections.level === l.val 
                          ? 'border-electric-blue bg-electric-blue/5 ring-1 ring-electric-blue/30' 
                          : 'border-white/5 bg-[#1A1A1A]/60'
                      }`}
                    >
                      <div className={`mb-4 ${selections.level === l.val ? 'text-electric-blue' : 'text-zinc-500'}`}>
                        <GraduationCap className="w-8 h-8" />
                      </div>
                      <h3 className="font-bold text-white leading-none">Level {l.val}</h3>
                      <p className="text-xs text-zinc-500 mt-1">{l.label}</p>
                      {selections.level === l.val && (
                        <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-electric-blue fill-electric-blue/10" />
                      )}
                    </button>
                  ))}
                </div>

                <h3 className="text-xl font-bold text-white mb-6">Academic Term</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                  {['1', '2'].map((sem) => (
                    <button
                      key={sem}
                      onClick={() => setSelections(prev => ({ ...prev, semester: sem }))}
                      className={`flex items-center gap-4 p-5 rounded-premium border transition-all duration-300 text-left ${
                        selections.semester === sem 
                          ? 'border-sunset-orange bg-sunset-orange/5' 
                          : 'border-white/5 bg-[#1A1A1A]/60'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                        selections.semester === sem ? 'bg-sunset-orange text-white' : 'bg-white/5 text-zinc-500'
                      }`}>
                        {sem}
                      </div>
                      <div>
                        <div className={`font-bold ${selections.semester === sem ? 'text-sunset-orange' : 'text-white'}`}>
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
                  className="w-full py-5 bg-electric-blue text-white rounded-premium font-bold text-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  Launch Workspace
                  <ArrowRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
    </div>
  );
}
