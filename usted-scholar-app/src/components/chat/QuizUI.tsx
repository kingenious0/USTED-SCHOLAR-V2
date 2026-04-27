"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, Trophy } from "lucide-react";

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export function QuizUI({ fileId, onClose }: { fileId: string; onClose: () => void }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const fetchQuiz = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      });
      if (!res.ok) throw new Error("Failed to generate quiz");
      const data = await res.json();
      setQuestions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz();
  }, [fileId]);

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedIdx(idx);
    setIsAnswered(true);
    if (idx === questions[currentIndex].correctIndex) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
      setSelectedIdx(null);
      setIsAnswered(false);
    } else {
      setShowResults(true);
    }
  };

  if (loading) return (
    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6">
      <div className="relative w-20 h-20 mb-8">
        <div className="absolute inset-0 rounded-full border-4 border-white/5"></div>
        <div className="absolute inset-0 rounded-full border-4 border-[#FFCC22] border-t-transparent animate-spin"></div>
      </div>
      <h3 className="text-xl font-black tracking-tighter text-white mb-2 uppercase">Generating Quiz</h3>
      <p className="text-gray-400 text-sm animate-pulse tracking-widest text-center">Reading your lecture materials...</p>
    </div>
  );

  if (error) return (
    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6">
      <div className="p-8 border border-red-500/20 bg-red-500/5 rounded-3xl text-center max-w-sm">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Quiz Generation Failed</h3>
        <p className="text-gray-400 text-sm mb-6">{error}</p>
        <div className="flex flex-col gap-3">
          <button onClick={fetchQuiz} className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold transition-all">Try Again</button>
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-white">Cancel</button>
        </div>
      </div>
    </div>
  );

  if (showResults) return (
    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-[#151515] border border-white/10 rounded-[32px] p-10 text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#8C033B] via-[#FFCC22] to-[#8C033B]"></div>
        
        <div className="w-20 h-20 bg-gradient-to-br from-[#8C033B] to-[#FFCC22] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-yellow-500/20">
          <Trophy className="w-10 h-10 text-white" />
        </div>
        
        <h2 className="text-3xl font-black text-white mb-2">Quiz Complete!</h2>
        <p className="text-gray-400 text-sm mb-8">You mastered the content with a score of:</p>
        
        <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-500 mb-8">
          {score}/{questions.length}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => { setCurrentIndex(0); setScore(0); setShowResults(false); setSelectedIdx(null); setIsAnswered(false); fetchQuiz(); }}
            className="py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Retake
          </button>
          <button 
            onClick={onClose}
            className="py-4 bg-[#8C033B] hover:bg-[#a00445] rounded-2xl text-white font-bold text-sm transition-all shadow-lg shadow-red-900/20"
          >
            Finish
          </button>
        </div>
      </motion.div>
    </div>
  );

  const q = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div 
        layoutId="quiz-container"
        className="w-full max-w-xl bg-[#0D0D0D] border border-white/5 rounded-[40px] flex flex-col max-h-[90vh] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="p-8 pb-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-black tracking-[0.3em] text-[#FFCC22] uppercase mb-1">Scholar Challenge</span>
            <div className="flex items-center gap-4">
               <div className="h-1.5 w-32 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-gradient-to-r from-[#8C033B] to-[#FFCC22]"
                  />
               </div>
               <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{currentIndex + 1} OF {questions.length}</span>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Question Area */}
        <div className="flex-1 overflow-y-auto px-8 py-4 custom-scrollbar">
          <motion.div
            key={currentIndex}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="space-y-8"
          >
            <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight">
              {q.question}
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {q.options.map((option, idx) => {
                let status = "default";
                if (isAnswered) {
                  if (idx === q.correctIndex) status = "correct";
                  else if (idx === selectedIdx) status = "wrong";
                  else status = "dim";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    disabled={isAnswered}
                    className={`
                      w-full text-left p-5 rounded-2xl border transition-all flex items-center justify-between group
                      ${status === "default" && "bg-white/[0.03] border-white/5 hover:bg-white/[0.08] hover:border-white/20"}
                      ${status === "correct" && "bg-green-500/10 border-green-500/50 text-green-100"}
                      ${status === "wrong" && "bg-red-500/10 border-red-500/50 text-red-100"}
                      ${status === "dim" && "opacity-30 border-white/5 scale-[0.98]"}
                    `}
                  >
                    <span className="text-sm font-medium pr-4">{option}</span>
                    {status === "correct" && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />}
                    {status === "wrong" && <X className="w-5 h-5 text-red-500 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <AnimatePresence>
              {isAnswered && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="bg-[#151515] border border-white/5 rounded-2xl p-5"
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#FFCC22] mb-2">Explanation</p>
                  <p className="text-sm text-gray-400 leading-relaxed italic">"{q.explanation}"</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="p-8 pt-4">
          <button
            onClick={nextQuestion}
            disabled={!isAnswered}
            className="w-full h-16 bg-white text-black font-black uppercase tracking-widest text-sm rounded-2xl flex items-center justify-center gap-2 hover:bg-[#FFCC22] transition-all disabled:opacity-20 disabled:grayscale"
          >
            {currentIndex === questions.length - 1 ? "Show Results" : "Next Question"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
