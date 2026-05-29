"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { registerUser, loginUser } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginScreen() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        if (!name.trim()) { setError("Nome obrigatório"); setLoading(false); return; }
        if (password.length < 6) { setError("Mínimo 6 caracteres"); setLoading(false); return; }
        await registerUser(name.trim(), email.trim(), password);
      } else {
        await loginUser(email.trim(), password);
      }
    } catch (err: unknown) {
      const c = (err as { code?: string }).code || "";
      const msgs: Record<string, string> = {
        "auth/email-already-in-use": "Email já cadastrado",
        "auth/invalid-email": "Email inválido",
        "auth/weak-password": "Senha muito fraca",
        "auth/invalid-credential": "Email ou senha incorretos",
      };
      setError(msgs[c] || "Erro de conexão");
      setLoading(false);
    }
  };

  if (authLoading || user) return <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
  </div>;

  return (
    <div className="min-h-screen flex bg-[var(--color-bg-primary)] overflow-hidden">
      {/* Left branding (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)]">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 pointer-events-none" />
        <div className="text-center max-w-sm z-10 animate-fade-up">
          <Image src="/logo.jpeg" alt="Logo" width={128} height={128} className="rounded-3xl mx-auto mb-6 object-cover shadow-2xl shadow-indigo-500/20" />
          <h1 className="text-3xl font-extrabold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-violet-500">Saberes em Conexão</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mb-8 font-medium">Conhecer • Conectar • Transformar</p>
          <div className="grid grid-cols-3 gap-4">
            {[{ n: "12", l: "Aulas" }, { n: "50+", l: "Questões" }, { n: "4", l: "Trilhas" }].map(s => (
              <div key={s.l} className="p-4 rounded-2xl glass-card text-center">
                <p className="text-2xl font-black text-indigo-500">{s.n}</p>
                <p className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mt-1">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-10 relative">
        <div className="w-full max-w-sm z-10 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="lg:hidden text-center mb-8">
            <Image src="/logo.jpeg" alt="Logo" width={64} height={64} className="rounded-2xl mx-auto mb-3 object-cover shadow-xl shadow-indigo-500/20" />
            <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-violet-500">Saberes em Conexão</h1>
          </div>

          <div className="p-8 rounded-3xl glass-card">
            <h2 className="text-2xl font-black mb-1">{mode === "login" ? "Entrar" : "Criar conta"}</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              {mode === "login" ? "Acesse sua conta para continuar" : "Preencha seus dados para começar"}
            </p>

            {error && (
              <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2 animate-shake">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              {mode === "register" && (
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-muted)] mb-1.5 uppercase tracking-wider">Nome</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Seu nome completo" className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-input)] border border-[var(--color-border)] text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-sm" />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-muted)] mb-1.5 uppercase tracking-wider">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com" className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-input)] border border-[var(--color-border)] text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-muted)] mb-1.5 uppercase tracking-wider">Senha</label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••" minLength={6} className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-input)] border border-[var(--color-border)] text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-sm pr-20" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition cursor-pointer text-[10px] font-bold uppercase tracking-wider">
                    {showPass ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>
              
              <button type="submit" disabled={loading} className="w-full mt-2 py-3.5 rounded-xl btn-primary text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : mode === "login" ? "Entrar na Plataforma" : "Criar minha conta"}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-[var(--color-border)] text-center">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                {mode === "login" ? "Não tem conta?" : "Já tem conta?"}
                <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} className="ml-2 text-indigo-500 font-bold hover:text-indigo-600 transition underline decoration-2 underline-offset-4 cursor-pointer">
                  {mode === "login" ? "Cadastre-se grátis" : "Fazer login"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
