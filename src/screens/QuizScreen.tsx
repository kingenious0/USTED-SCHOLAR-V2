import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CheckCircle2, Flame, Award, Timer, Lightbulb, ArrowRight, X, Sparkles, MessageSquareQuote, Loader2, Trophy } from 'lucide-react';
import { generateQuiz } from '../lib/ai';

export default function QuizScreen() {
  const { setScreen, selectedFile } = useApp();
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
        setScreen('library');
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
  }, [selectedFile]);

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
    <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center p-6 text-center">
       <div className="w-20 h-20 relative mb-8">
          <div className="absolute inset-0 bg-electric-blue/20 blur-2xl rounded-full animate-pulse" />
          <Loader2 className="w-20 h-20 text-electric-blue animate-spin relative z-10" />
       </div>
       <h2 className="text-2xl font-black text-white mb-2">AI is drafting your exam...</h2>
       <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Analyzing {selectedFile?.name || 'lecture material'}</p>
    </div>
  );

  if (showResults) return (
    <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center p-6 text-center">
       <motion.div 
         initial={{ scale: 0.9, opacity: 0 }}
         animate={{ scale: 1, opacity: 1 }}
         className="glass-card p-12 rounded-[3rem] max-w-md w-full relative overflow-hidden"
       >
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-sunset-orange/20 blur-3xl rounded-full" />
         <Trophy className="w-24 h-24 text-sunset-orange mx-auto mb-6 relative z-10" />
         <h2 className="text-4xl font-black text-white mb-2 relative z-10">Mastery Level</h2>
         <div className="text-6xl font-black text-electric-blue mb-8">{(score / questions.length) * 100}%</div>
         <p className="text-white/60 font-medium mb-10 leading-relaxed">
            You got {score} out of {questions.length} questions correct. Your mastery of {selectedFile?.name} is growing!
         </p>
         <button 
           onClick={() => setScreen('dashboard')}
           className="w-full py-5 bg-electric-blue text-white rounded-2xl font-extrabold text-lg shadow-xl shadow-electric-blue/20"
         >
           Finish Session
         </button>
       </motion.div>
    </div>
  );

  const currentQ = questions[currentIndex];

  return (
    <div className="min-h-[100dvh] bg-background-dark flex flex-col p-6 lg:p-12 relative overflow-hidden pb-24 lg:pb-0">
      {/* Top Bar */}
      <header className="flex justify-between items-center mb-12 relative z-10">
        <button 
          onClick={() => setScreen('hub')}
          className="p-2 text-zinc-500 hover:text-white transition-all"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="flex-1 max-w-xl mx-8 hidden md:block">
           <div className="flex justify-between items-center mb-2">
             <span className="text-[10px] font-bold text-electric-blue uppercase tracking-widest">Question {currentIndex + 1} of {questions.length}</span>
             <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{Math.round(((currentIndex + 1) / questions.length) * 100)}% Complete</span>
           </div>
           <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
               className="h-full bg-gradient-to-r from-electric-blue to-sunset-orange shadow-[0_0_12px_rgba(37,99,235,0.4)]"
             />
           </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/5 rounded-full">
             <Flame className="w-4 h-4 text-sunset-orange fill-sunset-orange" />
             <span className="text-sm font-extrabold text-sunset-orange uppercase tracking-tighter">14 Day Streak</span>
           </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start px-4">
         {/* Question Area */}
         <div className="lg:col-span-8 space-y-10">
            <div>
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-blue/10 border border-electric-blue/20 mb-6 uppercase tracking-widest text-[10px] font-extrabold text-electric-blue">
                 <Sparkles className="w-3.5 h-3.5" />
                 Academic Mastery
               </div>
               <div className="text-2xl md:text-3xl font-extrabold text-white leading-snug tracking-tight prose prose-invert max-w-none">
                 <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentQ.question}</ReactMarkdown>
               </div>
            </div>

            <div className="space-y-4">
               {currentQ.options.map((opt: string, i: number) => (
                 <button
                   key={i}
                   disabled={isAnswered}
                   onClick={() => setSelectedOption(i)}
                   className={`w-full group text-left p-6 rounded-2xl border transition-all duration-200 flex items-center gap-6 relative overflow-hidden ${
                     selectedOption === i 
                       ? 'border-electric-blue bg-electric-blue/5 shadow-[0_0_12px_rgba(37,99,235,0.1)]' 
                       : 'border-white/5 bg-surface-dark hover:border-white/10'
                   } ${isAnswered && i === currentQ.correctAnswer ? 'border-emerald-500 bg-emerald-500/10' : ''} ${isAnswered && selectedOption === i && i !== currentQ.correctAnswer ? 'border-red-500 bg-red-500/10' : ''}`}
                 >
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm transition-colors ${
                     selectedOption === i ? 'bg-electric-blue text-white' : 'bg-white/5 text-white/40 group-hover:bg-white/10 font-bold'
                   } ${isAnswered && i === currentQ.correctAnswer ? 'bg-emerald-500 text-white' : ''} ${isAnswered && selectedOption === i && i !== currentQ.correctAnswer ? 'bg-red-500 text-white' : ''}`}>
                     {String.fromCharCode(65 + i)}
                   </div>
                   <p className={`flex-1 text-sm md:text-base leading-relaxed font-medium ${selectedOption === i ? 'text-white' : 'text-white/60'}`}>
                     {opt}
                   </p>
                   {isAnswered && i === currentQ.correctAnswer && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                 </button>
               ))}
            </div>

            {!isAnswered && (
              <button 
                onClick={handleSubmit}
                disabled={selectedOption === null}
                className="w-full py-5 bg-electric-blue text-white rounded-2xl font-extrabold text-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-3 shadow-xl shadow-electric-blue/20"
              >
                Submit Answer
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
         </div>

         {/* Sidebar Stats */}
         <div className="lg:col-span-4 space-y-6 hidden lg:block">
            <div className="bg-surface-dark p-6 rounded-2xl border border-white/5 border-l-4 border-l-sunset-orange">
               <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 rounded-full bg-sunset-orange/10 flex items-center justify-center">
                    <Timer className="w-5 h-5 text-sunset-orange" />
                 </div>
                 <div>
                    <p className="text-[10px] font-extrabold text-white/40 uppercase tracking-widest">Mastery Progress</p>
                    <p className="text-xl font-extrabold text-white tracking-tight">{score} Correct</p>
                 </div>
               </div>
            </div>

            <div className="bg-surface-dark p-6 rounded-2xl border border-white/5">
               <div className="flex items-center gap-2 mb-4 text-electric-blue">
                 <Lightbulb className="w-5 h-5" fill="currentColor" />
                 <span className="text-[10px] font-extrabold uppercase tracking-widest">Scholar Tip</span>
               </div>
               <p className="text-white/60 text-sm italic leading-relaxed font-medium">
                 "Taking quizzes after studying lecture notes increases long-term retention by over 40%."
               </p>
            </div>
         </div>
      </main>

      {/* Explanation Pop-up */}
      <AnimatePresence>
        {isAnswered && (
          <>
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
               className="fixed bottom-0 left-0 w-full z-50 p-6 flex justify-center"
            >
              <div className={`max-w-2xl w-full bg-surface-dark border border-white/10 rounded-[2.5rem] p-8 md:p-10 border-t relative overflow-hidden shadow-[0_-20px_40px_rgba(0,0,0,0.4)] ${selectedOption === currentQ.correctAnswer ? 'border-t-emerald-500/30' : 'border-t-red-500/30'}`}>
                 <div className={`absolute top-[-100px] left-1/2 -translate-x-1/2 w-64 h-64 blur-[80px] rounded-full ${selectedOption === currentQ.correctAnswer ? 'bg-emerald-500/10' : 'bg-red-500/10'}`} />
                 
                 <div className="flex items-center gap-4 mb-8">
                   <div className={`w-16 h-16 rounded-full flex items-center justify-center ${selectedOption === currentQ.correctAnswer ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                     {selectedOption === currentQ.correctAnswer ? <Award className="w-8 h-8 text-emerald-500" /> : <X className="w-8 h-8 text-red-500" />}
                   </div>
                   <div>
                     <h3 className="text-2xl font-extrabold text-white tracking-tight">
                       {selectedOption === currentQ.correctAnswer ? 'Excellent Analysis!' : 'Not Quite...'}
                     </h3>
                     <p className="text-white/40 font-bold text-sm tracking-widest uppercase">
                       {selectedOption === currentQ.correctAnswer ? '+150 XP Earned' : 'Knowledge is a Journey'}
                     </p>
                   </div>
                 </div>

                 <div className="bg-white/5 rounded-2xl p-6 border border-white/5 mb-8">
                    <div className="flex items-start gap-3 mb-4">
                       <MessageSquareQuote className={`w-5 h-5 ${selectedOption === currentQ.correctAnswer ? 'text-emerald-500' : 'text-red-500'}`} />
                       <h4 className="font-extrabold text-white uppercase text-xs tracking-widest mt-1">AI Explanation</h4>
                    </div>
                    <div className="text-white/60 leading-relaxed text-sm font-medium prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentQ.explanation}</ReactMarkdown>
                    </div>
                 </div>

                 <button 
                  onClick={handleNext}
                  className="w-full py-5 bg-gradient-to-r from-sunset-orange to-red-600 text-white rounded-2xl font-extrabold text-lg hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-2xl shadow-sunset-orange/20"
                 >
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
