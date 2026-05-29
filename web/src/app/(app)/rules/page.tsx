"use client";

import { useState } from "react";

export default function RulesPage() {
  const [open, setOpen] = useState<number | null>(0);
  
  const sections = [
    { icon: "📜", title: "Código de Conduta", items: ["Responda quizzes individualmente.", "Trate todos com respeito.", "Cumpra os prazos do professor.", "Use a plataforma para fins educacionais."] },
    { icon: "🛡️", title: "Anti-Fraude", items: ["Cópia (Ctrl+C) desabilitada nos quizzes.", "Saídas de tela são detectadas automaticamente.", "3ª saída cancela o quiz (nota zero).", "Infrações ficam registradas no banco de dados."] },
    { icon: "⚠️", title: "Penalidades", items: ["1ª infração: Alerta na tela.", "2ª infração: Notificação ao professor.", "3ª infração: Quiz cancelado, nota zero.", "Professor pode aplicar punições adicionais."] },
    { icon: "🎮", title: "Gamificação", items: ["10 XP por pergunta correta.", "500 XP = 1 nível.", "Conquistas por desafios especiais.", "Ranking em tempo real."] },
    { icon: "💡", title: "Como Funciona", items: ["Conteúdo em trilhas temáticas.", "Assista a videoaula antes do quiz.", "Tempo mínimo configurado pelo professor.", "Faça anotações durante as aulas."] },
  ];

  return (
    <div className="max-w-2xl mx-auto py-6 animate-fade-up">
      <h1 className="text-3xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-violet-500">Regras e Diretrizes</h1>
      <p className="text-sm font-medium text-[var(--color-text-muted)] mb-8">Saiba como utilizar a plataforma corretamente.</p>

      <div className="space-y-3">
        {sections.map((s, i) => (
          <div 
            key={s.title} 
            className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-card)] overflow-hidden shadow-sm transition-shadow hover:shadow-md"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <button 
              onClick={() => setOpen(open === i ? null : i)} 
              className="w-full flex items-center gap-4 p-5 text-left cursor-pointer transition-colors hover:bg-[var(--color-bg-input)]"
            >
              <span className="text-2xl">{s.icon}</span>
              <span className="flex-1 text-sm font-bold text-[var(--color-text-primary)]">{s.title}</span>
              <span className={`text-[var(--color-text-muted)] transition-transform duration-300 ${open === i ? "rotate-180" : ""}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </span>
            </button>
            
            <div 
              className={`overflow-hidden transition-all duration-300 ease-in-out ${open === i ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
            >
              <div className="px-5 pb-5 pt-2 space-y-2 border-t border-[var(--color-border)] bg-[var(--color-bg-primary)]/50">
                {s.items.map((item, j) => (
                  <div key={j} className="flex gap-3 p-3 rounded-xl bg-[var(--color-bg-secondary)] text-sm text-[var(--color-text-secondary)] shadow-sm">
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-xs font-black shrink-0 border border-indigo-500/20">
                      {j + 1}
                    </span>
                    <span className="pt-0.5 leading-relaxed font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
