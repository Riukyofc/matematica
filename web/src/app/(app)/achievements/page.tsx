"use client";

import { useAuth } from "@/contexts/AuthContext";
import { ACHIEVEMENT_DEFS } from "@/lib/firebase";
import { useState } from "react";

const EXTRA_ACHIEVEMENTS = [
  { id: "a9", icon: "🏃", title: "Maratonista", desc: "Sequência de 7 dias seguidos", check: (p: Record<string, unknown>) => (Number(p.streak) || 0) >= 7 },
  { id: "a10", icon: "🧮", title: "Calculadora Humana", desc: "5 quizzes perfeitos", check: (p: Record<string, unknown>) => (Number(p.perfectQuizzes) || 0) >= 5 },
  { id: "a11", icon: "⚔️", title: "Gladiador", desc: "Vença 3 duelos na Arena", check: (p: Record<string, unknown>) => (Number(p.duelsWon) || 0) >= 3 },
  { id: "a12", icon: "🛍️", title: "Colecionador", desc: "Compre 3 itens na loja", check: (p: Record<string, unknown>) => ((p.ownedItems as string[]) || []).length >= 3 },
];

const ALL_ACHIEVEMENTS = [...ACHIEVEMENT_DEFS, ...EXTRA_ACHIEVEMENTS];

const CATEGORIES = [
  { id: "all", label: "Todas" },
  { id: "study", label: "Estudo" },
  { id: "arena", label: "Arena" },
  { id: "social", label: "Social" },
];

function getCategory(id: string): string {
  if (["a1", "a3", "a4", "a5", "a6", "a8", "a10"].includes(id)) return "study";
  if (["a11"].includes(id)) return "arena";
  if (["a2", "a7", "a9", "a12"].includes(id)) return "social";
  return "study";
}

export default function AchievementsPage() {
  const { profile } = useAuth();
  const [filter, setFilter] = useState("all");
  
  const achievements = ALL_ACHIEVEMENTS.map(a => ({
    ...a,
    unlocked: profile ? a.check(profile) : false,
    category: getCategory(a.id),
  }));
  
  const filtered = filter === "all" ? achievements : achievements.filter(a => a.category === filter);
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="max-w-4xl mx-auto py-4 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="text-3xl">⭐</span>
          <div>
            <h1 className="text-2xl font-black">Conquistas</h1>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-muted)" }}>Seu progresso</p>
          </div>
        </div>
        <span className="text-lg font-black" style={{ color: "var(--color-primary)" }}>{unlockedCount}/{achievements.length}</span>
      </div>

      {/* Progress */}
      <div className="card p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold">Progresso Total</p>
          <span className="text-sm font-black" style={{ color: "var(--color-primary)" }}>{Math.round((unlockedCount / achievements.length) * 100)}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(unlockedCount / achievements.length) * 100}%` }} />
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 mb-6 animate-fade-up" style={{ animationDelay: "0.15s" }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === cat.id ? "tab-active" : "tab-inactive"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((a, i) => (
          <div 
            key={a.id} 
            className={`p-5 rounded-2xl transition-all duration-300 animate-fade-up group ${
              a.unlocked 
                ? "glass-card hover:-translate-y-1" 
                : "bg-[var(--color-bg-secondary)] border border-[var(--color-border)] opacity-60 hover:opacity-80"
            }`}
            style={{ animationDelay: `${0.2 + i * 0.04}s` }}
          >
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 transition-all ${
                a.unlocked 
                  ? "bg-gradient-to-br from-[var(--color-accent-subtle)] to-[var(--color-accent-glow)] shadow-inner animate-tilt-3d" 
                  : "bg-[var(--color-bg-input)] grayscale"
              }`}>
                {a.icon}
              </div>
              <div className="flex-1">
                <h3 className={`text-base font-bold mb-1 leading-tight ${a.unlocked ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"}`}>
                  {a.title}
                </h3>
                <p className="text-xs font-medium text-[var(--color-text-muted)] mb-3 leading-snug">{a.desc}</p>
                
                {a.unlocked ? (
                  <span className="badge badge-success">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    Desbloqueada
                  </span>
                ) : (
                  <span className="badge text-[var(--color-text-muted)] bg-[var(--color-bg-input)] border border-[var(--color-border)]">
                    🔒 Bloqueada
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
