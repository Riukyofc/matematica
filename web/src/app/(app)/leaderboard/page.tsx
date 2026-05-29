"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getLeaderboard } from "@/lib/firebase";

export default function LeaderboardPage() {
  const { profile } = useAuth();
  const userName = profile?.name as string | undefined;

  const [players, setPlayers] = useState<{ uid: string; name: string; xp: number; level: number; pos: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getLeaderboard(10);
        setPlayers(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-6 animate-fade-up">
      <div className="text-center mb-10">
        <div className="inline-block p-3 rounded-2xl bg-indigo-500/10 text-indigo-500 mb-4 shadow-inner">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
        </div>
        <h1 className="text-3xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-violet-500">Ranking Global</h1>
        <p className="text-sm font-medium text-[var(--color-text-muted)]">Veja quem são os alunos mais dedicados!</p>
      </div>

      <div className="glass-card rounded-3xl p-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-[var(--color-bg-secondary)] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : players.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-[var(--color-text-muted)] font-medium">Nenhum aluno cadastrado ainda.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {players.map((p, i) => {
              const isYou = p.name === userName;
              const isTop3 = i <= 2;
              
              return (
                <div 
                  key={p.uid} 
                  className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 shadow-sm
                    ${isYou ? "bg-indigo-500/10 border-2 border-indigo-500/30" : "bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:shadow-md hover:-translate-y-0.5"}`}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black shrink-0 shadow-inner
                    ${i === 0 ? "bg-amber-500/20 text-amber-500 border border-amber-500/30" 
                    : i === 1 ? "bg-slate-300/20 text-slate-400 border border-slate-300/30" 
                    : i === 2 ? "bg-orange-700/20 text-orange-500 border border-orange-700/30" 
                    : "bg-[var(--color-bg-card)] text-[var(--color-text-muted)]"}`}
                  >
                    {isTop3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
                  </div>
                  
                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate flex items-center gap-2">
                        {p.name}
                        {isYou && <span className="px-2 py-0.5 rounded-md bg-indigo-500 text-white text-[9px] uppercase tracking-wider shadow-sm">Você</span>}
                      </p>
                      <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Nível {p.level}</p>
                    </div>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <p className="text-lg font-black text-indigo-500">{p.xp.toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">XP</p>
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
