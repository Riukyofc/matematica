"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Duel, submitDuelResult } from "@/lib/firebase";

interface ArenaPlayerProps {
  duel: Duel;
  onClose: () => void;
}

export default function ArenaPlayer({ duel, onClose }: ArenaPlayerProps) {
  const { user } = useAuth();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [finished, setFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const questions = duel.questions || [];
  const currentQ = questions[currentIdx];

  useEffect(() => {
    setStartTime(Date.now());
  }, []);

  const handleSelect = (idx: number) => {
    if (showAnswer || finished) return;
    setSelectedOption(idx);
    setShowAnswer(true);

    const isCorrect = idx === currentQ.correctIndex;
    if (isCorrect) setScore(s => s + 10);

    setTimeout(() => {
      if (currentIdx < questions.length - 1) {
        setCurrentIdx(c => c + 1);
        setSelectedOption(null);
        setShowAnswer(false);
      } else {
        handleFinish(score + (isCorrect ? 10 : 0));
      }
    }, 1200);
  };

  const handleFinish = async (finalScore: number) => {
    if (!user) return;
    setFinished(true);
    setIsSubmitting(true);
    const timeMs = Date.now() - startTime;
    
    try {
      await submitDuelResult(duel.id, user.uid, finalScore, timeMs);
    } catch (err) {
      console.error(err);
    }
    setIsSubmitting(false);
  };

  if (!user) return null;

  if (finished) {
    return (
      <div className="max-w-xl mx-auto text-center py-12 animate-fade-up">
        <h2 className="text-4xl font-black mb-4">
          {isSubmitting ? "⚔️ Calculando..." : "🎯 Duelo Concluído!"}
        </h2>
        
        {!isSubmitting && (
          <div className="glass-card p-8 flex flex-col items-center">
            <p className="text-[var(--color-text-secondary)] mb-6 font-medium">Sua pontuação final:</p>
            <div className="text-6xl font-black text-indigo-500 mb-2">{score}</div>
            <p className="text-sm font-bold text-[var(--color-text-muted)] mb-8 uppercase tracking-wider">Pontos</p>
            
            <p className="text-sm text-[var(--color-text-muted)] mb-6">
              O resultado será calculado quando seu oponente também finalizar o duelo. Se ele já jogou, você ganhou moedas e XP!
            </p>

            <button onClick={onClose} className="btn-primary w-full py-4 rounded-xl font-bold">
              Voltar para a Arena
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!currentQ) return null;

  return (
    <div className="max-w-2xl mx-auto py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-black text-indigo-500">Questão {currentIdx + 1} de {questions.length}</h2>
          <p className="text-sm font-bold text-[var(--color-text-muted)]">Valendo {duel.coinsReward} moedas de ouro</p>
        </div>
        <div className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500 animate-versus">
          ARENA
        </div>
      </div>

      <div className="glass-card p-6 md:p-8 mb-8">
        <h3 className="text-2xl font-bold mb-8 text-center">{currentQ.text}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentQ.options.map((opt, i) => {
            const isSelected = selectedOption === i;
            const isCorrect = i === currentQ.correctIndex;
            let btnClass = "border-[var(--color-border)] hover:border-indigo-500 bg-[var(--color-bg-secondary)]";
            
            if (showAnswer) {
              if (isCorrect) btnClass = "border-emerald-500 bg-emerald-500/10 text-emerald-600";
              else if (isSelected) btnClass = "border-red-500 bg-red-500/10 text-red-600";
              else btnClass = "border-[var(--color-border)] opacity-50";
            } else if (isSelected) {
              btnClass = "border-indigo-500 bg-indigo-500/10";
            }

            return (
              <button
                key={i}
                disabled={showAnswer}
                onClick={() => handleSelect(i)}
                className={`p-4 rounded-xl border-2 text-left font-bold text-lg transition-all duration-300 ${btnClass}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
