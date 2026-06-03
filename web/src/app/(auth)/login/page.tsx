"use client";

import { useState, useEffect, useMemo } from "react";
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
    if (!authLoading && user) router.replace("/dashboard");
  }, [user, authLoading, router]);

  const pwStr = useMemo(() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 6) s++;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    return Math.min(s, 4);
  }, [password]);

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
        "auth/weak-password": "Senha fraca",
        "auth/invalid-credential": "Email ou senha incorretos",
      };
      setError(msgs[c] || "Erro de conexão");
      setLoading(false);
    }
  };

  if (authLoading || user) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
      <div className="w-10 h-10 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const [greeting, setGreeting] = useState("Olá");

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Bom dia ☀️" : hour < 18 ? "Boa tarde 🌤️" : "Boa noite 🌙");
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--color-bg)" }}>
      <div className="w-full max-w-sm animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center text-white text-2xl font-black" style={{ background: "var(--color-primary)" }}>
            S
          </div>
          <h1 className="text-2xl font-black">Saberes em Conexão</h1>
          <p className="text-xs font-bold mt-1 uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Conhecer • Conectar • Transformar</p>
        </div>

        {/* Form Card */}
        <div className="card p-6">
          <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-text-muted)" }}>{greeting}</p>
          <h2 className="text-xl font-black mb-1">{mode === "login" ? "Entrar" : "Criar conta"}</h2>
          <p className="text-sm mb-5" style={{ color: "var(--color-text-muted)" }}>
            {mode === "login" ? "Acesse sua conta" : "Preencha seus dados"}
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-xs font-bold animate-shake" style={{ background: "var(--color-error-bg)", color: "var(--color-error)", border: "2px solid var(--color-error)" }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-3">
            {mode === "register" && (
              <div>
                <label className="block text-xs font-bold mb-1 uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Nome</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Seu nome" className="input-clean" autoFocus={mode === "register"} />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold mb-1 uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com" className="input-clean" autoFocus={mode === "login"} />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Senha</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••" minLength={6} className="input-clean pr-16" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase px-2 py-1 rounded cursor-pointer" style={{ color: "var(--color-text-muted)" }}>
                  {showPass ? "Ocultar" : "Ver"}
                </button>
              </div>
              {mode === "register" && password.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {[0,1,2,3].map(i => (
                    <div key={i} className="h-1.5 flex-1 rounded-full transition-all" style={{ background: i < pwStr ? (pwStr >= 3 ? "var(--color-success)" : pwStr >= 2 ? "var(--color-warning)" : "var(--color-error)") : "var(--color-divider)" }} />
                  ))}
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary py-3 text-sm flex items-center justify-center gap-2 mt-2" style={{ borderRadius: "var(--radius)" }}>
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (mode === "login" ? "Entrar ▸" : "Criar conta ▸")}
            </button>
          </form>

          <div className="mt-6 pt-4 text-center" style={{ borderTop: "1px solid var(--color-divider)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-muted)" }}>
              {mode === "login" ? "Não tem conta?" : "Já tem conta?"}
              <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
                className="ml-1 font-bold underline cursor-pointer" style={{ color: "var(--color-primary)" }}>
                {mode === "login" ? "Cadastre-se" : "Fazer login"}
              </button>
            </p>
          </div>
        </div>

        <p className="text-center mt-4 text-[10px] font-bold" style={{ color: "var(--color-text-muted)" }}>
          Projeto Interdisciplinar · Ensino Fundamental
        </p>
      </div>
    </div>
  );
}
