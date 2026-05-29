"use client";

import { useEffect, useState } from "react";
import { getCustomFormulas, type Formula } from "@/lib/firebase";

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

export default function FormulasPage() {
  const [firestoreFormulas, setFirestoreFormulas] = useState<Formula[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const f = await getCustomFormulas();
        setFirestoreFormulas(f);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Group Firestore formulas by category
  const groupedFirestore = firestoreFormulas.reduce((acc, f) => {
    if (!acc[f.category]) acc[f.category] = [];
    acc[f.category].push({ name: f.name, formula: f.formula });
    return acc;
  }, {} as Record<string, { name: string; formula: string }[]>);

  // Merge: use Firestore formulas if available, otherwise fallback to defaults
  const categories = firestoreFormulas.length > 0
    ? Object.entries(groupedFirestore).map(([cat, items]) => ({ cat, items }))
    : DEFAULT_FORMULAS;

  return (
    <div className="max-w-4xl mx-auto py-6 animate-fade-up">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center text-2xl shadow-inner border border-violet-500/20">
          ƒ
        </div>
        <div>
          <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-fuchsia-500">Banco de Fórmulas</h1>
          <p className="text-sm font-medium text-[var(--color-text-muted)]">Consulte rápido e mande bem</p>
        </div>
      </div>

      {loading ? (
        <div className="grid lg:grid-cols-2 gap-6">
          {[...Array(3)].map((_, i) => <div key={i} className="h-48 rounded-3xl bg-[var(--color-bg-secondary)] animate-pulse" />)}
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {categories.map((cat, i) => (
            <div 
              key={cat.cat} 
              className="p-6 rounded-3xl glass-card-static border border-[var(--color-border)] shadow-sm animate-fade-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-black text-[var(--color-text-primary)]">{cat.cat}</h3>
                <span className="px-2.5 py-1 rounded-lg bg-[var(--color-bg-secondary)] text-[10px] font-bold text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                  {cat.items.length} itens
                </span>
              </div>
              
              <div className="space-y-3">
                {cat.items.map((it, j) => (
                  <div key={j} className="p-4 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-violet-500/30 transition-colors">
                    <p className="text-xs font-bold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">{it.name}</p>
                    <p className="text-lg sm:text-xl font-mono font-bold text-violet-500 tracking-tight">{it.formula}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
