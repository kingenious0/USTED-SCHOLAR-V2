import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Loader2,
  Trophy,
  Brain
} from 'lucide-react';
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
        if (data.cards) setCards(data.cards);
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
       <div className="w-20 h-20 relative mb-8">
           <div className="absolute inset-0 bg-[var(--accent-primary)]/20 blur-2xl rounded-full animate-pulse" />
           <Loader2 className="w-20 h-20 text-[var(--accent-primary)] animate-spin relative z-10" />
       </div>
       <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2">Synthesizing Study Deck...</h2>
       <p className="text-[var(--text-tertiary)] font-bold uppercase tracking-widest text-xs">Extracting key concepts from {selectedFile?.name}</p>
    </div>
  );

  if (showResults) return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6 text-center transition-colors">
       <motion.div 
         initial={{ scale: 0.9, opacity: 0 }}
         animate={{ scale: 1, opacity: 1 }}
         className="bg-[var(--bg-secondary)] p-12 rounded-[3rem] max-w-md w-full relative overflow-hidden border border-[var(--border-color)] shadow-xl"
       >
          <Trophy className="w-20 h-20 text-[var(--accent-secondary)] mx-auto mb-6" />
          <h2 className="text-4xl font-black text-[var(--text-primary)] mb-2">Deck Complete</h2>
          <div className="text-6xl font-black text-[var(--accent-primary)] mb-8">
            {cards.length > 0 ? Math.round((masteredCount / cards.length) * 100) : 0}%
          </div>
          <p className="text-[var(--text-secondary)] font-medium mb-10 leading-relaxed">
             You mastered {masteredCount} out of {cards.length} concepts. Keep pushing for that 100% mastery!
          </p>
          <Link 
            to="/hub"
            className="w-full block py-5 bg-[var(--accent-primary)] text-white rounded-2xl font-extrabold text-lg shadow-xl shadow-[var(--accent-primary)]/20 active:scale-95 transition-all"
          >
            Back to Hub
          </Link>
       </motion.div>
    </div>
  );

  const currentCard = cards[currentIndex];

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-primary)] flex flex-col p-6 lg:p-12 transition-colors relative overflow-hidden">
      <header className="flex justify-between items-center mb-12 relative z-10">
        <Link to="/hub" className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all">
          <X className="w-6 h-6" />
        </Link>
        
        <div className="flex flex-col items-center">
           <span className="text-[10px] font-black text-[var(--accent-primary)] uppercase tracking-[0.3em] mb-1">Mastery Deck</span>
           <span className="text-xs font-black text-[var(--text-primary)]">{currentIndex + 1} / {cards.length}</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full">
           <Brain className="w-4 h-4 text-[var(--accent-secondary)]" />
           <span className="text-xs font-black text-[var(--text-primary)]">{masteredCount}</span>
        </div>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full flex flex-col justify-center gap-12 relative z-10">
        <div className="perspective-1000 h-[400px] w-full cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
          <motion.div 
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-full h-full relative preserve-3d"
          >
            {/* Front */}
            <div className="absolute inset-0 backface-hidden bg-[var(--bg-secondary)] border-2 border-[var(--border-color)] rounded-[3rem] p-10 flex flex-col items-center justify-center text-center shadow-xl">
               <div className="absolute top-8 left-8">
                  <Sparkles className="w-5 h-5 text-[var(--accent-primary)]/30" />
               </div>
               <h3 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] leading-tight tracking-tight uppercase">
                 {currentCard?.front}
               </h3>
               <p className="mt-8 text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest animate-pulse">Click to flip</p>
            </div>

            {/* Back */}
            <div className="absolute inset-0 backface-hidden bg-[var(--bg-secondary)] border-2 border-[var(--accent-primary)]/30 rounded-[3rem] p-10 flex flex-col items-center justify-center text-center shadow-2xl rotate-y-180">
               <div className="absolute top-8 right-8">
                  <Brain className="w-5 h-5 text-[var(--accent-secondary)]/30" />
               </div>
               <div className="max-h-full overflow-y-auto custom-scrollbar pr-2">
                 <p className="text-lg md:text-xl font-bold text-[var(--text-primary)] leading-relaxed">
                   {currentCard?.back}
                 </p>
               </div>
               <p className="mt-8 text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Mastery Level: Advanced</p>
            </div>
          </motion.div>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={(e) => { e.stopPropagation(); handleNext(false); }}
            className="flex-1 py-5 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-500/5 hover:border-red-500/30 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Review Later
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleNext(true); }}
            className="flex-1 py-5 bg-[var(--accent-primary)] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[var(--accent-primary)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mastered
          </button>
        </div>
      </main>

      {/* Progress Bar */}
      <div className="fixed bottom-0 left-0 w-full h-1.5 bg-[var(--bg-secondary)]">
        <motion.div 
          className="h-full bg-[var(--accent-primary)]"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
