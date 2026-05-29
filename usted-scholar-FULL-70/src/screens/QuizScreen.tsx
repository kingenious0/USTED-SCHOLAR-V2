import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CheckCircle2, Flame, Award, Timer, Lightbulb, ArrowRight, X, Sparkles, MessageSquareQuote, Loader2, Trophy, Brain } from 'lucide-react';
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
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-electric-blue/20 blur-2xl rounded-full animate-pulse" />
        <Loader2 className="w-16 h-16 text-electric-blue animate-spin relative z-10" />
      </div>
      <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2">Drafting your exam...</h2>
      <p className="text-[var(--text-tertiary)] font-bold uppercase tracking-widest text-xs">{selectedFile?.name || 'Analyzing material'}</p>
    </div>
  );

  if (showResults) return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6 text-center transition-colors duration-300">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[var(--bg-secondary)] p-10 rounded-[3rem] max-w-md w-full relative overflow-hidden border border-[var(--border-color)] shadow-xl"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-gradient-to-br from-sunset-orange/20 to-amber-500/20 blur-3xl rounded-full" />
        <Trophy className="w-20 h-20 text-sunset-orange mx-auto mb-6 relative z-10" />
        <h2 className="text-4xl font-black text-[var(--text-primary)] mb-2 relative z-10">Mastery</h2>
        <div className="text-6xl font-black text-electric-blue mb-6 relative z-10">{questions.length > 0 ? Math.round((score / questions.length) * 100) : 0}%</div>
        <p className="text-[var(--text-secondary)] font-medium mb-8 leading-relaxed relative z-10">
          {score} / {questions.length} correct. Keep pushing for 100%!
        </p>
        <Link to="/dashboard"
          className="w-full block py-4 bg-gradient-to-r from-electric-blue to-blue-600 text-white rounded-2xl font-extrabold text-sm uppercase tracking-widest shadow-xl shadow-electric-blue/20 active:scale-95 transition-all relative z-10">
          Finish Session
        </Link>
      </motion.div>
    </div>
  );

  const currentQ = questions[currentIndex];

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-primary)] flex flex-col p-6 lg:p-12 relative overflow-hidden pb-24 lg:pb-0 transition-colors duration-300">
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-bl from-electric-blue/5 to-transparent blur-[150px] rounded-full pointer-events-none" />

      <header className="flex justify-between items-center mb-8 relative z-10">
        <Link to="/hub" className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
          <X className="w-5 h-5" />
        </Link>

        <div className="flex-1 max-w-xl mx-6 hidden md:block">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-electric-blue uppercase tracking-widest">Q{currentIndex + 1} of {questions.length}</span>
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">{questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0}%</span>
          </div>
          <div className="h-1.5 w-full bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0}%` }}
              className="h-full bg-gradient-to-r from-electric-blue to-blue-500 rounded-full"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-full shadow-sm">
          <Flame className="w-4 h-4 text-sunset-orange fill-sunset-orange" />
          <span className="text-xs font-extrabold text-sunset-orange uppercase tracking-tighter">14 Day</span>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start px-2">
        <div className="lg:col-span-8 space-y-8">
          {!currentQ ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Loader2 className="w-8 h-8 text-electric-blue animate-spin mb-3" />
              <p className="text-[var(--text-tertiary)] font-bold uppercase tracking-widest text-xs">Finalizing questions...</p>
            </div>
          ) : (
            <>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-blue/10 border border-electric-blue/20 mb-4 uppercase tracking-widest text-[10px] font-extrabold text-electric-blue">
                  <Sparkles className="w-2.5 h-2.5" />
                  Academic Mastery
                </div>
                <div className="text-xl md:text-2xl font-extrabold text-[var(--text-primary)] leading-snug tracking-tight prose dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentQ.question}</ReactMarkdown>
                </div>
              </div>

              <div className="space-y-3">
                {(currentQ.options || currentQ.choices || currentQ.answers || [])?.map((opt: string, i: number) => (
                  <button
                    key={i}
                    disabled={isAnswered}
                    onClick={() => setSelectedOption(i)}
                    className={`w-full group text-left p-4 md:p-5 rounded-2xl border transition-all duration-200 flex items-center gap-4 relative overflow-hidden ${
                      selectedOption === i
                        ? 'border-electric-blue bg-electric-blue/5 shadow-[0_0_12px_rgba(37,99,235,0.1)]'
                        : 'border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-electric-blue/30'
                    } ${isAnswered && i === currentQ.correctAnswer ? 'border-emerald-500 bg-emerald-500/10' : ''} ${isAnswered && selectedOption === i && i !== currentQ.correctAnswer ? 'border-red-500 bg-red-500/10' : ''}`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm transition-colors shrink-0 ${
                      selectedOption === i ? 'bg-electric-blue text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] group-hover:bg-electric-blue/10'
                    } ${isAnswered && i === currentQ.correctAnswer ? 'bg-emerald-500 text-white' : ''} ${isAnswered && selectedOption === i && i !== currentQ.correctAnswer ? 'bg-red-500 text-white' : ''}`}>
                      {String.fromCharCode(65 + i)}
                    </div>
                    <p className={`flex-1 text-sm leading-relaxed font-medium ${selectedOption === i ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                      {opt}
                    </p>
                    {isAnswered && i === currentQ.correctAnswer && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                  </button>
                ))}
              </div>

              {!isAnswered && (
                <button
                  onClick={handleSubmit}
                  disabled={selectedOption === null}
                  className="w-full py-4 bg-gradient-to-r from-electric-blue to-blue-600 text-white rounded-2xl font-extrabold text-sm uppercase tracking-widest hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-2 shadow-xl shadow-electric-blue/20"
                >
                  Submit Answer <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-4 hidden lg:block">
          <div className="bg-[var(--bg-secondary)] p-5 rounded-2xl border border-[var(--border-color)] border-l-4 border-l-sunset-orange shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <Brain className="w-5 h-5 text-sunset-orange" />
              <div>
                <p className="text-[10px] font-extrabold text-[var(--text-tertiary)] uppercase tracking-widest">Score</p>
                <p className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">{score} Correct</p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--bg-secondary)] p-5 rounded-2xl border border-[var(--border-color)] shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-electric-blue">
              <Lightbulb className="w-5 h-5" fill="currentColor" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest">Tip</span>
            </div>
            <p className="text-[var(--text-secondary)] text-sm italic leading-relaxed font-medium">
              "Quizzing after studying boosts long-term retention by over 40%."
            </p>
          </div>
        </div>
      </main>

      {/* Answer Feedback Overlay */}
      <AnimatePresence>
        {isAnswered && currentQ && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-0 left-0 w-full z-50 p-4 sm:p-6 flex justify-center">
              <div className={`max-w-2xl w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden shadow-2xl ${selectedOption === currentQ.correctAnswer ? 'border-t-emerald-500/30' : 'border-t-red-500/30'}`}>
                <div className={`absolute top-[-80px] left-1/2 -translate-x-1/2 w-48 h-48 blur-[80px] rounded-full ${selectedOption === currentQ.correctAnswer ? 'bg-emerald-500/10' : 'bg-red-500/10'}`} />
                <div className="flex items-center gap-4 mb-6 relative z-10">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center ${selectedOption === currentQ.correctAnswer ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                    {selectedOption === currentQ.correctAnswer ? <Award className="w-7 h-7 text-emerald-500" /> : <X className="w-7 h-7 text-red-500" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">{selectedOption === currentQ.correctAnswer ? 'Correct!' : 'Not Quite'}</h3>
                    <p className="text-[var(--text-tertiary)] font-bold text-xs tracking-widest uppercase">{selectedOption === currentQ.correctAnswer ? '+150 XP' : 'Keep Learning'}</p>
                  </div>
                </div>

                <div className="bg-[var(--bg-tertiary)] rounded-2xl p-5 border border-[var(--border-color)] mb-6 shadow-inner relative z-10">
                  <div className="flex items-start gap-3 mb-3">
                    <Lightbulb className={`w-5 h-5 ${selectedOption === currentQ.correctAnswer ? 'text-emerald-500' : 'text-red-500'}`} />
                    <h4 className="font-extrabold text-[var(--text-primary)] uppercase text-xs tracking-widest mt-1">Explanation</h4>
                  </div>
                  <div className="text-[var(--text-secondary)] leading-relaxed text-sm font-medium prose dark:prose-invert prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentQ.explanation}</ReactMarkdown>
                  </div>
                </div>

                <button onClick={handleNext}
                  className="w-full py-4 bg-gradient-to-r from-gold to-red-600 text-white rounded-2xl font-extrabold text-sm uppercase tracking-widest hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-2xl shadow-gold/20 relative z-10">
                  {currentIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
