"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getNote, saveNote } from "@/lib/firebase";

export default function NotesPage() {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const n = await getNote(user.uid, "geral");
        if (n) setContent(String(n.content));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setMsg("");
    try {
      await saveNote(user.uid, "geral", content);
      setMsg("✅ Bloco salvo com sucesso!");
      setTimeout(() => setMsg(""), 3000);
    } catch {
      setMsg("❌ Erro ao salvar");
    }
    setSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 animate-fade-up flex flex-col h-[calc(100vh-6rem)]">
      <div className="flex items-end justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-500 mb-1">Bloco de Notas</h1>
          <p className="text-sm font-medium text-[var(--color-text-muted)]">Rascunhos gerais e lembretes</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving || loading} 
          className="px-6 py-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white text-sm font-bold shadow-md shadow-orange-500/20 hover:shadow-lg transition-all disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar Bloco"}
        </button>
      </div>
      
      {msg && (
        <div className="mb-4 text-sm font-bold text-[var(--color-text-primary)] animate-fade-in shrink-0">
          {msg}
        </div>
      )}

      <div className="flex-1 min-h-0 relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 rounded-3xl -z-10 group-focus-within:from-amber-500/10 group-focus-within:to-orange-500/10 transition-colors" />
        <textarea 
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={loading ? "Carregando..." : "Digite suas anotações, ideias ou dúvidas aqui..."}
          disabled={loading}
          className="w-full h-full p-6 sm:p-8 rounded-3xl glass-card border border-[var(--color-border)] focus:outline-none focus:border-orange-500/50 resize-none font-mono text-sm sm:text-base leading-relaxed placeholder:text-[var(--color-text-muted)] transition-all shadow-inner disabled:opacity-50 bg-[var(--color-bg-card)]/80 backdrop-blur-md"
        />
      </div>
    </div>
  );
}
