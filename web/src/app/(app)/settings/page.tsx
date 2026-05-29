"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return true;
    const saved = localStorage.getItem("theme");
    return saved === "dark" || !saved;
  });

  const toggleTheme = () => {
    const val = !dark;
    setDark(val);
    if (val) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 animate-fade-up">
      <h1 className="text-3xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-violet-500">Configurações</h1>
      <p className="text-sm font-medium text-[var(--color-text-muted)] mb-8">Personalize sua experiência.</p>

      <div className="space-y-4">
        <div className="p-6 rounded-3xl glass-card-static flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold mb-1">Tema da Interface</h3>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {dark ? "Modo escuro ativado" : "Modo claro ativado"}
            </p>
          </div>
          <button 
            onClick={toggleTheme} 
            className={`relative w-14 h-8 rounded-full p-1 transition-colors duration-300 cursor-pointer shadow-inner ${dark ? "bg-indigo-500" : "bg-[var(--color-border)]"}`}
          >
            <div className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center ${dark ? "translate-x-6" : "translate-x-0"}`}>
              {dark ? (
                <svg className="w-3.5 h-3.5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>
              ) : (
                <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"></path></svg>
              )}
            </div>
          </button>
        </div>

        <div className="p-6 rounded-3xl glass-card-static">
          <h3 className="text-base font-bold mb-4">Sobre a Aplicação</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center font-black shadow-sm">
                V5
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--color-text-primary)]">Saberes em Conexão</p>
                <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Projeto Interdisciplinar</p>
              </div>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed pt-2 border-t border-[var(--color-border)]">
              Plataforma educacional imersiva de matemática desenvolvida para alunos do 6º ao 9º ano. 
              Criada com foco na fixação de conhecimento usando mecânicas de gamificação. Frontend conectado 100% ao Firestore.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
