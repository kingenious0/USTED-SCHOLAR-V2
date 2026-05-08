import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CheckCircle2, Flame, Award, Timer, Lightbulb, ArrowRight, X, Sparkles, MessageSquareQuote, Loader2, Trophy } from 'lucide-react';
import { generateQuiz } from '../lib/ai';

export default function QuizScreen() {
  const { selectedFile } = useApp();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    async function loadQuiz() {
      const targetId = selectedFile?.file_id || selectedFile?.id;
      if (!targetId) {
        navigate('/library');
        return;
      }
      try {
        const data = await generateQuiz(targetId);
        if (data.questions) setQuestions(data.questions);
      } catch (err) {
        console.error('Quiz Error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadQuiz();
  }, [selectedFile, navigate]);

  const handleSubmit = () => {
    if (selectedOption !== null) {
      if (selectedOption === questions[currentIndex].correctAnswer) {
        setScore(s => s + 1);
      }
      setIsAnswered(true);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResults(true);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6 text-center transition-colors duration-300">
       <div className="w-20 h-20 relative mb-8">
           <div className="absolute inset-0 bg-[var(--accent-primary)]/20 blur-2xl rounded-full animate-pulse" />
           <Loader2 className="w-20 h-20 text-[var(--accent-primary)] animate-spin relative z-10" />
       </div>
       <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2">AI is drafting your exam...</h2>
       <p className="text-[var(--text-tertiary)] font-bold uppercase tracking-widest text-xs">Analyzing {selectedFile?.name || 'lecture material'}</p>
    </div>
  );

  if (showResults) return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6 text-center transition-colors duration-300">
       <motion.div 
         initial={{ scale: 0.9, opacity: 0 }}
         animate={{ scale: 1, opacity: 1 }}
         className="bg-[var(--bg-secondary)] p-12 rounded-[3rem] max-w-md w-full relative overflow-hidden border border-[var(--border-color)] shadow-xl"
       >
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-[var(--accent-secondary)]/20 blur-3xl rounded-full" />
          <Trophy className="w-24 h-24 text-[var(--accent-secondary)] mx-auto mb-6 relative z-10" />
          <h2 className="text-4xl font-black text-[var(--text-primary)] mb-2 relative z-10">Mastery Level</h2>
          <div className="text-6xl font-black text-[var(--accent-primary)] mb-8">{questions.length > 0 ? Math.round((score / questions.length) * 100) : 0}%</div>
         <p className="text-[var(--text-secondary)] font-medium mb-10 leading-relaxed">
            You got {score} out of {questions.length} questions correct. Your mastery of {selectedFile?.name} is growing!
         </p>
          <Link 
            to="/dashboard"
            className="w-full block py-5 bg-[var(--accent-primary)] text-white rounded-2xl font-extrabold text-lg shadow-xl shadow-[var(--accent-primary)]/20 active:scale-95 transition-all"
          >
            Finish Session
          </Link>
       </motion.div>
    </div>
  );

  const currentQ = questions[currentIndex];

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-primary)] flex flex-col p-6 lg:p-12 relative overflow-hidden pb-24 lg:pb-0 transition-colors duration-300">
      <header className="flex justify-between items-center mb-12 relative z-10">
        <Link to="/hub" className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all">
          <X className="w-6 h-6" />
        </Link>
        
        <div className="flex-1 max-w-xl mx-8 hidden md:block">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-[var(--accent-primary)] uppercase tracking-widest">Question {currentIndex + 1} of {questions.length}</span>
              <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">{questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0}% Complete</span>
            </div>
           <div className="h-2 w-full bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0}%` }}
               className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]"
             />
           </div>
        </div>

         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-full shadow-sm">
               <Flame className="w-4 h-4 text-[var(--accent-secondary)] fill-[var(--accent-secondary)]" />
               <span className="text-sm font-extrabold text-[var(--accent-secondary)] uppercase tracking-tighter">14 Day Streak</span>
            </div>
         </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start px-4">
         <div className="lg:col-span-8 space-y-10">
             {!currentQ ? (
                 <div className="flex flex-col items-center justify-center py-20 text-center">
                   <Loader2 className="w-10 h-10 text-[var(--accent-primary)] animate-spin mb-4" />
                   <p className="text-[var(--text-tertiary)] font-bold uppercase tracking-widest text-xs">Finalizing neural data...</p>
                 </div>
            ) : (
               <>
                 <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 mb-6 uppercase tracking-widest text-[10px] font-extrabold text-[var(--accent-primary)]">
                      <Sparkles className="w-2.5 h-2.5" />
                      Academic Mastery
                    </div>
                   <div className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] leading-snug tracking-tight prose dark:prose-invert max-w-none">
                     <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentQ.question}</ReactMarkdown>
                   </div>
                </div>

                <div className="space-y-4">
                   {(currentQ.options || currentQ.choices || currentQ.answers || [])?.map((opt: string, i: number) => (
                      <button
                        key={i}
                        disabled={isAnswered}
                        onClick={() => setSelectedOption(i)}
                         className={`w-full group text-left p-6 rounded-2xl border transition-all duration-200 flex items-center gap-6 relative overflow-hidden ${
                           selectedOption === i 
                             ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5 shadow-[0_0_12px_rgba(37,99,235,0.1)]' 
                             : 'border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)]/30'
                         } ${isAnswered && i === currentQ.correctAnswer ? 'border-emerald-500 bg-emerald-500/10' : ''} ${isAnswered && selectedOption === i && i !== currentQ.correctAnswer ? 'border-red-500 bg-red-500/10' : ''}`}
                       >
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm transition-colors ${
                           selectedOption === i ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] group-hover:bg-[var(--accent-primary)]/10 font-bold'
                         } ${isAnswered && i === currentQ.correctAnswer ? 'bg-emerald-500 text-white' : ''} ${isAnswered && selectedOption === i && i !== currentQ.correctAnswer ? 'bg-red-500 text-white' : ''}`}>
                          {String.fromCharCode(65 + i)}
                        </div>
                        <p className={`flex-1 text-sm md:text-base leading-relaxed font-medium ${selectedOption === i ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                          {opt}
                        </p>
                        {isAnswered && i === currentQ.correctAnswer && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                      </button>
                   ))}
                </div>

                {isAnswered && (
                  <div className="mt-8 p-6 bg-[var(--bg-tertiary)] rounded-2xl border border-[var(--border-color)]">
                     <p className="text-[var(--text-tertiary)] text-sm italic">Analysis complete. Check the explanation below for deep insights.</p>
                  </div>
                )}

                 {!isAnswered && (
                   <button 
                     onClick={handleSubmit}
                     disabled={selectedOption === null}
                     className="w-full mt-10 py-5 bg-[var(--accent-primary)] text-white rounded-2xl font-extrabold text-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-3 shadow-xl shadow-[var(--accent-primary)]/20"
                   >
                     Submit Answer
                     <ArrowRight className="w-5 h-5" />
                   </button>
                 )}
               </>
            )}
         </div>

          <div className="lg:col-span-4 space-y-6 hidden lg:block">
             <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-color)] border-l-4 border-l-[var(--accent-secondary)] shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                   <Timer className="w-5 h-5 text-[var(--accent-secondary)]" />
                   <div>
                      <p className="text-[10px] font-extrabold text-[var(--text-tertiary)] uppercase tracking-widest">Mastery Progress</p>
                      <p className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">{score} Correct</p>
                   </div>
                </div>
             </div>

             <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-color)] shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-[var(--accent-primary)]">
                  <Lightbulb className="w-5 h-5" fill="currentColor" />
                  <span className="text-[10px] font-extrabold uppercase tracking-widest">Scholar Tip</span>
                </div>
                <p className="text-[var(--text-secondary)] text-sm italic leading-relaxed font-medium">
                  "Taking quizzes after studying lecture notes increases long-term retention by over 40%."
                </p>
             </div>
         </div>
      </main>

      <AnimatePresence>
        {isAnswered && currentQ && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-0 left-0 w-full z-50 p-6 flex justify-center">
              <div className={`max-w-2xl w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[2.5rem] p-8 md:p-10 border-t relative overflow-hidden shadow-2xl ${selectedOption === currentQ.correctAnswer ? 'border-t-emerald-500/30' : 'border-t-red-500/30'}`}>
                 <div className={`absolute top-[-100px] left-1/2 -translate-x-1/2 w-64 h-64 blur-[80px] rounded-full ${selectedOption === currentQ.correctAnswer ? 'bg-emerald-500/10' : 'bg-red-500/10'}`} />
                 <div className="flex items-center gap-4 mb-8">
                   <div className={`w-16 h-16 rounded-full flex items-center justify-center ${selectedOption === currentQ.correctAnswer ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                     {selectedOption === currentQ.correctAnswer ? <Award className="w-8 h-8 text-emerald-500" /> : <X className="w-8 h-8 text-red-500" />}
                   </div>
                   <div>
                     <h3 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">{selectedOption === currentQ.correctAnswer ? 'Excellent Analysis!' : 'Not Quite...'}</h3>
                     <p className="text-[var(--text-tertiary)] font-bold text-sm tracking-widest uppercase">{selectedOption === currentQ.correctAnswer ? '+150 XP Earned' : 'Knowledge is a Journey'}</p>
                   </div>
                 </div>

                 <div className="bg-[var(--bg-tertiary)] rounded-2xl p-6 border border-[var(--border-color)] mb-8 shadow-inner">
                    <div className="flex items-start gap-3 mb-4">
                       <MessageSquareQuote className={`w-5 h-5 ${selectedOption === currentQ.correctAnswer ? 'text-emerald-500' : 'text-red-500'}`} />
                       <h4 className="font-extrabold text-[var(--text-primary)] uppercase text-xs tracking-widest mt-1">Explanation</h4>
                    </div>
                    <div className="text-[var(--text-secondary)] leading-relaxed text-sm font-medium prose dark:prose-invert prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentQ.explanation}</ReactMarkdown>
                    </div>
                 </div>

                 <button onClick={handleNext} className="w-full py-5 bg-gradient-to-r from-[#FFCC22] to-red-600 text-white rounded-2xl font-extrabold text-lg hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-2xl shadow-[#FFCC22]/20">
                   {currentIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
                   <ArrowRight className="w-5 h-5" />
                 </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
