"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { saveQuizResult, saveInfraction, getQuizById, getQuizQuestions, type Question } from "@/lib/firebase";

export default function QuizPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const uid = user?.uid;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizTitle, setQuizTitle] = useState("Quiz");
  const [quizLoading, setQuizLoading] = useState(true);
  const [quizError, setQuizError] = useState("");

  const [cur, setCur] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [done, setDone] = useState(false);
  const [results, setResults] = useState<(boolean | null)[]>([]);
  const [time, setTime] = useState(120);
  const [warns, setWarns] = useState(0);
  const [maxInfractions, setMaxInfractions] = useState(3);
  const [resultSaved, setResultSaved] = useState(false);

  // Load quiz data from Firestore
  const loadQuiz = useCallback(async (quizId: string) => {
    setQuizLoading(true);
    setQuizError("");
    try {
      const quiz = await getQuizById(quizId);
      if (!quiz) {
        setQuizError("Quiz não encontrado.");
        setQuizLoading(false);
        return;
      }

      setQuizTitle(quiz.title || "Quiz");
      if (quiz.maxInfractions) setMaxInfractions(quiz.maxInfractions);
      if (quiz.isTimerEnabled && quiz.timeLimitSec) setTime(quiz.timeLimitSec);

      const qs = await getQuizQuestions(quizId);
      if (qs.length === 0) {
        setQuizError("Este quiz não tem perguntas.");
        setQuizLoading(false);
        return;
      }

      setQuestions(qs);
      setResults(qs.map(() => null));
    } catch (err) {
      console.error("Error loading quiz:", err);
      setQuizError("Erro ao carregar o quiz.");
    } finally {
      setQuizLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!id || typeof id !== "string") return;
    loadQuiz(id);
  }, [id, loadQuiz]);

  const q = questions[cur];

  // Timer
  useEffect(() => {
    if (done || quizLoading || questions.length === 0) return;
    const t = setInterval(() => {
      setTime(v => {
        if (v <= 1) {
          clearInterval(t);
          setDone(true);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [done, quizLoading, questions.length]);

  // Visibility (anti-cheat)
  useEffect(() => {
    if (quizLoading || questions.length === 0) return;
    const h = () => {
      if (document.hidden && !done) {
        setWarns(w => {
          const n = w + 1;
          if (uid) saveInfraction(uid, "SCREEN_EXIT", `Saída ${n}`).catch(() => {});
          if (n >= maxInfractions) setDone(true);
          return n;
        });
      }
    };
    document.addEventListener("visibilitychange", h);
    return () => document.removeEventListener("visibilitychange", h);
  }, [done, uid, quizLoading, questions.length, maxInfractions]);

  // Anti-copy
  useEffect(() => {
    const h = (e: Event) => e.preventDefault();
    document.addEventListener("copy", h);
    document.addEventListener("contextmenu", h);
    return () => {
      document.removeEventListener("copy", h);
      document.removeEventListener("contextmenu", h);
    };
  }, []);

  // Save result when done — use ref pattern to avoid setState-in-effect lint
  const saveResult = useCallback(async () => {
    if (!uid || questions.length === 0 || typeof id !== "string") return;
    const finalScore = results.filter(r => r === true).length;
    try {
      await saveQuizResult(uid, id, finalScore, questions.length, finalScore * 10);
      await refreshProfile();
    } catch (err) {
      console.error("Error saving result:", err);
    }
  }, [uid, questions.length, id, results, refreshProfile]);

  useEffect(() => {
    if (done && !resultSaved) {
      setResultSaved(true);
      saveResult();
    }
  }, [done, resultSaved, saveResult]);

  const confirm = () => {
    if (sel === null || !q) return;
    const ok = sel === q.correctIndex;
    const r = [...results];
    r[cur] = ok;
    setResults(r);
    setAnswered(true);
  };

  const next = () => {
    if (cur < questions.length - 1) {
      setCur(c => c + 1);
      setSel(null);
      setAnswered(false);
    } else {
      setDone(true);
    }
  };

  const onFinish = () => {
    router.push("/dashboard");
  };

  // Loading state
  if (quizLoading) {
    return (
      <div className="max-w-2xl mx-auto py-6 space-y-6 animate-fade-in">
        <div className="h-8 w-48 bg-[var(--color-bg-secondary)] rounded-lg animate-pulse" />
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => <div key={i} className="flex-1 h-2 rounded-full bg-[var(--color-bg-secondary)] animate-pulse" />)}
        </div>
        <div className="h-64 bg-[var(--color-bg-secondary)] rounded-3xl animate-pulse" />
      </div>
    );
  }

  // Error state
  if (quizError || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center animate-fade-up">
        <div className="text-5xl mb-4">❓</div>
        <h2 className="text-2xl font-black text-[var(--color-text-primary)] mb-2">{quizError || "Quiz indisponível"}</h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-6">O professor precisa adicionar perguntas a este quiz.</p>
        <button onClick={() => router.push("/dashboard")} className="px-6 py-3 rounded-xl btn-primary text-sm font-bold">
          Voltar ao Dashboard
        </button>
      </div>
    );
  }

  if (!uid) return null;

  // Result screen
  if (done) {
    const finalScore = results.filter(r => r === true).length;
    const pct = Math.round((finalScore / questions.length) * 100);
    const wasCancelled = warns >= maxInfractions;

    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-fade-up">
        <div className="text-center max-w-sm w-full p-8 rounded-3xl glass-card-static">
          {wasCancelled && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold animate-shake">
              ⚠ Cancelado: Muitas saídas de tela ({warns})
            </div>
          )}
          
          <div className="text-6xl mb-4 animate-bounce-in">
            {wasCancelled ? "🚫" : pct >= 80 ? "🏆" : pct >= 50 ? "⭐" : "💡"}
          </div>
          
          <h2 className="text-2xl font-black mb-1 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-violet-500">
            {wasCancelled ? "Quiz Cancelado" : pct >= 80 ? "Excelente!" : pct >= 50 ? "Muito Bom!" : "Continue Tentando!"}
          </h2>

          <p className="text-sm text-[var(--color-text-muted)] mb-6">{quizTitle}</p>
          
          <div className="flex justify-center gap-8 my-6">
            <div className="text-center">
              <p className="text-3xl font-black">{finalScore}/{questions.length}</p>
              <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Acertos</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-emerald-500">+{finalScore * 10}</p>
              <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">XP Ganho</p>
            </div>
          </div>
          
          <div className="flex justify-center gap-2 mb-8">
            {results.map((r, i) => (
              <div 
                key={i} 
                className={`w-8 h-8 rounded-lg text-sm font-bold flex items-center justify-center border shadow-sm animate-fade-up
                  ${r === true ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/10" 
                  : r === false ? "border-red-500/30 text-red-600 bg-red-500/10" 
                  : "border-[var(--color-border)] text-[var(--color-text-muted)] bg-[var(--color-bg-secondary)]"}`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {r === true ? "✓" : r === false ? "✗" : "–"}
              </div>
            ))}
          </div>
          
          <button 
            onClick={onFinish} 
            className="w-full py-3.5 rounded-xl btn-primary text-sm font-bold"
          >
            Voltar para o Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Quiz in progress
  return (
    <div className="max-w-2xl mx-auto py-6 animate-fade-up">
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => router.push("/dashboard")} 
          className="text-xs font-bold text-[var(--color-text-muted)] hover:text-indigo-500 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Sair do Quiz
        </button>
        <div className="flex items-center gap-3">
          {warns > 0 && (
            <span className="text-[10px] px-2 py-1 rounded-md bg-amber-500/10 text-amber-600 font-bold border border-amber-500/20 shadow-sm animate-pulse">
              ⚠ {warns}/{maxInfractions}
            </span>
          )}
          <span className={`text-xs font-mono font-bold px-3 py-1.5 rounded-lg border shadow-sm
            ${time <= 30 ? "border-red-500/30 text-red-600 bg-red-500/10 animate-pulse" : "border-[var(--color-border)] bg-[var(--color-bg-secondary)]"}`
          }>
            {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Title */}
      <p className="text-sm font-bold text-[var(--color-text-muted)] mb-4">{quizTitle}</p>

      {/* Progress Bar */}
      <div className="flex gap-1.5 mb-8">
        {questions.map((_, i) => (
          <div 
            key={i} 
            className={`flex-1 h-2 rounded-full transition-colors duration-300 shadow-inner
              ${i < cur 
                ? (results[i] ? "bg-emerald-500 shadow-emerald-500/20" : "bg-red-500 shadow-red-500/20") 
                : i === cur ? "bg-indigo-500 shadow-indigo-500/20" : "bg-[var(--color-bg-secondary)] border border-[var(--color-border)]"}`
            } 
          />
        ))}
      </div>

      <div key={cur} className="p-6 sm:p-8 rounded-3xl glass-card-static mb-6 animate-fade-in">
        <p className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
          Pergunta {cur + 1} de {questions.length}
        </p>
        <h3 className="text-xl sm:text-2xl font-bold mb-8 leading-tight">
          {q.text}
        </h3>
        
        <div className="space-y-3">
          {q.options.map((opt, idx) => {
            const letter = String.fromCharCode(65 + idx);
            let cls = "border-[var(--color-border)] hover:border-indigo-500/30 hover:bg-indigo-500/5";
            let letterCls = "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]";
            
            if (answered && idx === q.correctIndex) {
              cls = "border-emerald-500/50 bg-emerald-500/10 shadow-sm shadow-emerald-500/10";
              letterCls = "bg-emerald-500 text-white shadow-sm";
            } else if (answered && idx === sel) {
              cls = "border-red-500/50 bg-red-500/10 shadow-sm shadow-red-500/10";
              letterCls = "bg-red-500 text-white shadow-sm";
            } else if (sel === idx) {
              cls = "border-indigo-500 shadow-md shadow-indigo-500/10 bg-indigo-500/5";
              letterCls = "bg-indigo-500 text-white shadow-sm";
            }

            return (
              <button 
                key={idx} 
                onClick={() => !answered && setSel(idx)} 
                disabled={answered}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${!answered ? "cursor-pointer active:scale-[0.99]" : ""} ${cls}`}
                style={answered && idx === sel && idx !== q.correctIndex ? { animation: "shake 0.4s ease" } : {}}
              >
                <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black transition-colors ${letterCls}`}>
                  {answered && idx === q.correctIndex ? "✓" : answered && idx === sel ? "✗" : letter}
                </span>
                <span className="text-sm sm:text-base font-semibold">{opt}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        {!answered ? (
          <button 
            onClick={confirm} 
            disabled={sel === null} 
            className={`px-8 py-3.5 rounded-xl text-sm font-bold transition-all shadow-sm
              ${sel !== null 
                ? "btn-primary cursor-pointer" 
                : "bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] cursor-not-allowed border border-[var(--color-border)]"}`
            }
          >
            Confirmar
          </button>
        ) : (
          <button 
            onClick={next} 
            className="px-8 py-3.5 rounded-xl btn-primary text-sm font-bold shadow-sm"
          >
            {cur < questions.length - 1 ? "Próxima Pergunta →" : "Ver Resultado Final"}
          </button>
        )}
      </div>
    </div>
  );
}
