"use client";

import { useState, useEffect, useCallback } from "react";
import {
  registerUser, loginUser, logoutUser, onAuthChange, getUserProfile,
  saveQuizResult, saveNote, getNote, deleteNote, getAllNotes,
  saveInfraction, getLeaderboard, getQuizHistory, ACHIEVEMENT_DEFS,
  getSettings, saveSettings, getCustomFormulas, saveCustomFormula, deleteCustomFormula,
} from "@/lib/firebase";
import type { User } from "firebase/auth";

/* ════════════════════════════════════════════════════════════════
   Saberes em Conexão — v3.0
   Light mode default · Mobile-first · Real Firestore achievements
   Teacher controls · Configurable settings
   ════════════════════════════════════════════════════════════════ */

// ─── Static Data ─────────────────────────────────────────────
const TRACKS = [
  { id: "t1", title: "Álgebra", icon: "📐", desc: "Equações, sistemas e inequações", lessons: [
    { id: "l1", title: "Equações do 1º Grau", completed: true, xp: 50 },
    { id: "l2", title: "Equações do 2º Grau", completed: true, xp: 60 },
    { id: "l3", title: "Sistemas de Equações", completed: false, xp: 70 },
    { id: "l4", title: "Inequações", completed: false, xp: 55 },
  ]},
  { id: "t2", title: "Geometria", icon: "📏", desc: "Formas, ângulos e medidas", lessons: [
    { id: "l5", title: "Ângulos e Triângulos", completed: true, xp: 45 },
    { id: "l6", title: "Polígonos Regulares", completed: false, xp: 50 },
    { id: "l7", title: "Circunferência", completed: false, xp: 65 },
  ]},
  { id: "t3", title: "Frações", icon: "🔢", desc: "Operações e porcentagem", lessons: [
    { id: "l8", title: "Operações com Frações", completed: true, xp: 40 },
    { id: "l9", title: "Números Decimais", completed: true, xp: 40 },
    { id: "l10", title: "Porcentagem", completed: false, xp: 55 },
  ]},
  { id: "t4", title: "Estatística", icon: "📊", desc: "Médias, gráficos e dados", lessons: [
    { id: "l11", title: "Média, Moda e Mediana", completed: false, xp: 45 },
    { id: "l12", title: "Gráficos e Tabelas", completed: false, xp: 50 },
  ]},
];

const DEFAULT_FORMULAS = [
  { cat: "Álgebra", items: [
    { name: "Equação 1º Grau", formula: "ax + b = 0 → x = -b/a" },
    { name: "Equação 2º Grau", formula: "x = (-b ± √(b²-4ac)) / 2a" },
    { name: "Produto Notável", formula: "(a+b)² = a² + 2ab + b²" },
  ]},
  { cat: "Geometria", items: [
    { name: "Área do Triângulo", formula: "A = (b × h) / 2" },
    { name: "Área do Círculo", formula: "A = π × r²" },
    { name: "Pitágoras", formula: "a² = b² + c²" },
  ]},
  { cat: "Estatística", items: [
    { name: "Média", formula: "M = Σx / n" },
    { name: "Porcentagem", formula: "P = (parte/total) × 100" },
  ]},
];

const QUIZ_QUESTIONS = [
  { id: "q1", text: "Qual é o valor de x na equação 2x + 6 = 0?", options: ["x = 3", "x = -3", "x = 6", "x = -6"], correct: 1 },
  { id: "q2", text: "Se 3x - 9 = 6, quanto vale x?", options: ["x = 3", "x = -5", "x = 5", "x = 1"], correct: 2 },
  { id: "q3", text: "Qual é a forma geral de uma equação do 1º grau?", options: ["ax² + bx + c = 0", "ax + b = 0", "a/x + b = 0", "ax³ = b"], correct: 1 },
  { id: "q4", text: "Resolva: 5x + 10 = 0", options: ["x = 2", "x = -2", "x = 5", "x = -10"], correct: 1 },
  { id: "q5", text: "Na equação 4x - 8 = 16, o valor de x é:", options: ["x = 2", "x = 4", "x = 6", "x = 8"], correct: 2 },
];

type AppView = "dashboard" | "lesson" | "quiz" | "achievements" | "leaderboard" | "rules" | "profile" | "calculator" | "formulas" | "notes" | "history" | "settings" | "teacher";
type Toast = { id: number; message: string; type: "success" | "error" | "info" };
let toastCounter = 0;

// ─── Toast ───────────────────────────────────────────────────
function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] space-y-2 max-w-[280px]">
      {toasts.map(t => (
        <div key={t.id} onClick={() => onRemove(t.id)} style={{ animation: "fadeUp 0.3s ease-out" }}
          className={`px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer border shadow-lg ${
            t.type === "success" ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300" :
            t.type === "error" ? "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300" :
            "bg-[var(--color-bg-card)] border-[var(--color-border)] text-[var(--color-text-primary)]"
          }`}>{t.message}</div>
      ))}
    </div>
  );
}

// ─── Icon Components ─────────────────────────────────────────
const IconMenu = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" /></svg>;
const IconChevron = ({ open }: { open: boolean }) => <svg className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M19 9l-7 7-7-7" /></svg>;
const IconRight = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M9 5l7 7-7 7" /></svg>;
const IconSun = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="4"/><path strokeLinecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41m12.73-12.73l1.41-1.41"/></svg>;
const IconMoon = () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/></svg>;

// ═══════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════
export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);

  // Theme: default light
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  useEffect(() => {
    const unsub = onAuthChange(async u => {
      setUser(u);
      if (u) { try { setProfile(await getUserProfile(u.uid)); } catch { setProfile(null); } }
      else setProfile(null);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return <LoadingScreen />;
  if (!user) return <AuthScreen />;
  return <AppShell user={user} profile={profile} refreshProfile={async () => { try { setProfile(await getUserProfile(user.uid)); } catch {} }} />;
}

// ═══════════════════════════════════════════════════════════════
// LOADING
// ═══════════════════════════════════════════════════════════════
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
      <div className="text-center" style={{ animation: "fadeIn 0.4s ease" }}>
        <img src="/logo.jpeg" alt="Logo" className="w-16 h-16 rounded-2xl mx-auto mb-4 object-cover shadow-md" />
        <div className="w-5 h-5 border-2 border-[var(--color-border)] border-t-[var(--color-accent)] rounded-full mx-auto" style={{ animation: "spin 0.8s linear infinite" }} />
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
    e.preventDefault(); setError(""); setLoading(true);
    try {
      if (mode === "register") {
        if (!name.trim()) { setError("Nome obrigatório"); setLoading(false); return; }
        if (password.length < 6) { setError("Mínimo 6 caracteres"); setLoading(false); return; }
        await registerUser(name.trim(), email.trim(), password);
      } else { await loginUser(email.trim(), password); }
    } catch (err: unknown) {
      const c = (err as { code?: string }).code || "";
      const msgs: Record<string, string> = {
        "auth/email-already-in-use": "Email já cadastrado", "auth/invalid-email": "Email inválido",
        "auth/weak-password": "Senha muito fraca", "auth/invalid-credential": "Email ou senha incorretos",
      };
      setError(msgs[c] || "Erro de conexão"); setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--color-bg-primary)]">
      {/* Left branding */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)]">
        <div className="text-center max-w-sm" style={{ animation: "fadeUp 0.6s ease-out" }}>
          <img src="/logo.jpeg" alt="Logo" className="w-32 h-32 rounded-3xl mx-auto mb-6 object-cover shadow-lg" />
          <h1 className="text-2xl font-extrabold mb-2">Saberes em Conexão</h1>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">Conhecer • Conectar • Transformar</p>
          <div className="grid grid-cols-3 gap-3">
            {[{ n: "12", l: "Aulas" }, { n: "50+", l: "Questões" }, { n: "4", l: "Trilhas" }].map(s => (
              <div key={s.l} className="p-3 rounded-xl bg-[var(--color-bg-primary)] border border-[var(--color-border)]">
                <p className="text-lg font-bold">{s.n}</p><p className="text-[10px] text-[var(--color-text-muted)]">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-5">
        <div className="w-full max-w-sm" style={{ animation: "fadeUp 0.5s ease-out" }}>
          <div className="lg:hidden text-center mb-6">
            <img src="/logo.jpeg" alt="Logo" className="w-14 h-14 rounded-xl mx-auto mb-2 object-cover shadow-md" />
            <h1 className="text-lg font-bold">Saberes em Conexão</h1>
          </div>

          <div className="p-6 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-[var(--shadow-md)]">
            <h2 className="text-lg font-bold mb-0.5">{mode === "login" ? "Entrar" : "Criar conta"}</h2>
            <p className="text-xs text-[var(--color-text-muted)] mb-5">{mode === "login" ? "Acesse sua conta para continuar" : "Preencha seus dados"}</p>

            {error && <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs dark:bg-red-900/20 dark:border-red-800 dark:text-red-400" style={{ animation: "shake 0.4s ease" }}>⚠ {error}</div>}

            <form onSubmit={submit} className="space-y-3">
              {mode === "register" && (
                <div><label className="block text-[10px] font-semibold text-[var(--color-text-muted)] mb-1 uppercase tracking-wider">Nome</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Seu nome completo" className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-bg-input)] border border-[var(--color-border)] text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition" /></div>
              )}
              <div><label className="block text-[10px] font-semibold text-[var(--color-text-muted)] mb-1 uppercase tracking-wider">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com" className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-bg-input)] border border-[var(--color-border)] text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition" /></div>
              <div><label className="block text-[10px] font-semibold text-[var(--color-text-muted)] mb-1 uppercase tracking-wider">Senha</label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••" minLength={6} className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-bg-input)] border border-[var(--color-border)] text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition pr-16" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition cursor-pointer text-[10px] font-medium">{showPass ? "Ocultar" : "Mostrar"}</button>
                </div></div>
              <button type="submit" disabled={loading} className="w-full py-2.5 rounded-xl bg-[var(--color-accent)] text-white text-sm font-bold hover:bg-[var(--color-accent-hover)] active:scale-[0.98] transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" style={{ animation: "spin 0.7s linear infinite" }} /> : mode === "login" ? "Entrar" : "Criar conta"}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-[var(--color-text-muted)]">
              {mode === "login" ? "Não tem conta?" : "Já tem conta?"}
              <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} className="ml-1 text-[var(--color-accent)] font-semibold hover:underline cursor-pointer">{mode === "login" ? "Cadastre-se" : "Entrar"}</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// APP SHELL
// ═══════════════════════════════════════════════════════════════
function AppShell({ user, profile, refreshProfile }: { user: User; profile: Record<string, unknown> | null; refreshProfile: () => Promise<void> }) {
  const [view, setView] = useState<AppView>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [xp, setXp] = useState(Number(profile?.xp) || 0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [platformSettings, setPlatformSettings] = useState<Record<string, unknown> | null>(null);

  const isTeacher = String(profile?.role) === "TEACHER" || String(profile?.role) === "ADMIN";
  const name = user.displayName || String(profile?.name) || "Aluno";
  const level = Math.floor(xp / 500) + 1;
  const streak = Number(profile?.streak) || 0;

  // Load platform settings
  useEffect(() => { (async () => { try { const s = await getSettings(); setPlatformSettings(s); } catch {} })(); }, []);

  const toast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = ++toastCounter;
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  const go = (v: AppView) => { setView(v); setSidebarOpen(false); };

  const navItems: { id: AppView; label: string; icon: string; sep?: boolean }[] = [
    { id: "dashboard", label: "Dashboard", icon: "◻" },
    { id: "lesson", label: "Aula Atual", icon: "▶" },
    { id: "achievements", label: "Conquistas", icon: "★" },
    { id: "leaderboard", label: "Ranking", icon: "◆" },
    { id: "calculator", label: "Calculadora", icon: "⊞", sep: true },
    { id: "formulas", label: "Fórmulas", icon: "ƒ" },
    { id: "notes", label: "Anotações", icon: "✎" },
    { id: "history", label: "Histórico", icon: "⧖" },
    { id: "rules", label: "Regras", icon: "☰", sep: true },
    { id: "settings", label: "Configurações", icon: "⚙" },
    { id: "profile", label: "Meu Perfil", icon: "●" },
  ];

  if (isTeacher) navItems.splice(navItems.length - 1, 0, { id: "teacher", label: "Painel Professor", icon: "🔧", sep: true });

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg-primary)]">
      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-56 flex flex-col bg-[var(--color-bg-sidebar)] border-r border-[var(--color-border)] shadow-[var(--shadow-lg)] lg:shadow-none transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)]">
          <img src="/logo.jpeg" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
          <div><h1 className="text-xs font-bold leading-tight">Saberes em Conexão</h1><p className="text-[7px] text-[var(--color-text-muted)] uppercase tracking-widest">Projeto Interdisciplinar</p></div>
        </div>

        <div className="px-3 py-2 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center text-[11px] font-bold">{name.charAt(0).toUpperCase()}</div>
            <div className="flex-1 min-w-0"><p className="text-[11px] font-semibold truncate">{name}</p><p className="text-[9px] text-[var(--color-text-muted)]">Nv.{level} · {xp} XP</p></div>
          </div>
          <div className="h-1 bg-[var(--color-bg-primary)] rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-700" style={{ width: `${((xp % 500) / 500) * 100}%` }} />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-1 px-2">
          {navItems.map(item => (
            <div key={item.id}>
              {item.sep && <div className="h-px bg-[var(--color-border)] my-1 mx-2" />}
              <button onClick={() => go(item.id)} className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition cursor-pointer flex items-center gap-2 ${view === item.id ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-semibold" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card-hover)]"}`}>
                <span className="w-4 text-center text-[10px]">{item.icon}</span>{item.label}
              </button>
            </div>
          ))}
        </nav>

        <div className="px-3 py-2 border-t border-[var(--color-border)]">
          {streak > 0 && <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-orange-50 dark:bg-orange-900/20 mb-1.5 text-[10px] text-orange-600 dark:text-orange-400 font-medium">🔥 {streak} dias seguidos</div>}
          <button onClick={logoutUser} className="w-full text-left px-2 py-1.5 rounded-lg text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-red-50 dark:hover:bg-red-900/10 transition cursor-pointer">Sair</button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-2 bg-[var(--color-bg-primary)]/90 backdrop-blur-xl border-b border-[var(--color-border)]">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-lg border border-[var(--color-border)] cursor-pointer"><IconMenu /></button>
          <h2 className="text-sm font-bold flex-1">{navItems.find(n => n.id === view)?.label || "Dashboard"}</h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-semibold">{xp} XP</span>
        </div>

        <div className="p-4 lg:p-6 max-w-4xl mx-auto pb-20">
          {view === "dashboard" && <DashboardView name={name} xp={xp} level={level} streak={streak} profile={profile} go={go} />}
          {view === "lesson" && <LessonView uid={user.uid} onStartQuiz={() => go("quiz")} toast={toast} waitTime={Number(platformSettings?.quizWaitTime) || 20} />}
          {view === "quiz" && <QuizView uid={user.uid} onFinish={s => { const e = s * 10; setXp(p => p + e); toast(`+${e} XP!`, "success"); refreshProfile(); go("dashboard"); }} onBack={() => go("lesson")} toast={toast} />}
          {view === "achievements" && <AchievementsView profile={profile} />}
          {view === "leaderboard" && <LeaderboardView userName={name} />}
          {view === "rules" && <RulesView />}
          {view === "profile" && <ProfileView user={user} profile={profile} xp={xp} level={level} streak={streak} />}
          {view === "calculator" && <CalculatorView />}
          {view === "formulas" && <FormulasView isTeacher={isTeacher} toast={toast} />}
          {view === "notes" && <NotesView uid={user.uid} toast={toast} />}
          {view === "history" && <HistoryView uid={user.uid} />}
          {view === "settings" && <SettingsView />}
          {view === "teacher" && isTeacher && <TeacherView platformSettings={platformSettings} setPlatformSettings={setPlatformSettings} toast={toast} />}
        </div>
      </main>

      <ToastContainer toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════
function DashboardView({ name, xp, level, streak, profile, go }: { name: string; xp: number; level: number; streak: number; profile: Record<string, unknown> | null; go: (v: AppView) => void }) {
  const quizzes = Number(profile?.quizzesCompleted) || 0;
  const totalL = TRACKS.reduce((a, t) => a + t.lessons.length, 0);
  const doneL = TRACKS.reduce((a, t) => a + t.lessons.filter(l => l.completed).length, 0);
  const unlockedAch = profile ? ACHIEVEMENT_DEFS.filter(a => a.check(profile)).length : 0;

  return (
    <div style={{ animation: "fadeUp 0.3s ease-out" }}>
      <h1 className="text-xl font-extrabold mb-0.5">Olá, {name} 👋</h1>
      <p className="text-xs text-[var(--color-text-muted)] mb-4">Continue de onde parou</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        {[
          { l: "XP Total", v: xp.toLocaleString(), i: "⚡", c: "text-amber-500" },
          { l: "Nível", v: level, i: "◆", c: "text-[var(--color-accent)]" },
          { l: "Sequência", v: `${streak}d`, i: "🔥", c: "text-orange-500" },
          { l: "Quizzes", v: quizzes, i: "✓", c: "text-[var(--color-success)]" },
        ].map((s, i) => (
          <div key={s.l} className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-sm)]" style={{ animation: `fadeUp 0.3s ease-out ${i * 0.04}s both` }}>
            <span className={`text-base ${s.c}`}>{s.i}</span>
            <p className="text-lg font-extrabold mt-0.5">{s.v}</p>
            <p className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider">{s.l}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2 mb-4" style={{ animation: "fadeUp 0.3s ease-out 0.15s both" }}>
        {[
          { l: "Calc", i: "🧮", v: "calculator" as AppView },
          { l: "Fórmulas", i: "📐", v: "formulas" as AppView },
          { l: "Notas", i: "📝", v: "notes" as AppView },
          { l: "Ranking", i: "🏆", v: "leaderboard" as AppView },
        ].map(a => (
          <button key={a.l} onClick={() => go(a.v)} className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] hover:shadow-[var(--shadow-md)] transition cursor-pointer text-center shadow-[var(--shadow-sm)]">
            <span className="text-base block">{a.i}</span><span className="text-[9px] text-[var(--color-text-muted)]">{a.l}</span>
          </button>
        ))}
      </div>

      {/* Continue */}
      <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] mb-4 cursor-pointer hover:shadow-[var(--shadow-md)] transition group shadow-[var(--shadow-sm)]" onClick={() => go("lesson")} style={{ animation: "fadeUp 0.3s ease-out 0.2s both" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center text-lg">📐</div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] uppercase tracking-widest text-[var(--color-text-muted)]">Continuar</p>
            <h3 className="text-sm font-bold truncate">Sistemas de Equações</h3>
            <div className="flex items-center gap-2 mt-1"><div className="flex-1 h-1.5 bg-[var(--color-bg-primary)] rounded-full overflow-hidden"><div className="h-full w-1/2 rounded-full bg-[var(--color-accent)]" /></div><span className="text-[9px] text-[var(--color-text-muted)]">50%</span></div>
          </div>
          <IconRight />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-4" style={{ animation: "fadeUp 0.3s ease-out 0.25s both" }}>
        <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] text-center shadow-[var(--shadow-sm)]"><p className="text-sm font-bold">{doneL}/{totalL}</p><p className="text-[9px] text-[var(--color-text-muted)]">Aulas</p></div>
        <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] text-center shadow-[var(--shadow-sm)]"><p className="text-sm font-bold">{unlockedAch}/{ACHIEVEMENT_DEFS.length}</p><p className="text-[9px] text-[var(--color-text-muted)]">Conquistas</p></div>
        <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] text-center shadow-[var(--shadow-sm)]"><p className="text-sm font-bold">{500 - (xp % 500)}</p><p className="text-[9px] text-[var(--color-text-muted)]">XP p/ Nv.{level + 1}</p></div>
      </div>

      {/* Tracks */}
      <h2 className="text-sm font-bold mb-2" style={{ animation: "fadeUp 0.3s ease-out 0.3s both" }}>Trilhas</h2>
      <div className="grid sm:grid-cols-2 gap-2">
        {TRACKS.map((t, i) => {
          const d = t.lessons.filter(l => l.completed).length;
          const p = Math.round((d / t.lessons.length) * 100);
          return (
            <div key={t.id} onClick={() => go("lesson")} className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] cursor-pointer hover:shadow-[var(--shadow-md)] transition shadow-[var(--shadow-sm)]" style={{ animation: `fadeUp 0.3s ease-out ${0.35 + i * 0.04}s both` }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{t.icon}</span>
                <div className="flex-1 min-w-0"><h3 className="text-xs font-bold">{t.title}</h3><p className="text-[9px] text-[var(--color-text-muted)]">{t.desc}</p></div>
                <span className="text-[10px] font-bold text-[var(--color-accent)]">{p}%</span>
              </div>
              <div className="h-1 bg-[var(--color-bg-primary)] rounded-full overflow-hidden"><div className="h-full rounded-full bg-[var(--color-accent)]/60 transition-all" style={{ width: `${p}%` }} /></div>
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
function LessonView({ uid, onStartQuiz, toast, waitTime }: { uid: string; onStartQuiz: () => void; toast: (m: string, t?: Toast["type"]) => void; waitTime: number }) {
  const [elapsed, setElapsed] = useState(0);
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [saving, setSaving] = useState(false);
  const unlocked = elapsed >= waitTime;
  const progress = Math.min(1, elapsed / waitTime);

  useEffect(() => { if (unlocked) return; const t = setInterval(() => setElapsed(v => v + 1), 1000); return () => clearInterval(t); }, [unlocked]);
  useEffect(() => { (async () => { try { const n = await getNote(uid, "l3"); if (n) setNote(String(n.content)); } catch {} })(); }, [uid]);

  const handleSaveNote = async () => { setSaving(true); try { await saveNote(uid, "l3", note); toast("Anotação salva!", "success"); } catch { toast("Erro", "error"); } setSaving(false); };

  return (
    <div style={{ animation: "fadeUp 0.3s ease-out" }}>
      <div className="text-[10px] text-[var(--color-text-muted)] mb-3">Trilhas › Álgebra › <span className="text-[var(--color-text-primary)] font-medium">Sistemas de Equações</span></div>
      <div className="flex items-start justify-between mb-4 gap-2">
        <div><h1 className="text-lg font-extrabold">Sistemas de Equações</h1><p className="text-[10px] text-[var(--color-text-muted)]">Aula 3/4 · 70 XP</p></div>
        <button onClick={() => setShowNote(!showNote)} className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-medium border transition cursor-pointer ${showNote ? "bg-[var(--color-accent)]/10 border-[var(--color-accent)]/30 text-[var(--color-accent)]" : "border-[var(--color-border)] text-[var(--color-text-muted)]"}`}>📝 Notas</button>
      </div>

      <div className="rounded-xl overflow-hidden border border-[var(--color-border)] bg-black mb-3 shadow-[var(--shadow-md)]">
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <iframe className="absolute inset-0 w-full h-full" src="https://www.youtube.com/embed/DhJwnVAbsYA?rel=0&modestbranding=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="Videoaula" />
        </div>
      </div>

      {showNote && (
        <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] mb-3 shadow-[var(--shadow-sm)]" style={{ animation: "fadeUp 0.2s ease-out" }}>
          <h3 className="text-xs font-bold mb-2">📝 Anotações</h3>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Escreva aqui..." className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] text-xs resize-none focus:outline-none focus:border-[var(--color-accent)] transition placeholder:text-[var(--color-text-muted)]" />
          <div className="flex justify-end mt-2"><button onClick={handleSaveNote} disabled={saving} className="px-3 py-1.5 rounded-lg bg-[var(--color-accent)] text-white text-[10px] font-bold hover:bg-[var(--color-accent-hover)] transition cursor-pointer disabled:opacity-50">{saving ? "..." : "Salvar"}</button></div>
        </div>
      )}

      <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] mb-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 shadow-[var(--shadow-sm)]">
        <div className="flex-1 w-full">
          <div className="flex justify-between text-[10px] mb-1">
            <span>{unlocked ? <span className="text-[var(--color-success)] font-medium">✓ Quiz desbloqueado!</span> : <span>Tempo restante: {Math.max(0, waitTime - elapsed)}s</span>}</span>
            <span className="text-[var(--color-text-muted)]">{Math.round(progress * 100)}%</span>
          </div>
          <div className="h-1.5 bg-[var(--color-bg-primary)] rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-1000" style={{ width: `${progress * 100}%`, backgroundColor: unlocked ? "var(--color-success)" : "var(--color-accent)" }} /></div>
        </div>
        <button onClick={onStartQuiz} disabled={!unlocked} className={`shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${unlocked ? "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] active:scale-95" : "bg-[var(--color-bg-input)] text-[var(--color-text-muted)] cursor-not-allowed border border-[var(--color-border)]"}`}>
          {unlocked ? "Iniciar Quiz →" : "🔒 Aguarde"}
        </button>
      </div>

      <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] space-y-3 shadow-[var(--shadow-sm)]">
        <h3 className="text-sm font-bold">Material de Apoio</h3>
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">Um <strong className="text-[var(--color-text-primary)]">sistema de equações</strong> é um conjunto de equações que devem ser resolvidas simultaneamente.</p>
        <div className="p-3 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] font-mono text-xs"><p className="text-[var(--color-text-muted)]">{"{"}</p><p className="pl-3">2x + y = 10</p><p className="pl-3">x - y = 2</p><p className="text-[var(--color-text-muted)]">{"}"}</p></div>
        <div><h4 className="text-xs font-bold mb-1.5">Resolução por Substituição</h4>
          <ol className="space-y-1 text-xs text-[var(--color-text-secondary)]">
            {["Isole: x = y + 2", "Substitua: 2(y+2) + y = 10", "Resolva: 3y = 6 → y = 2", "Encontre: x = 4"].map((s, i) => (
              <li key={i} className="flex gap-2"><span className="w-4 h-4 rounded bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center text-[8px] font-bold shrink-0">{i + 1}</span>{s}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// QUIZ
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
    const h = () => { if (document.hidden && !done) { setWarns(w => { const n = w + 1; toast(`⚠ Saída ${n}/3`, "error"); saveInfraction(uid, "SCREEN_EXIT", `Saída ${n}`).catch(() => {}); if (n >= 3) setDone(true); return n; }); }};
    document.addEventListener("visibilitychange", h); return () => document.removeEventListener("visibilitychange", h);
  }, [done, uid, toast]);

  useEffect(() => { const h = (e: Event) => e.preventDefault(); document.addEventListener("copy", h); document.addEventListener("contextmenu", h); return () => { document.removeEventListener("copy", h); document.removeEventListener("contextmenu", h); }; }, []);

  const confirm = () => { if (sel === null) return; const ok = sel === q.correct; if (ok) setScore(s => s + 1); const r = [...results]; r[cur] = ok; setResults(r); setAnswered(true); };
  const next = () => { if (cur < QUIZ_QUESTIONS.length - 1) { setCur(c => c + 1); setSel(null); setAnswered(false); } else { setDone(true); saveQuizResult(uid, "quiz-sistemas", score, QUIZ_QUESTIONS.length, score * 10).catch(() => {}); } };

  if (done) {
    const pct = Math.round((score / QUIZ_QUESTIONS.length) * 100);
    return (
      <div className="flex items-center justify-center min-h-[50vh]" style={{ animation: "fadeUp 0.4s ease-out" }}>
        <div className="text-center max-w-sm w-full p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-lg)]">
          {warns >= 3 && <div className="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">⚠ Cancelado: {warns} saídas</div>}
          <div className="text-4xl mb-3" style={{ animation: "pop 0.5s ease-out" }}>{pct >= 80 ? "🏆" : pct >= 50 ? "⭐" : "📝"}</div>
          <h2 className="text-lg font-extrabold mb-1">{warns >= 3 ? "Cancelado" : pct >= 80 ? "Excelente!" : pct >= 50 ? "Bom!" : "Continue!"}</h2>
          <div className="flex justify-center gap-6 my-4">
            <div><p className="text-xl font-extrabold">{score}/{QUIZ_QUESTIONS.length}</p><p className="text-[9px] text-[var(--color-text-muted)]">Acertos</p></div>
            <div><p className="text-xl font-extrabold text-[var(--color-success)]">+{score * 10}</p><p className="text-[9px] text-[var(--color-text-muted)]">XP</p></div>
          </div>
          <div className="flex justify-center gap-1 mb-5">{results.map((r, i) => (<div key={i} className={`w-6 h-6 rounded text-[9px] font-bold flex items-center justify-center border ${r === true ? "border-green-300 text-[var(--color-success)] bg-green-50 dark:bg-green-900/20" : r === false ? "border-red-300 text-[var(--color-error)] bg-red-50 dark:bg-red-900/20" : "border-[var(--color-border)]"}`}>{r === true ? "✓" : r === false ? "✗" : "–"}</div>))}</div>
          <button onClick={() => onFinish(score)} className="w-full py-2.5 rounded-xl bg-[var(--color-accent)] text-white text-sm font-bold hover:bg-[var(--color-accent-hover)] active:scale-95 transition cursor-pointer">Voltar</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeUp 0.3s ease-out" }}>
      <div className="flex items-center justify-between mb-3">
        <button onClick={onBack} className="text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition cursor-pointer">← Voltar</button>
        <div className="flex items-center gap-2">
          {warns > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-50 text-orange-600 font-bold dark:bg-orange-900/20 dark:text-orange-400">⚠{warns}/3</span>}
          <span className={`text-[11px] font-mono px-2 py-1 rounded border ${time <= 30 ? "border-red-200 text-[var(--color-error)] bg-red-50 dark:bg-red-900/20" : "border-[var(--color-border)]"}`}>{Math.floor(time / 60)}:{(time % 60).toString().padStart(2, "0")}</span>
        </div>
      </div>

      <div className="flex gap-1 mb-4">{QUIZ_QUESTIONS.map((_, i) => (<div key={i} className={`flex-1 h-1 rounded-full transition ${i < cur ? (results[i] ? "bg-[var(--color-success)]" : "bg-[var(--color-error)]") : i === cur ? "bg-[var(--color-accent)]" : "bg-[var(--color-border)]"}`} />))}</div>

      <div key={cur} className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] mb-4 shadow-[var(--shadow-sm)]" style={{ animation: "slideIn 0.3s ease-out" }}>
        <p className="text-[10px] text-[var(--color-text-muted)] mb-2">Pergunta {cur + 1}/{QUIZ_QUESTIONS.length}</p>
        <h3 className="text-base font-bold mb-5">{q.text}</h3>
        <div className="space-y-2">
          {q.options.map((opt, idx) => {
            const L = String.fromCharCode(65 + idx);
            let cls = "border-[var(--color-border)]";
            if (answered && idx === q.correct) cls = "border-green-300 bg-green-50 dark:bg-green-900/20";
            else if (answered && idx === sel) cls = "border-red-300 bg-red-50 dark:bg-red-900/20";
            else if (sel === idx) cls = "border-[var(--color-accent)] bg-[var(--color-accent)]/5";
            return (
              <button key={idx} onClick={() => !answered && setSel(idx)} disabled={answered}
                className={`w-full flex items-center gap-2.5 p-3 rounded-xl border text-left text-sm transition ${!answered ? "cursor-pointer hover:border-[var(--color-accent)]/50" : ""} ${cls}`}
                style={answered && idx === sel && idx !== q.correct ? { animation: "shake 0.3s ease" } : {}}>
                <span className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold ${sel === idx || (answered && idx === q.correct) ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]" : "bg-[var(--color-bg-input)]"}`}>{answered && idx === q.correct ? "✓" : answered && idx === sel ? "✗" : L}</span>
                <span className="text-xs font-medium">{opt}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        {!answered
          ? <button onClick={confirm} disabled={sel === null} className={`px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${sel !== null ? "bg-[var(--color-accent)] text-white active:scale-95" : "bg-[var(--color-bg-input)] text-[var(--color-text-muted)] cursor-not-allowed border border-[var(--color-border)]"}`}>Confirmar</button>
          : <button onClick={next} className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--color-accent)] text-white active:scale-95 transition cursor-pointer">{cur < QUIZ_QUESTIONS.length - 1 ? "Próxima →" : "Resultado"}</button>
        }
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CALCULATOR
// ═══════════════════════════════════════════════════════════════
function CalculatorView() {
  const [d, setD] = useState("0");
  const [prev, setPrev] = useState("");
  const [op, setOp] = useState("");
  const [fresh, setFresh] = useState(true);

  const input = (v: string) => { if (fresh) { setD(v === "." ? "0." : v); setFresh(false); } else { if (v === "." && d.includes(".")) return; setD(d === "0" && v !== "." ? v : d + v); } };
  const operate = (o: string) => { setPrev(d); setOp(o); setFresh(true); };
  const calc = () => { const a = parseFloat(prev), b = parseFloat(d); if (isNaN(a)) return; let r = 0; switch (op) { case "+": r = a + b; break; case "-": r = a - b; break; case "×": r = a * b; break; case "÷": r = b !== 0 ? a / b : 0; break; } setD(String(parseFloat(r.toFixed(10)))); setPrev(""); setOp(""); setFresh(true); };
  const clear = () => { setD("0"); setPrev(""); setOp(""); setFresh(true); };

  const B = (l: string, fn: () => void, c?: string) => <button onClick={fn} className={`h-11 rounded-xl font-semibold text-sm transition active:scale-95 cursor-pointer shadow-[var(--shadow-sm)] ${c || "bg-[var(--color-bg-card)] border border-[var(--color-border)] hover:bg-[var(--color-bg-card-hover)]"}`}>{l}</button>;

  return (
    <div style={{ animation: "fadeUp 0.3s ease-out" }}>
      <h1 className="text-xl font-extrabold mb-1">Calculadora</h1>
      <p className="text-xs text-[var(--color-text-muted)] mb-4">Ferramenta de apoio</p>
      <div className="max-w-xs mx-auto">
        <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] mb-3 shadow-[var(--shadow-md)]">
          {prev && op && <p className="text-right text-[10px] text-[var(--color-text-muted)]">{prev} {op}</p>}
          <p className="text-right text-3xl font-bold font-mono truncate">{d}</p>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {B("C", clear, "bg-red-50 text-[var(--color-error)] border border-red-200 dark:bg-red-900/20 dark:border-red-800")}
          {B("√", () => { const v = parseFloat(d); setD(v >= 0 ? String(parseFloat(Math.sqrt(v).toFixed(10))) : "Erro"); setFresh(true); })}
          {B("x²", () => { setD(String(Math.pow(parseFloat(d), 2))); setFresh(true); })}
          {B("÷", () => operate("÷"), "bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20")}
          {["7","8","9"].map(n => B(n, () => input(n)))}
          {B("×", () => operate("×"), "bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20")}
          {["4","5","6"].map(n => B(n, () => input(n)))}
          {B("-", () => operate("-"), "bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20")}
          {["1","2","3"].map(n => B(n, () => input(n)))}
          {B("+", () => operate("+"), "bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20")}
          {B("±", () => setD(String(-parseFloat(d))))}
          {B("0", () => input("0"))}
          {B(".", () => input("."))}
          {B("=", calc, "bg-[var(--color-accent)] text-white font-bold")}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// FORMULAS (with teacher add/delete)
// ═══════════════════════════════════════════════════════════════
function FormulasView({ isTeacher, toast }: { isTeacher: boolean; toast: (m: string, t?: Toast["type"]) => void }) {
  const [openCat, setOpenCat] = useState<number | null>(0);
  const [customFormulas, setCustomFormulas] = useState<{ id: string; category?: string; name?: string; formula?: string }[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [newName, setNewName] = useState("");
  const [newFormula, setNewFormula] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { (async () => { try { const f = await getCustomFormulas(); setCustomFormulas(f as typeof customFormulas); } catch {} })(); }, []);

  const handleAdd = async () => {
    if (!newCat.trim() || !newName.trim() || !newFormula.trim()) return;
    setSaving(true);
    try { await saveCustomFormula({ category: newCat.trim(), name: newName.trim(), formula: newFormula.trim() }); toast("Fórmula adicionada!", "success"); setNewCat(""); setNewName(""); setNewFormula(""); setShowAdd(false); const f = await getCustomFormulas(); setCustomFormulas(f as typeof customFormulas); } catch { toast("Erro", "error"); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => { try { await deleteCustomFormula(id); setCustomFormulas(f => f.filter(x => x.id !== id)); toast("Removida", "info"); } catch { toast("Erro", "error"); } };

  // Merge default + custom
  const customByCat: Record<string, { name: string; formula: string; id: string }[]> = {};
  customFormulas.forEach(f => { const c = String(f.category || "Outros"); if (!customByCat[c]) customByCat[c] = []; customByCat[c].push({ name: String(f.name), formula: String(f.formula), id: f.id }); });

  return (
    <div style={{ animation: "fadeUp 0.3s ease-out" }}>
      <div className="flex items-center justify-between mb-4">
        <div><h1 className="text-xl font-extrabold">Fórmulas</h1><p className="text-xs text-[var(--color-text-muted)]">Referência rápida</p></div>
        {isTeacher && <button onClick={() => setShowAdd(!showAdd)} className="px-3 py-1.5 rounded-lg bg-[var(--color-accent)] text-white text-[10px] font-bold cursor-pointer hover:bg-[var(--color-accent-hover)] transition">+ Adicionar</button>}
      </div>

      {showAdd && isTeacher && (
        <div className="p-4 rounded-xl border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5 mb-4 space-y-2" style={{ animation: "fadeUp 0.2s ease-out" }}>
          <h3 className="text-xs font-bold">Nova Fórmula</h3>
          <input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Categoria (ex: Álgebra)" className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)] text-xs focus:outline-none focus:border-[var(--color-accent)]" />
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome (ex: Fórmula de Bhaskara)" className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)] text-xs focus:outline-none focus:border-[var(--color-accent)]" />
          <input value={newFormula} onChange={e => setNewFormula(e.target.value)} placeholder="Fórmula (ex: x = -b ± √Δ / 2a)" className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)] text-xs focus:outline-none focus:border-[var(--color-accent)]" />
          <button onClick={handleAdd} disabled={saving} className="px-4 py-1.5 rounded-lg bg-[var(--color-accent)] text-white text-[10px] font-bold cursor-pointer disabled:opacity-50">{saving ? "..." : "Salvar"}</button>
        </div>
      )}

      <div className="space-y-2">
        {DEFAULT_FORMULAS.map((cat, i) => (
          <div key={cat.cat} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] overflow-hidden shadow-[var(--shadow-sm)]" style={{ animation: `fadeUp 0.3s ease-out ${i * 0.04}s both` }}>
            <button onClick={() => setOpenCat(openCat === i ? null : i)} className="w-full flex items-center justify-between p-3 cursor-pointer hover:bg-[var(--color-bg-card-hover)] transition"><span className="text-xs font-bold">{cat.cat}</span><IconChevron open={openCat === i} /></button>
            {openCat === i && (
              <div className="px-3 pb-3 border-t border-[var(--color-border)] pt-2 space-y-1.5" style={{ animation: "fadeUp 0.2s ease-out" }}>
                {cat.items.map(f => (
                  <div key={f.name} className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)]">
                    <span className="text-[11px] font-medium">{f.name}</span>
                    <code className="text-[10px] font-mono text-[var(--color-accent)] bg-[var(--color-accent)]/5 px-2 py-0.5 rounded">{f.formula}</code>
                  </div>
                ))}
                {customByCat[cat.cat]?.map(f => (
                  <div key={f.id} className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/20">
                    <span className="text-[11px] font-medium">{f.name}</span>
                    <div className="flex items-center gap-2">
                      <code className="text-[10px] font-mono text-[var(--color-accent)]">{f.formula}</code>
                      {isTeacher && <button onClick={() => handleDelete(f.id)} className="text-[9px] text-[var(--color-error)] cursor-pointer hover:underline">×</button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {/* Custom categories not in defaults */}
        {Object.keys(customByCat).filter(c => !DEFAULT_FORMULAS.some(d => d.cat === c)).map(cat => (
          <div key={cat} className="rounded-xl border border-[var(--color-accent)]/20 bg-[var(--color-bg-card)] overflow-hidden shadow-[var(--shadow-sm)]">
            <div className="p-3 border-b border-[var(--color-border)]"><span className="text-xs font-bold">{cat} <span className="text-[9px] text-[var(--color-accent)]">• Professor</span></span></div>
            <div className="p-3 space-y-1.5">
              {customByCat[cat].map(f => (
                <div key={f.id} className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)]">
                  <span className="text-[11px] font-medium">{f.name}</span>
                  <div className="flex items-center gap-2">
                    <code className="text-[10px] font-mono text-[var(--color-accent)]">{f.formula}</code>
                    {isTeacher && <button onClick={() => handleDelete(f.id)} className="text-[9px] text-[var(--color-error)] cursor-pointer hover:underline">×</button>}
                  </div>
                </div>
              ))}
            </div>
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
  const [notes, setNotes] = useState<{ id: string; content?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { try { setNotes(await getAllNotes(uid) as typeof notes); } catch {} setLoading(false); })(); }, [uid]);
  const lessonName = (id: string) => TRACKS.flatMap(t => t.lessons).find(l => l.id === id)?.title || id;

  return (
    <div style={{ animation: "fadeUp 0.3s ease-out" }}>
      <h1 className="text-xl font-extrabold mb-1">Anotações</h1>
      <p className="text-xs text-[var(--color-text-muted)] mb-4">Notas salvas durante as aulas</p>
      {loading ? <p className="text-xs text-[var(--color-text-muted)]" style={{ animation: "pulse 1.5s infinite" }}>Carregando...</p> :
        notes.length === 0 ? <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] text-center shadow-[var(--shadow-sm)]"><p className="text-2xl mb-1">📝</p><p className="text-xs text-[var(--color-text-muted)]">Nenhuma anotação ainda</p></div> :
        <div className="space-y-2">{notes.map((n, i) => (
          <div key={n.id} className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-sm)]" style={{ animation: `fadeUp 0.3s ease-out ${i * 0.04}s both` }}>
            <div className="flex items-center justify-between mb-1.5"><span className="text-xs font-bold">{lessonName(n.id)}</span>
              <button onClick={async () => { try { await deleteNote(uid, n.id); setNotes(ns => ns.filter(x => x.id !== n.id)); toast("Excluída", "info"); } catch {} }} className="text-[9px] text-[var(--color-error)] cursor-pointer hover:underline">Excluir</button>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] whitespace-pre-wrap">{String(n.content || "")}</p>
          </div>
        ))}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HISTORY
// ═══════════════════════════════════════════════════════════════
function HistoryView({ uid }: { uid: string }) {
  const [history, setHistory] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { try { setHistory(await getQuizHistory(uid)); } catch {} setLoading(false); })(); }, [uid]);

  return (
    <div style={{ animation: "fadeUp 0.3s ease-out" }}>
      <h1 className="text-xl font-extrabold mb-1">Histórico</h1>
      <p className="text-xs text-[var(--color-text-muted)] mb-4">Quizzes realizados</p>
      {loading ? <p className="text-xs text-[var(--color-text-muted)]" style={{ animation: "pulse 1.5s infinite" }}>Carregando...</p> :
        history.length === 0 ? <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] text-center shadow-[var(--shadow-sm)]"><p className="text-2xl mb-1">📊</p><p className="text-xs text-[var(--color-text-muted)]">Nenhum quiz completado</p></div> :
        <div className="space-y-2">{history.map((h, i) => {
          const date = h.completedAt && typeof h.completedAt === "object" && "seconds" in h.completedAt ? new Date(((h.completedAt as { seconds: number }).seconds) * 1000).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
          const pct = Number(h.percentage) || 0;
          return (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-sm)]" style={{ animation: `fadeUp 0.3s ease-out ${i * 0.04}s both` }}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold ${pct >= 80 ? "bg-green-50 text-[var(--color-success)] dark:bg-green-900/20" : pct >= 50 ? "bg-orange-50 text-[var(--color-warning)] dark:bg-orange-900/20" : "bg-red-50 text-[var(--color-error)] dark:bg-red-900/20"}`}>{String(pct)}%</div>
              <div className="flex-1 min-w-0"><p className="text-xs font-semibold truncate">{String(h.quizId || "Quiz").replace(/-/g, " ")}</p><p className="text-[9px] text-[var(--color-text-muted)]">{date}</p></div>
              <div className="text-right"><p className="text-xs font-bold">{String(h.score)}/{String(h.total)}</p><p className="text-[9px] text-[var(--color-success)]">+{String(h.xpEarned)} XP</p></div>
            </div>
          );
        })}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ACHIEVEMENTS (from real data!)
// ═══════════════════════════════════════════════════════════════
function AchievementsView({ profile }: { profile: Record<string, unknown> | null }) {
  const achievements = ACHIEVEMENT_DEFS.map(a => ({ ...a, unlocked: profile ? a.check(profile) : false }));
  const unlocked = achievements.filter(a => a.unlocked).length;

  return (
    <div style={{ animation: "fadeUp 0.3s ease-out" }}>
      <h1 className="text-xl font-extrabold mb-1">Conquistas</h1>
      <p className="text-xs text-[var(--color-text-muted)] mb-4">{unlocked}/{achievements.length} desbloqueadas</p>
      <div className="grid sm:grid-cols-2 gap-2">
        {achievements.map((a, i) => (
          <div key={a.id} className={`p-3 rounded-xl border transition shadow-[var(--shadow-sm)] ${a.unlocked ? "border-[var(--color-border)] bg-[var(--color-bg-card)]" : "border-[var(--color-border)] bg-[var(--color-bg-card)] opacity-40"}`} style={{ animation: `fadeUp 0.3s ease-out ${i * 0.04}s both` }}>
            <div className="flex items-start gap-2.5">
              <span className={`text-xl ${a.unlocked ? "" : "grayscale"}`}>{a.icon}</span>
              <div><h3 className="text-xs font-bold">{a.title}</h3><p className="text-[10px] text-[var(--color-text-muted)]">{a.desc}</p>
                {a.unlocked && <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-green-50 text-[var(--color-success)] dark:bg-green-900/20">✓ Desbloqueada</span>}
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
function LeaderboardView({ userName }: { userName: string }) {
  const [players, setPlayers] = useState<{ uid: string; name: string; xp: number; level: number; pos: number }[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { try { setPlayers(await getLeaderboard(10)); } catch {} setLoading(false); })(); }, []);

  return (
    <div style={{ animation: "fadeUp 0.3s ease-out" }}>
      <h1 className="text-xl font-extrabold mb-1">Ranking</h1>
      <p className="text-xs text-[var(--color-text-muted)] mb-4">Ranking dos alunos</p>
      {loading ? <p className="text-xs text-[var(--color-text-muted)]" style={{ animation: "pulse 1.5s infinite" }}>Carregando...</p> :
        players.length === 0 ? <p className="text-xs text-[var(--color-text-muted)]">Nenhum aluno cadastrado</p> :
        <div className="space-y-1.5">{players.map((p, i) => {
          const isYou = p.name === userName;
          return (
            <div key={p.uid} className={`flex items-center gap-3 p-3 rounded-xl border transition shadow-[var(--shadow-sm)] ${isYou ? "border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5" : "border-[var(--color-border)] bg-[var(--color-bg-card)]"}`} style={{ animation: `fadeUp 0.3s ease-out ${i * 0.04}s both` }}>
              <span className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold bg-[var(--color-bg-input)]">{i <= 2 ? ["🥇","🥈","🥉"][i] : i + 1}</span>
              <div className="flex-1 min-w-0"><p className="text-xs font-semibold truncate">{p.name} {isYou && <span className="text-[9px] text-[var(--color-accent)]">(você)</span>}</p></div>
              <div className="text-right"><p className="text-xs font-bold">{p.xp.toLocaleString()} XP</p><p className="text-[8px] text-[var(--color-text-muted)]">Nv.{p.level}</p></div>
            </div>
          );
        })}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// RULES
// ═══════════════════════════════════════════════════════════════
function RulesView() {
  const [open, setOpen] = useState<number | null>(0);
  const sections = [
    { icon: "📋", title: "Código de Conduta", items: ["Responda quizzes individualmente.", "Trate todos com respeito.", "Cumpra os prazos do professor.", "Use a plataforma para fins educacionais."] },
    { icon: "🛡️", title: "Anti-Fraude", items: ["Cópia (Ctrl+C) desabilitada nos quizzes.", "Saídas de tela são detectadas automaticamente.", "3ª saída cancela o quiz (nota zero).", "Infrações ficam registradas no banco de dados."] },
    { icon: "⚠️", title: "Penalidades", items: ["1ª infração: Alerta na tela.", "2ª infração: Notificação ao professor.", "3ª infração: Quiz cancelado, nota zero.", "Professor pode aplicar punições adicionais."] },
    { icon: "🎮", title: "Gamificação", items: ["10 XP por pergunta correta.", "500 XP = 1 nível.", "Conquistas por desafios especiais.", "Ranking em tempo real."] },
    { icon: "📖", title: "Como Funciona", items: ["Conteúdo em trilhas temáticas.", "Assista a videoaula antes do quiz.", "Tempo mínimo configurado pelo professor.", "Faça anotações durante as aulas."] },
  ];

  return (
    <div style={{ animation: "fadeUp 0.3s ease-out" }}>
      <h1 className="text-xl font-extrabold mb-1">Regras</h1>
      <p className="text-xs text-[var(--color-text-muted)] mb-4">Diretrizes da plataforma</p>
      <div className="space-y-1.5">
        {sections.map((s, i) => (
          <div key={s.title} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] overflow-hidden shadow-[var(--shadow-sm)]" style={{ animation: `fadeUp 0.3s ease-out ${i * 0.04}s both` }}>
            <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center gap-2 p-3 text-left cursor-pointer hover:bg-[var(--color-bg-card-hover)] transition"><span>{s.icon}</span><span className="flex-1 text-xs font-bold">{s.title}</span><IconChevron open={open === i} /></button>
            {open === i && (
              <div className="px-3 pb-3 border-t border-[var(--color-border)] pt-2 space-y-1" style={{ animation: "fadeUp 0.2s ease" }}>
                {s.items.map((item, j) => (
                  <div key={j} className="flex gap-2 p-2 rounded-lg bg-[var(--color-bg-primary)] text-xs text-[var(--color-text-secondary)]">
                    <span className="w-4 h-4 rounded bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center text-[8px] font-bold shrink-0">{j + 1}</span>{item}
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
// SETTINGS (Theme toggle)
// ═══════════════════════════════════════════════════════════════
function SettingsView() {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.getAttribute("data-theme") === "dark"); }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    if (next) { document.documentElement.setAttribute("data-theme", "dark"); localStorage.setItem("theme", "dark"); }
    else { document.documentElement.removeAttribute("data-theme"); localStorage.setItem("theme", "light"); }
  };

  return (
    <div style={{ animation: "fadeUp 0.3s ease-out" }}>
      <h1 className="text-xl font-extrabold mb-1">Configurações</h1>
      <p className="text-xs text-[var(--color-text-muted)] mb-4">Personalize sua experiência</p>
      <div className="max-w-md space-y-2">
        <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-sm)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">{dark ? "🌙" : "☀️"}</span>
            <div><h3 className="text-sm font-bold">Tema</h3><p className="text-[10px] text-[var(--color-text-muted)]">{dark ? "Modo escuro ativado" : "Modo claro ativado"}</p></div>
          </div>
          <button onClick={toggleTheme} className={`w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${dark ? "bg-[var(--color-accent)]" : "bg-[var(--color-border)]"}`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${dark ? "translate-x-6" : "translate-x-0"}`} />
          </button>
        </div>

        <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-sm)]">
          <h3 className="text-sm font-bold mb-1">Sobre</h3>
          <p className="text-xs text-[var(--color-text-muted)]">Saberes em Conexão v3.0</p>
          <p className="text-xs text-[var(--color-text-muted)]">Projeto Interdisciplinar</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-2">Plataforma educacional de matemática para alunos do 6º ao 9º ano.</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TEACHER PANEL
// ═══════════════════════════════════════════════════════════════
function TeacherView({ platformSettings, setPlatformSettings, toast }: { platformSettings: Record<string, unknown> | null; setPlatformSettings: (s: Record<string, unknown>) => void; toast: (m: string, t?: Toast["type"]) => void }) {
  const [waitTime, setWaitTime] = useState(String(platformSettings?.quizWaitTime || 20));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const data = { quizWaitTime: Number(waitTime) || 20 };
    try { await saveSettings(data); setPlatformSettings(data); toast("Configurações salvas!", "success"); } catch { toast("Erro ao salvar", "error"); }
    setSaving(false);
  };

  return (
    <div style={{ animation: "fadeUp 0.3s ease-out" }}>
      <h1 className="text-xl font-extrabold mb-1">Painel do Professor</h1>
      <p className="text-xs text-[var(--color-text-muted)] mb-4">Gerencie a plataforma</p>

      <div className="max-w-md space-y-3">
        <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-sm)]">
          <h3 className="text-sm font-bold mb-3">Configurações do Quiz</h3>
          <div className="mb-3">
            <label className="block text-[10px] font-semibold text-[var(--color-text-muted)] mb-1 uppercase tracking-wider">Tempo de espera (segundos)</label>
            <p className="text-[10px] text-[var(--color-text-muted)] mb-2">Tempo mínimo que o aluno deve permanecer na aula antes de desbloquear o quiz.</p>
            <input type="number" value={waitTime} onChange={e => setWaitTime(e.target.value)} min={0} max={600} className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-bg-input)] border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-accent)] transition" />
          </div>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-xl bg-[var(--color-accent)] text-white text-xs font-bold hover:bg-[var(--color-accent-hover)] transition cursor-pointer disabled:opacity-50">
            {saving ? "Salvando..." : "Salvar Configurações"}
          </button>
        </div>

        <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-sm)]">
          <h3 className="text-sm font-bold mb-2">Dicas</h3>
          <ul className="space-y-1 text-xs text-[var(--color-text-secondary)]">
            <li>• Para adicionar fórmulas, vá em <strong>Fórmulas</strong> e clique em "+ Adicionar".</li>
            <li>• Para se tornar professor, altere o campo <code className="text-[10px] bg-[var(--color-bg-input)] px-1 rounded">role</code> no Firestore para <code className="text-[10px] bg-[var(--color-bg-input)] px-1 rounded">TEACHER</code>.</li>
            <li>• Infrações dos alunos ficam em <code className="text-[10px] bg-[var(--color-bg-input)] px-1 rounded">users/{"{uid}"}/infractions</code>.</li>
          </ul>
        </div>
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
  const role = String(profile?.role || "STUDENT");
  const createdAt = profile?.createdAt && typeof profile.createdAt === "object" && "seconds" in (profile.createdAt as object)
    ? new Date(((profile.createdAt as { seconds: number }).seconds) * 1000).toLocaleDateString("pt-BR") : "—";

  return (
    <div style={{ animation: "fadeUp 0.3s ease-out" }}>
      <h1 className="text-xl font-extrabold mb-4">Meu Perfil</h1>
      <div className="max-w-md">
        <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] mb-3 flex items-center gap-4 shadow-[var(--shadow-sm)]">
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center text-xl font-bold">{name.charAt(0).toUpperCase()}</div>
          <div><h2 className="text-base font-bold">{name}</h2><p className="text-xs text-[var(--color-text-muted)]">{email}</p>
            <div className="flex items-center gap-2 mt-1"><span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-bold">{role}</span><span className="text-[9px] text-[var(--color-text-muted)]">Desde {createdAt}</span></div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[{ l: "XP", v: xp }, { l: "Nível", v: level }, { l: "Streak", v: streak }, { l: "Quizzes", v: Number(profile?.quizzesCompleted) || 0 }].map(s => (
            <div key={s.l} className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] text-center shadow-[var(--shadow-sm)]"><p className="text-lg font-extrabold">{s.v}</p><p className="text-[8px] text-[var(--color-text-muted)] uppercase">{s.l}</p></div>
          ))}
        </div>
        <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] mb-3 shadow-[var(--shadow-sm)]">
          <div className="flex justify-between text-[11px] mb-1"><span className="font-semibold">Nível {level} → {level + 1}</span><span className="text-[var(--color-text-muted)]">{xp % 500}/500</span></div>
          <div className="h-1.5 bg-[var(--color-bg-primary)] rounded-full overflow-hidden"><div className="h-full rounded-full bg-[var(--color-accent)] transition-all" style={{ width: `${((xp % 500) / 500) * 100}%` }} /></div>
        </div>
        <button onClick={logoutUser} className="w-full py-2.5 rounded-xl border border-red-200 text-[var(--color-error)] text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-900/10 dark:border-red-800 transition cursor-pointer">Sair da conta</button>
      </div>
    </div>
  );
}
