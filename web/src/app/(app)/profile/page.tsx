"use client";

import { useAuth } from "@/contexts/AuthContext";
import { logoutUser } from "@/lib/firebase";

export default function ProfilePage() {
  const { user, profile } = useAuth();

  if (!user) return null;

  const name = user.displayName || String(profile?.name) || "Aluno";
  const email = user.email || "";
  const role = String(profile?.role || "STUDENT");
  const createdAt = profile?.createdAt && typeof profile.createdAt === "object" && "seconds" in (profile.createdAt as object)
    ? new Date(((profile.createdAt as { seconds: number }).seconds) * 1000).toLocaleDateString("pt-BR") : "—";
    
  const xp = Number(profile?.xp) || 0;
  const streak = Number(profile?.streak) || 0;
  const level = Math.floor(xp / 500) + 1;
  const quizzesCompleted = Number(profile?.quizzesCompleted) || 0;

  return (
    <div className="max-w-2xl mx-auto py-6 animate-fade-up">
      <h1 className="text-3xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-violet-500">Meu Perfil</h1>
      
      <div className="glass-card rounded-2xl p-6 mb-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center text-3xl font-black shadow-lg shadow-indigo-500/20 shrink-0">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 text-center sm:text-left z-10">
          <h2 className="text-2xl font-bold">{name}</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-3">{email}</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <span className="text-[10px] px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-500 font-bold border border-indigo-500/20">{role}</span>
            <span className="text-[10px] text-[var(--color-text-muted)] font-medium">Membro desde {createdAt}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { l: "XP Total", v: xp, c: "text-indigo-500" }, 
          { l: "Nível Atual", v: level, c: "text-violet-500" }, 
          { l: "Streak (Dias)", v: streak, c: "text-emerald-500" }, 
          { l: "Quizzes", v: quizzesCompleted, c: "text-amber-500" }
        ].map((s, i) => (
          <div key={s.l} className="p-5 rounded-2xl glass-card text-center animate-fade-up hover:-translate-y-1 transition-transform" style={{ animationDelay: `${i * 0.1}s` }}>
            <p className={`text-3xl font-black mb-1 ${s.c}`}>{s.v}</p>
            <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="p-6 rounded-2xl glass-card mb-8">
        <div className="flex justify-between text-xs font-bold mb-3">
          <span className="text-[var(--color-text-secondary)]">Nível {level} <span className="text-[var(--color-text-muted)] mx-2">→</span> Nível {level + 1}</span>
          <span className="text-indigo-500">{xp % 500} / 500 XP</span>
        </div>
        <div className="h-3 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden shadow-inner">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-1000 ease-out" style={{ width: `${((xp % 500) / 500) * 100}%` }} />
        </div>
      </div>

      <button 
        onClick={logoutUser} 
        className="w-full py-4 rounded-xl border-2 border-red-500/20 text-red-500 text-sm font-bold hover:bg-red-500 hover:text-white transition-all cursor-pointer shadow-sm hover:shadow-red-500/20"
      >
        Encerrar Sessão
      </button>
    </div>
  );
}
