"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  registerUser, loginUser, logoutUser, onAuthChange,
  getUserProfile, saveQuizResult, saveNote, getNote, deleteNote,
  saveInfraction, getLeaderboard, addStudyTime, updateStreak,
  getQuizHistory,
} from "@/lib/firebase";
import type { User } from "firebase/auth";

/* ================================================================
   Saberes em Conexão — v2.0
   ================================================================ */

// ─── DATA ────────────────────────────────────────────────────────
const TRACKS = [
  { id: "t1", title: "Álgebra", icon: "📐", desc: "Equações, sistemas e inequações", lessons: [
    { id: "l1", title: "Equações do 1º Grau", completed: true, xp: 50, video: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
    { id: "l2", title: "Equações do 2º Grau", completed: true, xp: 60, video: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
    { id: "l3", title: "Sistemas de Equações", completed: false, xp: 70, video: "https://www.youtube.com/embed/DhJwnVAbsYA" },
    { id: "l4", title: "Inequações", completed: false, xp: 55, video: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  ]},
  { id: "t2", title: "Geometria", icon: "📏", desc: "Formas, ângulos e medidas", lessons: [
    { id: "l5", title: "Ângulos e Triângulos", completed: true, xp: 45, video: "" },
    { id: "l6", title: "Polígonos Regulares", completed: false, xp: 50, video: "" },
    { id: "l7", title: "Circunferência", completed: false, xp: 65, video: "" },
  ]},
  { id: "t3", title: "Frações", icon: "🔢", desc: "Operações e porcentagem", lessons: [
    { id: "l8", title: "Operações com Frações", completed: true, xp: 40, video: "" },
    { id: "l9", title: "Números Decimais", completed: true, xp: 40, video: "" },
    { id: "l10", title: "Porcentagem", completed: false, xp: 55, video: "" },
  ]},
  { id: "t4", title: "Estatística", icon: "📊", desc: "Médias, gráficos e dados", lessons: [
    { id: "l11", title: "Média, Moda e Mediana", completed: false, xp: 45, video: "" },
    { id: "l12", title: "Gráficos e Tabelas", completed: false, xp: 50, video: "" },
  ]},
];

const QUIZ_QUESTIONS = [
  { id: "q1", text: "Qual é o valor de x na equação 2x + 6 = 0?", options: ["x = 3", "x = -3", "x = 6", "x = -6"], correct: 1 },
  { id: "q2", text: "Se 3x - 9 = 6, quanto vale x?", options: ["x = 3", "x = -5", "x = 5", "x = 1"], correct: 2 },
  { id: "q3", text: "Qual é a forma geral de uma equação do 1º grau?", options: ["ax² + bx + c = 0", "ax + b = 0", "a/x + b = 0", "ax³ = b"], correct: 1 },
  { id: "q4", text: "Resolva: 5x + 10 = 0", options: ["x = 2", "x = -2", "x = 5", "x = -10"], correct: 1 },
  { id: "q5", text: "Na equação 4x - 8 = 16, o valor de x é:", options: ["x = 2", "x = 4", "x = 6", "x = 8"], correct: 2 },
];

const ACHIEVEMENTS = [
  { id: "a1", icon: "🏆", title: "Primeiro Passo", desc: "Complete seu primeiro quiz", unlocked: true },
  { id: "a2", icon: "🔥", title: "Em Chamas", desc: "3 quizzes seguidos sem erro", unlocked: true },
  { id: "a3", icon: "⚡", title: "Veloz", desc: "Quiz em menos de 2 minutos", unlocked: true },
  { id: "a4", icon: "🎯", title: "Perfeição", desc: "100% em um quiz", unlocked: false },
  { id: "a5", icon: "💎", title: "Dedicado", desc: "Complete 10 trilhas", unlocked: false },
  { id: "a6", icon: "👑", title: "Mestre", desc: "Acumule 5000 XP", unlocked: false },
  { id: "a7", icon: "📝", title: "Anotador", desc: "Salve 5 anotações", unlocked: false },
  { id: "a8", icon: "🧮", title: "Calculista", desc: "Use a calculadora 10 vezes", unlocked: false },
];

const FORMULAS = [
  { cat: "Álgebra", items: [
    { name: "Equação 1º Grau", formula: "ax + b = 0 → x = -b/a" },
    { name: "Equação 2º Grau", formula: "x = (-b ± √(b²-4ac)) / 2a" },
    { name: "Produto Notável", formula: "(a+b)² = a² + 2ab + b²" },
    { name: "Diferença de Quadrados", formula: "a² - b² = (a+b)(a-b)" },
  ]},
  { cat: "Geometria", items: [
    { name: "Área do Triângulo", formula: "A = (b × h) / 2" },
    { name: "Área do Círculo", formula: "A = π × r²" },
    { name: "Perímetro do Círculo", formula: "P = 2 × π × r" },
    { name: "Teorema de Pitágoras", formula: "a² = b² + c²" },
  ]},
  { cat: "Estatística", items: [
    { name: "Média Aritmética", formula: "M = Σx / n" },
    { name: "Porcentagem", formula: "P = (parte / total) × 100" },
  ]},
];

type AppView = "dashboard" | "lesson" | "quiz" | "achievements" | "leaderboard" | "rules" | "profile" | "calculator" | "formulas" | "notes" | "history";

// ─── Toast System ────────────────────────────────────────────────
type Toast = { id: number; message: string; type: "success" | "error" | "info" };
let toastId = 0;

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] space-y-2 max-w-xs">
      {toasts.map((t) => (
        <div key={t.id} onClick={() => onRemove(t.id)}
          className={`px-4 py-3 rounded-xl text-sm font-medium cursor-pointer shadow-lg border ${
            t.type === "success" ? "bg-[#161] border-[#282] text-[#6f6]" :
            t.type === "error" ? "bg-[#311] border-[#522] text-[#f66]" :
            "bg-[#111] border-[#333] text-white"
          }`}
          style={{ animation: "fadeUp 0.3s ease-out" }}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════
export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const unsub = onAuthChange(async (u) => {
      setUser(u);
      if (u) { try { setProfile(await getUserProfile(u.uid)); } catch { setProfile(null); } }
      else setProfile(null);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return <LoadingScreen />;
  if (!user) return <AuthScreen />;
  return <AppShell user={user} profile={profile} setProfile={setProfile} />;
}

// ═══════════════════════════════════════════════════════════════
// LOADING
// ═══════════════════════════════════════════════════════════════
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
      <div className="text-center" style={{ animation: "fadeIn 0.4s ease" }}>
        <img src="/logo.jpeg" alt="Logo" className="w-20 h-20 rounded-2xl mx-auto mb-4 object-cover" />
        <div className="w-5 h-5 border-2 border-[var(--color-border)] border-t-white rounded-full mx-auto" style={{ animation: "spin 0.8s linear infinite" }} />
        <p className="text-xs text-[var(--color-text-muted)] mt-3">Carregando...</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════
function AuthScreen() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      if (mode === "register") {
        if (!name.trim()) { setError("Nome obrigatório"); setLoading(false); return; }
        if (password.length < 6) { setError("Mínimo 6 caracteres"); setLoading(false); return; }
        await registerUser(name.trim(), email.trim(), password);
      } else {
        await loginUser(email.trim(), password);
      }
    } catch (err: unknown) {
      const c = (err as { code?: string }).code;
      const msgs: Record<string, string> = {
        "auth/email-already-in-use": "Email já cadastrado",
        "auth/invalid-email": "Email inválido",
        "auth/weak-password": "Senha muito fraca",
        "auth/invalid-credential": "Email ou senha incorretos",
        "auth/user-not-found": "Usuário não encontrado",
        "auth/wrong-password": "Senha incorreta",
      };
      setError(msgs[c || ""] || "Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--color-bg-primary)]">
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 border-r border-[var(--color-border)] relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#111] to-[#000]" />
        <div className="relative z-10 text-center max-w-md">
          <img src="/logo.jpeg" alt="Logo" className="w-36 h-36 rounded-3xl mx-auto mb-8 object-cover shadow-2xl" style={{ animation: "fadeUp 0.6s ease-out" }} />
          <h1 className="text-3xl font-extrabold mb-2" style={{ animation: "fadeUp 0.6s ease-out 0.1s both" }}>Saberes em Conexão</h1>
          <p className="text-[var(--color-text-muted)] text-sm mb-8" style={{ animation: "fadeUp 0.6s ease-out 0.2s both" }}>Conhecer • Conectar • Transformar</p>
          <div className="grid grid-cols-3 gap-3" style={{ animation: "fadeUp 0.6s ease-out 0.3s both" }}>
            {[{ n: "12", l: "Aulas" }, { n: "50+", l: "Questões" }, { n: "4", l: "Trilhas" }].map(s => (
              <div key={s.l} className="p-3 rounded-xl bg-white/5 border border-white/10"><p className="text-lg font-bold">{s.n}</p><p className="text-[10px] text-[var(--color-text-muted)]">{s.l}</p></div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm" style={{ animation: "fadeUp 0.5s ease-out" }}>
          <div className="lg:hidden text-center mb-6">
            <img src="/logo.jpeg" alt="Logo" className="w-16 h-16 rounded-xl mx-auto mb-2 object-cover" />
            <h1 className="text-lg font-bold">Saberes em Conexão</h1>
          </div>

          <h2 className="text-xl font-bold mb-1">{mode === "login" ? "Entrar" : "Criar conta"}</h2>
          <p className="text-xs text-[var(--color-text-muted)] mb-6">{mode === "login" ? "Acesse sua conta" : "Preencha seus dados"}</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 text-[var(--color-error)] text-xs" style={{ animation: "shake 0.4s ease" }}>⚠ {error}</div>
          )}

          <form onSubmit={submit} className="space-y-3">
            {mode === "register" && (
              <div><label className="block text-[10px] font-medium text-[var(--color-text-muted)] mb-1 uppercase tracking-wider">Nome</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Seu nome completo" className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-white/30 transition" />
              </div>
            )}
            <div><label className="block text-[10px] font-medium text-[var(--color-text-muted)] mb-1 uppercase tracking-wider">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com" className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-white/30 transition" />
            </div>
            <div><label className="block text-[10px] font-medium text-[var(--color-text-muted)] mb-1 uppercase tracking-wider">Senha</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••" minLength={6} className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-white/30 transition pr-10" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-white transition cursor-pointer text-xs">{showPass ? "Ocultar" : "Mostrar"}</button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg bg-white text-black text-sm font-bold hover:bg-white/90 active:scale-[0.98] transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2">
              {loading ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full" style={{ animation: "spin 0.7s linear infinite" }} /> : mode === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-[var(--color-text-muted)]">
            {mode === "login" ? "Não tem conta?" : "Já tem conta?"}
            <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} className="ml-1 text-white font-semibold hover:underline cursor-pointer">
              {mode === "login" ? "Cadastre-se" : "Entrar"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// APP SHELL
// ═══════════════════════════════════════════════════════════════
function AppShell({ user, profile }: { user: User; profile: Record<string, unknown> | null; setProfile: (p: Record<string, unknown> | null) => void }) {
  const [view, setView] = useState<AppView>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [xp, setXp] = useState(Number(profile?.xp) || 0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [selectedLesson, setSelectedLesson] = useState("l3");

  const name = user.displayName || String(profile?.name) || "Aluno";
  const level = Math.floor(xp / 500) + 1;
  const streak = Number(profile?.streak) || 0;
  const totalLessons = TRACKS.reduce((a, t) => a + t.lessons.length, 0);
  const doneLessons = TRACKS.reduce((a, t) => a + t.lessons.filter(l => l.completed).length, 0);

  const toast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = ++toastId;
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  const go = (v: AppView) => { setView(v); setSidebarOpen(false); };

  const navItems: { id: AppView; label: string; sep?: boolean }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "lesson", label: "Aula Atual" },
    { id: "achievements", label: "Conquistas" },
    { id: "leaderboard", label: "Ranking" },
    { id: "calculator", label: "Calculadora", sep: true },
    { id: "formulas", label: "Fórmulas" },
    { id: "notes", label: "Anotações" },
    { id: "history", label: "Histórico" },
    { id: "rules", label: "Regras", sep: true },
    { id: "profile", label: "Meu Perfil" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg-primary)]">
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-56 flex flex-col bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)] transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--color-border)]">
          <img src="/logo.jpeg" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
          <div className="min-w-0"><h1 className="text-xs font-bold truncate">Saberes em Conexão</h1><p className="text-[8px] text-[var(--color-text-muted)] uppercase tracking-widest">Projeto Interdisciplinar</p></div>
        </div>

        <div className="px-3 py-2.5 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">{name.charAt(0).toUpperCase()}</div>
            <div className="flex-1 min-w-0"><p className="text-[11px] font-semibold truncate">{name}</p><p className="text-[9px] text-[var(--color-text-muted)]">Nv.{level} • {xp} XP</p></div>
          </div>
          <div className="h-1 bg-[var(--color-bg-primary)] rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-white/60 transition-all duration-700" style={{ width: `${((xp % 500) / 500) * 100}%` }} />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-1.5 px-2">
          {navItems.map((item) => (
            <div key={item.id}>
              {item.sep && <div className="h-px bg-[var(--color-border)] my-1.5 mx-2" />}
              <button onClick={() => go(item.id)} className={`w-full text-left px-3 py-1.5 rounded-lg text-[12px] transition-all cursor-pointer ${view === item.id ? "bg-white/10 text-white font-semibold" : "text-[var(--color-text-secondary)] hover:bg-white/5 hover:text-white"}`}>
                {item.label}
              </button>
            </div>
          ))}
        </nav>

        <div className="px-3 py-2 border-t border-[var(--color-border)]">
          {streak > 0 && (
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/5 mb-2 text-[11px]">
              <span>🔥</span><span className="font-semibold">{streak} dias seguidos</span>
            </div>
          )}
          <button onClick={logoutUser} className="w-full text-left px-2 py-1.5 rounded-lg text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/5 transition cursor-pointer">
            Sair da conta
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-2.5 bg-[var(--color-bg-primary)]/80 backdrop-blur-xl border-b border-[var(--color-border)] lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-8 h-8 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)] flex items-center justify-center cursor-pointer">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <h2 className="text-sm font-bold flex-1">{navItems.find(n => n.id === view)?.label || "Dashboard"}</h2>
          <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-[var(--color-text-muted)] font-mono">{xp} XP</span>
        </div>

        <div className="p-4 lg:p-6 max-w-5xl mx-auto">
          {view === "dashboard" && <DashboardView name={name} xp={xp} level={level} streak={streak} done={doneLessons} total={totalLessons} go={go} profile={profile} />}
          {view === "lesson" && <LessonView lessonId={selectedLesson} uid={user.uid} onStartQuiz={() => go("quiz")} toast={toast} />}
          {view === "quiz" && <QuizView uid={user.uid} onFinish={s => { const e = s * 10; setXp(p => p + e); toast(`+${e} XP ganhos!`, "success"); go("dashboard"); }} onBack={() => go("lesson")} toast={toast} />}
          {view === "achievements" && <AchievementsView xp={xp} />}
          {view === "leaderboard" && <LeaderboardView userName={name} userXp={xp} />}
          {view === "rules" && <RulesView />}
          {view === "profile" && <ProfileView user={user} profile={profile} xp={xp} level={level} streak={streak} />}
          {view === "calculator" && <CalculatorView />}
          {view === "formulas" && <FormulasView />}
          {view === "notes" && <NotesView uid={user.uid} toast={toast} />}
          {view === "history" && <HistoryView uid={user.uid} />}
        </div>
      </main>

      <ToastContainer toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════
function DashboardView({ name, xp, level, streak, done, total, go, profile }: { name: string; xp: number; level: number; streak: number; done: number; total: number; go: (v: AppView) => void; profile: Record<string, unknown> | null }) {
  const studyMins = Number(profile?.totalStudyMinutes) || 0;
  const quizzes = Number(profile?.quizzesCompleted) || 0;

  return (
    <div style={{ animation: "fadeUp 0.4s ease-out" }}>
      <h1 className="text-xl font-extrabold mb-0.5">Olá, {name} 👋</h1>
      <p className="text-xs text-[var(--color-text-muted)] mb-5">Continue de onde parou</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-5">
        {[
          { l: "XP Total", v: xp.toLocaleString(), i: "⚡" },
          { l: "Nível", v: level, i: "◆" },
          { l: "Sequência", v: `${streak} dias`, i: "🔥" },
          { l: "Quizzes", v: quizzes, i: "✓" },
        ].map((s, i) => (
          <div key={s.l} className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)]" style={{ animation: `fadeUp 0.3s ease-out ${i * 0.05}s both` }}>
            <span className="text-base mb-1 block">{s.i}</span>
            <p className="text-lg font-extrabold">{s.v}</p>
            <p className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider">{s.l}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2 mb-5" style={{ animation: "fadeUp 0.3s ease-out 0.2s both" }}>
        {[
          { l: "Calculadora", i: "🧮", v: "calculator" as AppView },
          { l: "Fórmulas", i: "📐", v: "formulas" as AppView },
          { l: "Anotações", i: "📝", v: "notes" as AppView },
        ].map(a => (
          <button key={a.l} onClick={() => go(a.v)} className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-card-hover)] transition cursor-pointer text-center">
            <span className="text-lg block mb-1">{a.i}</span>
            <span className="text-[10px] text-[var(--color-text-secondary)]">{a.l}</span>
          </button>
        ))}
      </div>

      <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] mb-5 cursor-pointer hover:border-[var(--color-border-hover)] transition group" onClick={() => go("lesson")} style={{ animation: "fadeUp 0.3s ease-out 0.25s both" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-lg group-hover:bg-white/10 transition">📐</div>
          <div className="flex-1">
            <p className="text-[9px] uppercase tracking-widest text-[var(--color-text-muted)]">Continuar</p>
            <h3 className="text-sm font-bold">Sistemas de Equações</h3>
            <div className="flex items-center gap-2 mt-1"><div className="flex-1 h-1 bg-[var(--color-bg-primary)] rounded-full overflow-hidden"><div className="h-full w-1/2 rounded-full bg-white/50" /></div><span className="text-[9px] text-[var(--color-text-muted)]">50%</span></div>
          </div>
          <svg className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-white transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M9 5l7 7-7 7" /></svg>
        </div>
      </div>

      <h2 className="text-sm font-bold mb-2.5" style={{ animation: "fadeUp 0.3s ease-out 0.3s both" }}>Trilhas</h2>
      <div className="grid sm:grid-cols-2 gap-2.5">
        {TRACKS.map((t, i) => {
          const d = t.lessons.filter(l => l.completed).length;
          const p = Math.round((d / t.lessons.length) * 100);
          return (
            <div key={t.id} onClick={() => go("lesson")} className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] cursor-pointer hover:border-[var(--color-border-hover)] transition" style={{ animation: `fadeUp 0.3s ease-out ${0.35 + i * 0.05}s both` }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{t.icon}</span>
                <div className="flex-1"><h3 className="text-xs font-bold">{t.title}</h3><p className="text-[9px] text-[var(--color-text-muted)]">{t.desc}</p></div>
                <span className="text-[10px] font-bold text-[var(--color-text-secondary)]">{p}%</span>
              </div>
              <div className="h-1 bg-[var(--color-bg-primary)] rounded-full overflow-hidden"><div className="h-full rounded-full bg-white/40 transition-all" style={{ width: `${p}%` }} /></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// LESSON
// ═══════════════════════════════════════════════════════════════
function LessonView({ lessonId, uid, onStartQuiz, toast }: { lessonId: string; uid: string; onStartQuiz: () => void; toast: (m: string, t?: Toast["type"]) => void }) {
  const [elapsed, setElapsed] = useState(0);
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [saving, setSaving] = useState(false);
  const MIN = 20;
  const unlocked = elapsed >= MIN;
  const progress = Math.min(1, elapsed / MIN);

  useEffect(() => { if (unlocked) return; const t = setInterval(() => setElapsed(v => v + 1), 1000); return () => clearInterval(t); }, [unlocked]);

  // Load existing note
  useEffect(() => { (async () => { try { const n = await getNote(uid, lessonId); if (n) setNote(String(n.content)); } catch {} })(); }, [uid, lessonId]);

  const handleSaveNote = async () => {
    setSaving(true);
    try { await saveNote(uid, lessonId, note); toast("Anotação salva!", "success"); } catch { toast("Erro ao salvar", "error"); }
    setSaving(false);
  };

  return (
    <div style={{ animation: "fadeUp 0.4s ease-out" }}>
      <div className="text-[10px] text-[var(--color-text-muted)] mb-4">Trilhas › Álgebra › <span className="text-white">Sistemas de Equações</span></div>
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-lg font-extrabold">Sistemas de Equações</h1><p className="text-[10px] text-[var(--color-text-muted)]">Aula 3 de 4 • 70 XP</p></div>
        <button onClick={() => setShowNote(!showNote)} className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition cursor-pointer ${showNote ? "bg-white/10 border-white/20 text-white" : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white"}`}>
          📝 Anotações
        </button>
      </div>

      {/* Video */}
      <div className="rounded-xl overflow-hidden border border-[var(--color-border)] bg-black mb-4" style={{ animation: "fadeUp 0.3s ease-out 0.1s both" }}>
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <iframe className="absolute inset-0 w-full h-full" src="https://www.youtube.com/embed/DhJwnVAbsYA?rel=0&modestbranding=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="Videoaula" />
        </div>
      </div>

      {/* Note panel */}
      {showNote && (
        <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] mb-4" style={{ animation: "fadeUp 0.2s ease-out" }}>
          <h3 className="text-xs font-bold mb-2">📝 Suas anotações para esta aula</h3>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={4} placeholder="Escreva suas anotações aqui... Elas serão salvas no Firebase." className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-sm placeholder:text-[var(--color-text-muted)] resize-none focus:outline-none focus:border-white/20 transition" />
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={handleSaveNote} disabled={saving} className="px-4 py-1.5 rounded-lg bg-white text-black text-[11px] font-bold hover:bg-white/90 transition cursor-pointer disabled:opacity-50">
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      )}

      {/* Unlock */}
      <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3" style={{ animation: "fadeUp 0.3s ease-out 0.2s both" }}>
        <div className="flex-1 w-full">
          <div className="flex justify-between text-[11px] mb-1">
            <span>{unlocked ? <span className="text-[var(--color-success)]">✓ Desbloqueado</span> : `Aguarde ${Math.max(0, MIN - elapsed)}s`}</span>
            <span className="text-[var(--color-text-muted)]">{Math.round(progress * 100)}%</span>
          </div>
          <div className="h-1.5 bg-[var(--color-bg-primary)] rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-1000" style={{ width: `${progress * 100}%`, background: unlocked ? "var(--color-success)" : "#fff", opacity: unlocked ? 1 : 0.5 }} /></div>
        </div>
        <button onClick={onStartQuiz} disabled={!unlocked} className={`shrink-0 px-5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${unlocked ? "bg-white text-black hover:bg-white/90 active:scale-95" : "bg-[var(--color-bg-input)] text-[var(--color-text-muted)] cursor-not-allowed border border-[var(--color-border)]"}`}>
          {unlocked ? "Iniciar Quiz →" : "🔒 Aguarde"}
        </button>
      </div>

      {/* Content */}
      <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] space-y-4" style={{ animation: "fadeUp 0.3s ease-out 0.3s both" }}>
        <h3 className="text-sm font-bold">Material de Apoio</h3>
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">Um <strong className="text-white">sistema de equações</strong> é um conjunto de equações que devem ser satisfeitas simultaneamente.</p>
        <div className="p-3 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] font-mono text-xs"><p className="text-[var(--color-text-muted)]">{"{"}</p><p className="pl-3">2x + y = 10</p><p className="pl-3">x - y = 2</p><p className="text-[var(--color-text-muted)]">{"}"}</p></div>
        <div><h4 className="text-xs font-bold mb-2">Resolução por Substituição</h4>
          <ol className="space-y-1.5 text-xs text-[var(--color-text-secondary)]">
            {["Isole: x = y + 2", "Substitua: 2(y+2) + y = 10", "Resolva: 3y = 6 → y = 2", "Encontre: x = 4"].map((s, i) => (
              <li key={i} className="flex gap-2"><span className="w-4 h-4 rounded bg-white/10 flex items-center justify-center text-[8px] font-bold shrink-0">{i + 1}</span>{s}</li>
            ))}
          </ol>
        </div>
        <div className="p-3 rounded-lg bg-white/[0.03] border-l-2 border-white/20 text-xs text-[var(--color-text-secondary)]"><strong className="text-white">💡</strong> Verifique substituindo os valores nas equações originais.</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// QUIZ (same as before but with infraction logging)
// ═══════════════════════════════════════════════════════════════
function QuizView({ uid, onFinish, onBack, toast }: { uid: string; onFinish: (s: number) => void; onBack: () => void; toast: (m: string, t?: Toast["type"]) => void }) {
  const [cur, setCur] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [results, setResults] = useState<(boolean | null)[]>(QUIZ_QUESTIONS.map(() => null));
  const [time, setTime] = useState(120);
  const [warns, setWarns] = useState(0);
  const q = QUIZ_QUESTIONS[cur];

  useEffect(() => { if (done) return; const t = setInterval(() => setTime(v => { if (v <= 1) { clearInterval(t); setDone(true); return 0; } return v - 1; }), 1000); return () => clearInterval(t); }, [done]);

  useEffect(() => {
    const h = () => { if (document.hidden && !done) {
      setWarns(w => {
        const n = w + 1;
        toast(`⚠ Saída detectada (${n}/3)`, "error");
        saveInfraction(uid, "SCREEN_EXIT", `Saída de tela ${n}/3 durante quiz`).catch(() => {});
        if (n >= 3) setDone(true);
        return n;
      });
    }};
    document.addEventListener("visibilitychange", h);
    return () => document.removeEventListener("visibilitychange", h);
  }, [done, uid, toast]);

  useEffect(() => {
    const h = (e: Event) => e.preventDefault();
    document.addEventListener("copy", h);
    document.addEventListener("contextmenu", h);
    return () => { document.removeEventListener("copy", h); document.removeEventListener("contextmenu", h); };
  }, []);

  const confirm = () => { if (sel === null) return; const ok = sel === q.correct; if (ok) setScore(s => s + 1); const r = [...results]; r[cur] = ok; setResults(r); setAnswered(true); };
  const next = () => {
    if (cur < QUIZ_QUESTIONS.length - 1) { setCur(c => c + 1); setSel(null); setAnswered(false); }
    else { setDone(true); try { saveQuizResult(uid, "quiz-sistemas", score, QUIZ_QUESTIONS.length, score * 10); } catch {} }
  };

  if (done) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]" style={{ animation: "fadeUp 0.4s ease-out" }}>
        <div className="text-center max-w-sm w-full p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)]">
          {warns >= 3 && <div className="mb-3 p-2.5 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 text-[var(--color-error)] text-xs">⚠ Quiz cancelado: {warns} saídas de tela</div>}
          <div className="text-4xl mb-3" style={{ animation: "pop 0.5s ease-out" }}>{score >= 4 ? "🏆" : score >= 3 ? "⭐" : "📝"}</div>
          <h2 className="text-lg font-extrabold mb-1">{warns >= 3 ? "Cancelado" : score >= 4 ? "Excelente!" : score >= 3 ? "Bom!" : "Continue!"}</h2>
          <div className="flex justify-center gap-6 my-4">
            <div><p className="text-xl font-extrabold">{score}/{QUIZ_QUESTIONS.length}</p><p className="text-[9px] text-[var(--color-text-muted)] uppercase">Acertos</p></div>
            <div><p className="text-xl font-extrabold text-[var(--color-success)]">+{score * 10}</p><p className="text-[9px] text-[var(--color-text-muted)] uppercase">XP</p></div>
          </div>
          <div className="flex justify-center gap-1 mb-5">{results.map((r, i) => (<div key={i} className={`w-6 h-6 rounded text-[9px] font-bold flex items-center justify-center border ${r === true ? "border-[var(--color-success)]/30 text-[var(--color-success)]" : r === false ? "border-[var(--color-error)]/30 text-[var(--color-error)]" : "border-[var(--color-border)] text-[var(--color-text-muted)]"}`}>{r === true ? "✓" : r === false ? "✗" : "–"}</div>))}</div>
          <button onClick={() => onFinish(score)} className="w-full py-2.5 rounded-lg bg-white text-black text-sm font-bold hover:bg-white/90 active:scale-95 transition cursor-pointer">Voltar</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeUp 0.3s ease-out" }}>
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-[11px] text-[var(--color-text-muted)] hover:text-white transition cursor-pointer">← Voltar</button>
        <div className="flex items-center gap-2">
          {warns > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--color-warning)]/10 text-[var(--color-warning)] font-bold">⚠{warns}/3</span>}
          <span className={`text-[11px] font-mono px-2 py-1 rounded border ${time <= 30 ? "border-[var(--color-error)]/30 text-[var(--color-error)]" : "border-[var(--color-border)]"}`}>{Math.floor(time / 60)}:{(time % 60).toString().padStart(2, "0")}</span>
        </div>
      </div>

      <div className="flex gap-1 mb-5">{QUIZ_QUESTIONS.map((_, i) => (<div key={i} className={`flex-1 h-1 rounded-full transition ${i < cur ? (results[i] ? "bg-[var(--color-success)]" : "bg-[var(--color-error)]") : i === cur ? "bg-white" : "bg-[var(--color-border)]"}`} />))}</div>

      <div key={cur} className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] mb-4" style={{ animation: "slideIn 0.3s ease-out" }}>
        <p className="text-[10px] text-[var(--color-text-muted)] mb-2">Pergunta {cur + 1}/{QUIZ_QUESTIONS.length}</p>
        <h3 className="text-base font-bold mb-5">{q.text}</h3>
        <div className="space-y-2">
          {q.options.map((opt, idx) => {
            const L = String.fromCharCode(65 + idx);
            let cls = "border-[var(--color-border)] text-[var(--color-text-secondary)]";
            if (answered && idx === q.correct) cls = "border-[var(--color-success)]/40 text-[var(--color-success)] bg-[var(--color-success)]/5";
            else if (answered && idx === sel) cls = "border-[var(--color-error)]/40 text-[var(--color-error)] bg-[var(--color-error)]/5";
            else if (sel === idx) cls = "border-white/30 text-white bg-white/5";
            return (
              <button key={idx} onClick={() => !answered && setSel(idx)} disabled={answered}
                className={`w-full flex items-center gap-2.5 p-3 rounded-lg border text-left text-sm transition ${!answered ? "cursor-pointer hover:border-white/20" : ""} ${cls}`}
                style={answered && idx === sel && idx !== q.correct ? { animation: "shake 0.3s ease" } : {}}>
                <span className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold bg-white/5">{answered && idx === q.correct ? "✓" : answered && idx === sel ? "✗" : L}</span>
                <span className="font-medium text-xs">{opt}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        {!answered ? (
          <button onClick={confirm} disabled={sel === null} className={`px-5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${sel !== null ? "bg-white text-black active:scale-95" : "bg-[var(--color-bg-input)] text-[var(--color-text-muted)] cursor-not-allowed border border-[var(--color-border)]"}`}>Confirmar</button>
        ) : (
          <button onClick={next} className="px-5 py-2 rounded-lg text-xs font-bold bg-white text-black active:scale-95 transition cursor-pointer">{cur < QUIZ_QUESTIONS.length - 1 ? "Próxima →" : "Resultado"}</button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CALCULATOR
// ═══════════════════════════════════════════════════════════════
function CalculatorView() {
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState("");
  const [op, setOp] = useState("");
  const [fresh, setFresh] = useState(true);

  const input = (v: string) => {
    if (fresh) { setDisplay(v === "." ? "0." : v); setFresh(false); }
    else { if (v === "." && display.includes(".")) return; setDisplay(display === "0" && v !== "." ? v : display + v); }
  };

  const operate = (o: string) => { setPrev(display); setOp(o); setFresh(true); };

  const calc = () => {
    const a = parseFloat(prev), b = parseFloat(display);
    if (isNaN(a) || isNaN(b)) return;
    let r = 0;
    switch (op) { case "+": r = a + b; break; case "-": r = a - b; break; case "×": r = a * b; break; case "÷": r = b !== 0 ? a / b : 0; break; }
    setDisplay(String(parseFloat(r.toFixed(10)))); setPrev(""); setOp(""); setFresh(true);
  };

  const clear = () => { setDisplay("0"); setPrev(""); setOp(""); setFresh(true); };
  const pct = () => { setDisplay(String(parseFloat(display) / 100)); setFresh(true); };
  const neg = () => { setDisplay(String(-parseFloat(display))); };
  const sqrt = () => { const v = parseFloat(display); setDisplay(v >= 0 ? String(parseFloat(Math.sqrt(v).toFixed(10))) : "Erro"); setFresh(true); };
  const pow = () => { setDisplay(String(Math.pow(parseFloat(display), 2))); setFresh(true); };

  const btn = (label: string, action: () => void, cls?: string) => (
    <button onClick={action} className={`h-12 rounded-xl font-semibold text-sm transition active:scale-95 cursor-pointer ${cls || "bg-[var(--color-bg-card)] border border-[var(--color-border)] hover:bg-[var(--color-bg-card-hover)]"}`}>{label}</button>
  );

  return (
    <div style={{ animation: "fadeUp 0.4s ease-out" }}>
      <h1 className="text-xl font-extrabold mb-1">Calculadora</h1>
      <p className="text-xs text-[var(--color-text-muted)] mb-5">Ferramenta de apoio para cálculos</p>

      <div className="max-w-xs mx-auto">
        <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] mb-3">
          {prev && op && <p className="text-right text-[11px] text-[var(--color-text-muted)] mb-1">{prev} {op}</p>}
          <p className="text-right text-3xl font-bold font-mono truncate">{display}</p>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {btn("C", clear, "bg-[var(--color-error)]/10 text-[var(--color-error)] border border-[var(--color-error)]/20 hover:bg-[var(--color-error)]/20")}
          {btn("√", sqrt, "bg-white/5 border border-[var(--color-border)]")}
          {btn("x²", pow, "bg-white/5 border border-[var(--color-border)]")}
          {btn("÷", () => operate("÷"), "bg-white/10 text-white border border-[var(--color-border)]")}

          {["7","8","9"].map(n => btn(n, () => input(n)))}
          {btn("×", () => operate("×"), "bg-white/10 text-white border border-[var(--color-border)]")}

          {["4","5","6"].map(n => btn(n, () => input(n)))}
          {btn("-", () => operate("-"), "bg-white/10 text-white border border-[var(--color-border)]")}

          {["1","2","3"].map(n => btn(n, () => input(n)))}
          {btn("+", () => operate("+"), "bg-white/10 text-white border border-[var(--color-border)]")}

          {btn("±", neg)}
          {btn("0", () => input("0"))}
          {btn(".", () => input("."))}
          {btn("=", calc, "bg-white text-black font-bold hover:bg-white/90")}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// FORMULAS
// ═══════════════════════════════════════════════════════════════
function FormulasView() {
  const [openCat, setOpenCat] = useState<number | null>(0);
  return (
    <div style={{ animation: "fadeUp 0.4s ease-out" }}>
      <h1 className="text-xl font-extrabold mb-1">Fórmulas</h1>
      <p className="text-xs text-[var(--color-text-muted)] mb-5">Referência rápida de fórmulas matemáticas</p>
      <div className="space-y-2">
        {FORMULAS.map((cat, i) => (
          <div key={cat.cat} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] overflow-hidden" style={{ animation: `fadeUp 0.3s ease-out ${i * 0.05}s both` }}>
            <button onClick={() => setOpenCat(openCat === i ? null : i)} className="w-full flex items-center justify-between p-3.5 cursor-pointer hover:bg-white/[0.02] transition">
              <span className="text-sm font-bold">{cat.cat}</span>
              <svg className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform ${openCat === i ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {openCat === i && (
              <div className="px-3.5 pb-3.5 border-t border-[var(--color-border)] pt-2 space-y-2" style={{ animation: "fadeUp 0.2s ease-out" }}>
                {cat.items.map(f => (
                  <div key={f.name} className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)]">
                    <span className="text-xs font-medium">{f.name}</span>
                    <code className="text-xs font-mono text-[var(--color-text-secondary)] bg-white/5 px-2 py-0.5 rounded">{f.formula}</code>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// NOTES
// ═══════════════════════════════════════════════════════════════
function NotesView({ uid, toast }: { uid: string; toast: (m: string, t?: Toast["type"]) => void }) {
  const [notes, setNotes] = useState<{ id: string; content?: string; lessonId?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => { try { const { getAllNotes } = await import("@/lib/firebase"); const n = await getAllNotes(uid); setNotes(n as typeof notes); } catch {} setLoading(false); })(); }, [uid]);

  const handleDelete = async (lessonId: string) => {
    try { await deleteNote(uid, lessonId); setNotes(n => n.filter(x => x.id !== lessonId)); toast("Nota deletada", "info"); } catch { toast("Erro", "error"); }
  };

  const lessonName = (id: string) => TRACKS.flatMap(t => t.lessons).find(l => l.id === id)?.title || id;

  return (
    <div style={{ animation: "fadeUp 0.4s ease-out" }}>
      <h1 className="text-xl font-extrabold mb-1">Minhas Anotações</h1>
      <p className="text-xs text-[var(--color-text-muted)] mb-5">Anotações salvas durante as aulas</p>
      {loading ? <p className="text-xs text-[var(--color-text-muted)]">Carregando...</p> :
        notes.length === 0 ? (
          <div className="p-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] text-center">
            <p className="text-2xl mb-2">📝</p>
            <p className="text-sm text-[var(--color-text-muted)]">Nenhuma anotação ainda</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Vá até uma aula e clique em "Anotações"</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notes.map((n, i) => (
              <div key={n.id} className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)]" style={{ animation: `fadeUp 0.3s ease-out ${i * 0.05}s both` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold">{lessonName(n.id)}</span>
                  <button onClick={() => handleDelete(n.id)} className="text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition cursor-pointer">Excluir</button>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] whitespace-pre-wrap">{String(n.content || "")}</p>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HISTORY
// ═══════════════════════════════════════════════════════════════
function HistoryView({ uid }: { uid: string }) {
  const [history, setHistory] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => { try { const h = await getQuizHistory(uid); setHistory(h); } catch {} setLoading(false); })(); }, [uid]);

  return (
    <div style={{ animation: "fadeUp 0.4s ease-out" }}>
      <h1 className="text-xl font-extrabold mb-1">Histórico de Quizzes</h1>
      <p className="text-xs text-[var(--color-text-muted)] mb-5">Resultados anteriores salvos no Firebase</p>
      {loading ? <p className="text-xs text-[var(--color-text-muted)]">Carregando...</p> :
        history.length === 0 ? (
          <div className="p-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] text-center">
            <p className="text-2xl mb-2">📊</p>
            <p className="text-sm text-[var(--color-text-muted)]">Nenhum quiz completado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((h, i) => {
              const date = h.completedAt && typeof h.completedAt === "object" && "seconds" in h.completedAt
                ? new Date((h.completedAt as { seconds: number }).seconds * 1000).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
                : "—";
              return (
                <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)]" style={{ animation: `fadeUp 0.3s ease-out ${i * 0.05}s both` }}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold ${Number(h.percentage) >= 80 ? "bg-[var(--color-success)]/10 text-[var(--color-success)]" : Number(h.percentage) >= 50 ? "bg-[var(--color-warning)]/10 text-[var(--color-warning)]" : "bg-[var(--color-error)]/10 text-[var(--color-error)]"}`}>
                    {String(h.percentage)}%
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold">{String(h.quizId || "Quiz").replace(/-/g, " ")}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">{date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold">{String(h.score)}/{String(h.total)}</p>
                    <p className="text-[9px] text-[var(--color-success)]">+{String(h.xpEarned)} XP</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ACHIEVEMENTS
// ═══════════════════════════════════════════════════════════════
function AchievementsView({ xp }: { xp: number }) {
  const dynamic = ACHIEVEMENTS.map(a => ({
    ...a,
    unlocked: a.id === "a6" ? xp >= 5000 : a.unlocked,
  }));
  const unlocked = dynamic.filter(a => a.unlocked).length;

  return (
    <div style={{ animation: "fadeUp 0.4s ease-out" }}>
      <h1 className="text-xl font-extrabold mb-1">Conquistas</h1>
      <p className="text-xs text-[var(--color-text-muted)] mb-5">{unlocked}/{dynamic.length} desbloqueadas</p>
      <div className="grid sm:grid-cols-2 gap-2.5">
        {dynamic.map((a, i) => (
          <div key={a.id} className={`p-3.5 rounded-xl border transition ${a.unlocked ? "border-[var(--color-border)] bg-[var(--color-bg-card)]" : "border-[var(--color-border)] bg-[var(--color-bg-card)] opacity-35"}`} style={{ animation: `fadeUp 0.3s ease-out ${i * 0.05}s both` }}>
            <div className="flex items-start gap-3">
              <span className={`text-xl ${a.unlocked ? "" : "grayscale"}`}>{a.icon}</span>
              <div><h3 className="text-xs font-bold">{a.title}</h3><p className="text-[10px] text-[var(--color-text-muted)]">{a.desc}</p>
                {a.unlocked && <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-[var(--color-success)]/10 text-[var(--color-success)]">✓ Desbloqueada</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// LEADERBOARD
// ═══════════════════════════════════════════════════════════════
function LeaderboardView({ userName, userXp }: { userName: string; userXp: number }) {
  const [players, setPlayers] = useState<{ uid: string; name: string; xp: number; level: number; pos: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => { try { const lb = await getLeaderboard(10); setPlayers(lb); } catch { setPlayers([{ uid: "you", name: userName, xp: userXp, level: Math.floor(userXp / 500) + 1, pos: 1 }]); } setLoading(false); })(); }, [userName, userXp]);

  return (
    <div style={{ animation: "fadeUp 0.4s ease-out" }}>
      <h1 className="text-xl font-extrabold mb-1">Ranking</h1>
      <p className="text-xs text-[var(--color-text-muted)] mb-5">Ranking real do Firebase</p>
      {loading ? <p className="text-xs text-[var(--color-text-muted)]">Carregando...</p> :
        <div className="space-y-1.5">{players.map((p, i) => {
          const isYou = p.name === userName;
          return (
            <div key={p.uid} className={`flex items-center gap-3 p-3 rounded-xl border transition ${isYou ? "border-white/15 bg-white/5" : "border-[var(--color-border)] bg-[var(--color-bg-card)]"}`} style={{ animation: `fadeUp 0.3s ease-out ${i * 0.05}s both` }}>
              <span className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold bg-white/5">{i <= 2 ? ["🥇","🥈","🥉"][i] : i + 1}</span>
              <div className="flex-1"><p className="text-xs font-semibold">{p.name} {isYou && <span className="text-[9px] text-[var(--color-text-muted)]">(você)</span>}</p></div>
              <div className="text-right"><p className="text-xs font-bold">{p.xp.toLocaleString()} XP</p><p className="text-[8px] text-[var(--color-text-muted)]">Nv.{p.level}</p></div>
            </div>
          );
        })}</div>
      }
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// RULES
// ═══════════════════════════════════════════════════════════════
function RulesView() {
  const [open, setOpen] = useState<number | null>(0);
  const sections = [
    { icon: "📋", title: "Código de Conduta", intro: "Diretrizes para um ambiente justo e respeitoso.", items: [
      { t: "Honestidade", d: "Responda quizzes individualmente. Não compartilhe respostas." },
      { t: "Respeito", d: "Trate colegas e professores com respeito." },
      { t: "Prazos", d: "Cumpra os prazos do professor." },
      { t: "Uso Responsável", d: "Use a plataforma para fins educacionais." },
    ]},
    { icon: "🛡️", title: "Anti-Fraude", intro: "Mecanismos automáticos de proteção.", items: [
      { t: "Bloqueio de Cópia", d: "Ctrl+C e clique direito desabilitados durante quizzes." },
      { t: "Monitoramento de Foco", d: "Detecta saídas de tela via Page Visibility API." },
      { t: "Limite de Saídas", d: "3ª saída cancela o quiz automaticamente com nota zero." },
      { t: "Registro", d: "Infrações salvas no Firebase e visíveis ao professor." },
    ]},
    { icon: "⚠️", title: "Penalidades", intro: "Sistema progressivo de consequências.", items: [
      { t: "1ª Infração", d: "Alerta na tela + registro no sistema." },
      { t: "2ª Infração", d: "Alerta + notificação ao professor." },
      { t: "3ª Infração", d: "Quiz cancelado. Nota zero. Registro permanente." },
      { t: "Manual", d: "Professor pode zerar XP ou anular notas." },
    ]},
    { icon: "🎮", title: "Gamificação", intro: "Sistema de recompensas.", items: [
      { t: "XP", d: "10 XP por pergunta correta no quiz." },
      { t: "Níveis", d: "A cada 500 XP você sobe um nível." },
      { t: "Conquistas", d: "Badges por desafios especiais." },
      { t: "Ranking", d: "Ranking em tempo real no Firebase." },
    ]},
    { icon: "📖", title: "Como Funciona", intro: "Fluxo de aprendizado da plataforma.", items: [
      { t: "Trilhas", d: "Conteúdo em trilhas temáticas sequenciais." },
      { t: "Aulas", d: "Videoaula + material escrito antes do quiz." },
      { t: "Tempo Mínimo", d: "Permaneça na aula antes de desbloquear o quiz." },
      { t: "Anotações", d: "Salve notas pessoais em cada aula." },
    ]},
  ];

  return (
    <div style={{ animation: "fadeUp 0.4s ease-out" }}>
      <h1 className="text-xl font-extrabold mb-1">Regras</h1>
      <p className="text-xs text-[var(--color-text-muted)] mb-5">Leia com atenção</p>
      <div className="space-y-1.5">
        {sections.map((s, i) => (
          <div key={s.title} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] overflow-hidden" style={{ animation: `fadeUp 0.3s ease-out ${i * 0.05}s both` }}>
            <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center gap-2.5 p-3.5 text-left cursor-pointer hover:bg-white/[0.02] transition">
              <span>{s.icon}</span><span className="flex-1 text-xs font-bold">{s.title}</span>
              <svg className={`w-3.5 h-3.5 text-[var(--color-text-muted)] transition-transform ${open === i ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {open === i && (
              <div className="px-3.5 pb-3.5 border-t border-[var(--color-border)] pt-2" style={{ animation: "fadeUp 0.2s ease" }}>
                <p className="text-[10px] text-[var(--color-text-muted)] mb-2">{s.intro}</p>
                <div className="space-y-1.5">{s.items.map((item, j) => (
                  <div key={j} className="flex gap-2.5 p-2.5 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)]">
                    <span className="w-4 h-4 rounded bg-white/10 flex items-center justify-center text-[8px] font-bold shrink-0 mt-0.5">{j + 1}</span>
                    <div><h4 className="text-[11px] font-semibold">{item.t}</h4><p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">{item.d}</p></div>
                  </div>
                ))}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PROFILE
// ═══════════════════════════════════════════════════════════════
function ProfileView({ user, profile, xp, level, streak }: { user: User; profile: Record<string, unknown> | null; xp: number; level: number; streak: number }) {
  const name = user.displayName || String(profile?.name) || "Aluno";
  const email = user.email || "";
  const createdAt = profile?.createdAt && typeof profile.createdAt === "object" && "seconds" in (profile.createdAt as object)
    ? new Date(((profile.createdAt as { seconds: number }).seconds) * 1000).toLocaleDateString("pt-BR") : "—";

  return (
    <div style={{ animation: "fadeUp 0.4s ease-out" }}>
      <h1 className="text-xl font-extrabold mb-5">Meu Perfil</h1>
      <div className="max-w-md">
        <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] mb-3 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-xl font-bold">{name.charAt(0).toUpperCase()}</div>
          <div><h2 className="text-base font-bold">{name}</h2><p className="text-xs text-[var(--color-text-muted)]">{email}</p><p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Desde {createdAt}</p></div>
        </div>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[{ l: "XP", v: xp }, { l: "Nível", v: level }, { l: "Streak", v: streak }, { l: "Quizzes", v: Number(profile?.quizzesCompleted) || 0 }].map(s => (
            <div key={s.l} className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] text-center">
              <p className="text-lg font-extrabold">{s.v}</p><p className="text-[8px] text-[var(--color-text-muted)] uppercase">{s.l}</p>
            </div>
          ))}
        </div>
        <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] mb-3">
          <div className="flex justify-between text-[11px] mb-1.5"><span className="font-semibold">Nível {level} → {level + 1}</span><span className="text-[var(--color-text-muted)]">{xp % 500}/500 XP</span></div>
          <div className="h-1.5 bg-[var(--color-bg-primary)] rounded-full overflow-hidden"><div className="h-full rounded-full bg-white/60 transition-all" style={{ width: `${((xp % 500) / 500) * 100}%` }} /></div>
        </div>
        <button onClick={logoutUser} className="w-full py-2.5 rounded-xl border border-[var(--color-error)]/20 text-[var(--color-error)] text-xs font-semibold hover:bg-[var(--color-error)]/5 transition cursor-pointer">Sair da conta</button>
      </div>
    </div>
  );
}
