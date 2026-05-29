"use client";

import { useState } from "react";

export default function CalculatorPage() {
  const [d, setD] = useState("0");
  const [prev, setPrev] = useState("");
  const [op, setOp] = useState("");
  const [fresh, setFresh] = useState(true);

  const input = (v: string) => { 
    if (fresh) { 
      setD(v === "." ? "0." : v); 
      setFresh(false); 
    } else { 
      if (v === "." && d.includes(".")) return; 
      setD(d === "0" && v !== "." ? v : d + v); 
    } 
  };
  
  const operate = (o: string) => { 
    setPrev(d); 
    setOp(o); 
    setFresh(true); 
  };
  
  const calc = () => { 
    const a = parseFloat(prev), b = parseFloat(d); 
    if (isNaN(a)) return; 
    let r = 0; 
    switch (op) { 
      case "+": r = a + b; break; 
      case "-": r = a - b; break; 
      case "×": r = a * b; break; 
      case "÷": r = b !== 0 ? a / b : 0; break; 
    } 
    setD(String(parseFloat(r.toFixed(10)))); 
    setPrev(""); 
    setOp(""); 
    setFresh(true); 
  };
  
  const clear = () => { 
    setD("0"); 
    setPrev(""); 
    setOp(""); 
    setFresh(true); 
  };

  const B = (l: string, fn: () => void, c?: string) => (
    <button 
      onClick={fn} 
      className={`h-14 sm:h-16 rounded-2xl font-black text-xl transition-all active:scale-95 shadow-sm 
        ${c || "bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-bg-input)] hover:border-indigo-500/30 text-[var(--color-text-primary)]"}`}
    >
      {l}
    </button>
  );

  return (
    <div className="max-w-md mx-auto py-6 animate-fade-up">
      <div className="text-center mb-8">
        <div className="inline-block p-4 rounded-3xl bg-indigo-500/10 text-indigo-500 mb-4 shadow-inner">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
        </div>
        <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-violet-500">Calculadora</h1>
        <p className="text-sm font-medium text-[var(--color-text-muted)]">Ferramenta de auxílio matemático</p>
      </div>

      <div className="p-6 rounded-[2rem] glass-card shadow-lg shadow-indigo-500/5">
        <div className="mb-6 p-5 rounded-2xl bg-[var(--color-bg-secondary)] border-2 border-[var(--color-border)] shadow-inner text-right min-h-[96px] flex flex-col justify-end overflow-hidden relative">
          {op && <div className="text-sm font-bold text-[var(--color-text-muted)] absolute top-4 right-5">{prev} {op}</div>}
          <div className="text-4xl sm:text-5xl font-black text-[var(--color-text-primary)] tracking-tight truncate">
            {d}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 sm:gap-4">
          {B("C", clear, "bg-red-500/10 text-red-600 border border-red-500/20 hover:bg-red-500/20")}
          {B("(", () => {}, "opacity-50 cursor-not-allowed bg-[var(--color-bg-secondary)]")}
          {B(")", () => {}, "opacity-50 cursor-not-allowed bg-[var(--color-bg-secondary)]")}
          {B("÷", () => operate("÷"), "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 hover:bg-indigo-500/20")}
          
          {B("7", () => input("7"))}
          {B("8", () => input("8"))}
          {B("9", () => input("9"))}
          {B("×", () => operate("×"), "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 hover:bg-indigo-500/20")}
          
          {B("4", () => input("4"))}
          {B("5", () => input("5"))}
          {B("6", () => input("6"))}
          {B("-", () => operate("-"), "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 hover:bg-indigo-500/20")}
          
          {B("1", () => input("1"))}
          {B("2", () => input("2"))}
          {B("3", () => input("3"))}
          {B("+", () => operate("+"), "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 hover:bg-indigo-500/20")}
          
          {B("0", () => input("0"), "col-span-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-bg-input)]")}
          {B(".", () => input("."))}
          {B("=", calc, "bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/30 hover:shadow-lg")}
        </div>
      </div>
    </div>
  );
}
