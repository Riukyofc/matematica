"use client";

import { useAuth } from "@/contexts/AuthContext";
import { ACHIEVEMENT_DEFS } from "@/lib/firebase";

export default function AchievementsPage() {
  const { profile } = useAuth();
  
  const achievements = ACHIEVEMENT_DEFS.map(a => ({
    ...a,
    unlocked: profile ? a.check(profile) : false,
  }));
  
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="max-w-4xl mx-auto py-6 animate-fade-up">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black mb-1 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-violet-500">Conquistas</h1>
          <p className="text-sm font-medium text-[var(--color-text-muted)]">Acompanhe seu progresso e medalhas</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-indigo-500">{unlockedCount} / {achievements.length}</p>
          <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Desbloqueadas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((a, i) => (
          <div 
            key={a.id} 
            className={`p-5 rounded-3xl transition-all duration-300 ${a.unlocked ? "glass-card hover:-translate-y-1 shadow-sm" : "bg-[var(--color-bg-secondary)] border border-[var(--color-border)] opacity-60 grayscale hover:grayscale-0"}`}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 ${a.unlocked ? "bg-gradient-to-br from-indigo-500/20 to-violet-500/20 shadow-inner" : "bg-[var(--color-bg-input)]"}`}>
                {a.icon}
              </div>
              <div className="flex-1">
                <h3 className={`text-base font-bold mb-1 leading-tight ${a.unlocked ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"}`}>{a.title}</h3>
                <p className="text-xs font-medium text-[var(--color-text-muted)] mb-3 leading-snug">{a.desc}</p>
                
                {a.unlocked && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 text-[10px] font-bold border border-emerald-500/20 shadow-sm">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    Desbloqueada
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
