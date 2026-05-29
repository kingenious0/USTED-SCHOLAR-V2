import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, RotateCcw, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, Sparkles, Loader2, Trophy, Brain } from 'lucide-react';
import { generateFlashcards } from '../lib/ai';

export default function FlashcardScreen() {
  const { selectedFile } = useApp();
  const navigate = useNavigate();
  const [cards, setCards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [masteredCount, setMasteredCount] = useState(0);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    async function loadCards() {
      const targetId = selectedFile?.file_id || selectedFile?.id;
      if (!targetId) {
        navigate('/library');
        return;
      }
      try {
        const data = await generateFlashcards(targetId);
        let parsedCards: any[] = [];
        if (Array.isArray(data)) {
          parsedCards = data;
        } else if (data && typeof data === 'object') {
          parsedCards = data.cards || data.flashcards || Object.values(data).find(Array.isArray) || [];
        }
        setCards(parsedCards);
      } catch (err) {
        console.error('Flashcard Error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCards();
  }, [selectedFile, navigate]);

  const handleNext = (mastered: boolean) => {
    if (mastered) setMasteredCount(prev => prev + 1);

    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 150);
    } else {
      setShowResults(true);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6 text-center transition-colors">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-electric-blue/20 blur-2xl rounded-full animate-pulse" />
        <Loader2 className="w-16 h-16 text-electric-blue animate-spin relative z-10" />
      </div>
      <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2">Building your study deck...</h2>
      <p className="text-[var(--text-tertiary)] font-bold uppercase tracking-widest text-xs">{selectedFile?.name || 'Extracting concepts'}</p>
    </div>
  );

  if (!loading && cards.length === 0) return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6 text-center transition-colors">
      <div className="w-20 h-20 rounded-[2.5rem] bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center mb-6">
        <AlertCircle className="w-10 h-10 text-sunset-orange animate-pulse" />
      </div>
      <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2">No flashcards found</h2>
      <p className="text-[var(--text-tertiary)] font-bold uppercase tracking-widest text-xs mb-8 max-w-sm leading-relaxed">
        We couldn't generate study cards for this module. Make sure the course has processed textbook text first.
      </p>
      <Link to="/hub"
        className="px-8 py-3.5 bg-gradient-to-r from-electric-blue to-blue-600 text-white rounded-2xl font-extrabold text-xs uppercase tracking-widest shadow-xl shadow-electric-blue/20 active:scale-95 transition-all">
        Back to Hub
      </Link>
    </div>
  );

  if (showResults) return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6 text-center transition-colors">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[var(--bg-secondary)] p-10 rounded-[3rem] max-w-md w-full relative overflow-hidden border border-[var(--border-color)] shadow-xl"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-gradient-to-br from-electric-blue/20 to-blue-600/20 blur-3xl rounded-full" />
        <Trophy className="w-16 h-16 text-sunset-orange mx-auto mb-6 relative z-10" />
        <h2 className="text-4xl font-black text-[var(--text-primary)] mb-2 relative z-10">Deck Complete</h2>
        <div className="text-6xl font-black text-electric-blue mb-6 relative z-10">
          {cards.length > 0 ? Math.round((masteredCount / cards.length) * 100) : 0}%
        </div>
        <p className="text-[var(--text-secondary)] font-medium mb-8 leading-relaxed relative z-10">
          {masteredCount} / {cards.length} mastered. Keep pushing for 100%!
        </p>
        <Link to="/hub"
          className="w-full block py-4 bg-gradient-to-r from-electric-blue to-blue-600 text-white rounded-2xl font-extrabold text-sm uppercase tracking-widest shadow-xl shadow-electric-blue/20 active:scale-95 transition-all relative z-10">
          Back to Hub
        </Link>
      </motion.div>
    </div>
  );

  const currentCard = cards[currentIndex];

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-primary)] flex flex-col p-6 lg:p-12 transition-colors relative overflow-hidden">
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-bl from-sunset-orange/5 to-transparent blur-[150px] rounded-full pointer-events-none" />

      <header className="flex justify-between items-center mb-10 relative z-10">
        <Link to="/hub" className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
          <X className="w-5 h-5" />
        </Link>

        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-electric-blue uppercase tracking-[0.3em] mb-1">Study Deck</span>
          <span className="text-sm font-black text-[var(--text-primary)]">{currentIndex + 1} / {cards.length}</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-br from-electric-blue/20 to-blue-600/20 border border-electric-blue/20 rounded-full">
          <Brain className="w-4 h-4 text-electric-blue" />
          <span className="text-xs font-black text-electric-blue">{masteredCount}</span>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full flex flex-col justify-center gap-8 relative z-10">
        <div className="perspective-1000 h-[380px] w-full cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
          <motion.div
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-full h-full relative preserve-3d"
          >
            {/* Front */}
            <div className="absolute inset-0 backface-hidden bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center shadow-xl">
              <div className="absolute top-6 left-6">
                <Sparkles className="w-5 h-5 text-electric-blue/30" />
              </div>
              <h3 className="text-xl md:text-2xl font-black text-[var(--text-primary)] leading-tight tracking-tight">
                {currentCard?.front}
              </h3>
              <p className="mt-6 text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest animate-pulse">Tap to reveal</p>
            </div>

            {/* Back */}
            <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-[var(--bg-secondary)] to-electric-blue/5 border border-electric-blue/30 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center shadow-2xl rotate-y-180">
              <div className="absolute top-6 right-6">
                <Brain className="w-5 h-5 text-electric-blue/40" />
              </div>
              <div className="max-h-full overflow-y-auto custom-scrollbar pr-2">
                <p className="text-base md:text-lg font-bold text-[var(--text-primary)] leading-relaxed">
                  {currentCard?.back}
                </p>
              </div>
              <p className="mt-6 text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Mastery: Advanced</p>
            </div>
          </motion.div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={(e) => { e.stopPropagation(); handleNext(false); }}
            className="flex-1 py-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-500/5 hover:border-red-500/30 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Review Later
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleNext(true); }}
            className="flex-1 py-4 bg-gradient-to-r from-electric-blue to-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-electric-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mastered
          </button>
        </div>
      </main>

      {/* Progress Bar */}
      <div className="fixed bottom-0 left-0 w-full h-1 bg-[var(--bg-secondary)]">
        <motion.div
          className="h-full bg-gradient-to-r from-electric-blue to-blue-500"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
