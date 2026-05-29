"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getQuizHistory } from "@/lib/firebase";

export default function HistoryPage() {
  const { user } = useAuth();
  
  const [history, setHistory] = useState<{ id: string; quizId: string; score: number; total: number; xpEarned: number; percentage: number; timestamp: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const hist = await getQuizHistory(user.uid);
        setHistory(hist.map((h: Record<string, unknown>) => ({
          id: String(h.id),
          quizId: String(h.quizId || "Quiz"),
          score: Number(h.score || 0),
          total: Number(h.total || 0),
          xpEarned: Number(h.xpEarned || 0),
          percentage: Number(h.percentage || 0),
          timestamp: h.completedAt && typeof h.completedAt === "object" && "seconds" in h.completedAt
            ? new Date((h.completedAt as { seconds: number }).seconds * 1000).toLocaleString("pt-BR")
            : "Recente"
        })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  return (
    <div className="max-w-3xl mx-auto py-6 animate-fade-up">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-2xl shadow-inner border border-indigo-500/20">
          ⏳
        </div>
        <div>
          <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-violet-500">Histórico de Quizzes</h1>
          <p className="text-sm font-medium text-[var(--color-text-muted)]">Acompanhe seu desempenho passado</p>
        </div>
      </div>

      <div className="glass-card-static rounded-3xl p-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-[var(--color-bg-secondary)] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 opacity-50 grayscale">📚</div>
            <p className="text-lg font-bold text-[var(--color-text-secondary)]">Nenhum quiz concluído ainda</p>
            <p className="text-sm text-[var(--color-text-muted)]">Complete aulas para desbloquear quizzes!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((h, i) => {
              const isGood = h.percentage >= 70;
              
              return (
                <div 
                  key={h.id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:shadow-md hover:border-indigo-500/30 transition-all duration-300 animate-fade-up"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="flex-1 mb-4 sm:mb-0">
                    <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">{h.timestamp}</p>
                    <h3 className="text-sm font-black text-[var(--color-text-primary)]">Quiz: {h.quizId}</h3>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className={`text-xl font-black ${isGood ? "text-emerald-500" : "text-amber-500"}`}>
                        {h.score}/{h.total}
                      </p>
                      <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Acertos</p>
                    </div>
                    
                    <div className="h-10 w-px bg-[var(--color-border)]" />
                    
                    <div className="text-center">
                      <p className={`text-xl font-black ${isGood ? "text-emerald-500" : "text-amber-500"}`}>
                        {h.percentage}%
                      </p>
                      <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Nota</p>
                    </div>

                    <div className="h-10 w-px bg-[var(--color-border)]" />
                    
                    <div className="text-center min-w-[60px]">
                      <p className="text-xl font-black text-indigo-500">+{h.xpEarned}</p>
                      <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">XP</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
