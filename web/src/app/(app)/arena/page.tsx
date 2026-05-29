"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getDuelsForUser, createDuel, getAllStudents, Duel } from "@/lib/firebase";
import ArenaPlayer from "@/components/arena/ArenaPlayer";
import Link from "next/link";

interface Student {
  uid: string;
  name?: string;
  level?: number;
}

export default function ArenaPage() {
  const { user, profile } = useAuth();
  const [duels, setDuels] = useState<Duel[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDuel, setActiveDuel] = useState<Duel | null>(null);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [challengeLoading, setChallengeLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [userDuels, allStudents] = await Promise.all([
        getDuelsForUser(user.uid),
        getAllStudents()
      ]);
      setDuels(userDuels);
      setStudents(allStudents.filter(s => s.uid !== user.uid));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!user || !profile) return null;

  if (activeDuel) {
    return <ArenaPlayer duel={activeDuel} onClose={() => { setActiveDuel(null); loadData(); }} />;
  }

  const handleChallenge = async (opponentId: string) => {
    setChallengeLoading(true);
    try {
      const oppName = students.find(s => s.uid === opponentId)?.name || "Oponente";
      const myName = user.displayName || profile.name || "Você";
      await createDuel(user.uid, myName as string, opponentId, oppName);
      setShowChallengeModal(false);
      loadData();
    } catch (err) {
      console.error("Erro ao criar duelo", err);
    }
    setChallengeLoading(false);
  };

  const pendingDuels = duels.filter(d => d.status === "pending" || d.status === "in_progress");
  const completedDuels = duels.filter(d => d.status === "completed");

  const myTurnDuels = pendingDuels.filter(d => {
    const isChallenger = d.challengerId === user.uid;
    if (isChallenger) return !d.challengerResult;
    return !d.opponentResult;
  });

  const waitingForOpponent = pendingDuels.filter(d => {
    const isChallenger = d.challengerId === user.uid;
    if (isChallenger) return !!d.challengerResult;
    return !!d.opponentResult;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black mb-2 flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
            <span className="text-4xl">⚔️</span> Arena Matemática
          </h1>
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">
            Desafie outros alunos, ganhe XP extra e moedas de ouro!
          </p>
        </div>
        <button 
          onClick={() => setShowChallengeModal(true)}
          className="btn-primary flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold"
        >
          <span>Desafiar Aluno</span>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card p-5 text-center">
          <p className="text-3xl font-black text-indigo-500 mb-1">{Number(profile.duelsPlayed) || 0}</p>
          <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Jogados</p>
        </div>
        <div className="stat-card p-5 text-center">
          <p className="text-3xl font-black text-emerald-500 mb-1">{Number(profile.duelsWon) || 0}</p>
          <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Vitórias</p>
        </div>
        <div className="stat-card p-5 text-center">
          <p className="text-3xl font-black text-red-500 mb-1">{Number(profile.duelsLost) || 0}</p>
          <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Derrotas</p>
        </div>
        <div className="stat-card p-5 text-center">
          <p className="text-3xl font-black text-yellow-500 mb-1">{Number(profile.coins) || 0}</p>
          <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Moedas</p>
        </div>
      </div>

      {loading ? (
        <div className="h-40 rounded-2xl bg-[var(--color-bg-secondary)] animate-pulse" />
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Minha Vez */}
          <div>
            <h2 className="text-xl font-black mb-4 flex items-center gap-2">
              <span className="text-emerald-500">▶️</span> Sua Vez ({myTurnDuels.length})
            </h2>
            <div className="space-y-3">
              {myTurnDuels.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)] italic">Nenhum duelo pendente para você jogar.</p>
              ) : (
                myTurnDuels.map(duel => (
                  <div key={duel.id} className="glass-card p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm">
                        {duel.challengerId === user.uid ? "Você desafiou" : "Desafiado por"} <span className="text-indigo-500">{duel.challengerId === user.uid ? (students.find(s => s.uid === duel.opponentId)?.name || "Alguém") : (students.find(s => s.uid === duel.challengerId)?.name || "Alguém")}</span>
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">Valendo {duel.coinsReward} moedas!</p>
                    </div>
                    <button onClick={() => setActiveDuel(duel)} className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-bold text-xs hover:scale-105 transition-transform shadow-md shadow-emerald-500/20">
                      Jogar Agora
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Aguardando Oponente */}
          <div>
            <h2 className="text-xl font-black mb-4 flex items-center gap-2">
              <span className="text-amber-500">⏳</span> Aguardando ({waitingForOpponent.length})
            </h2>
            <div className="space-y-3">
              {waitingForOpponent.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)] italic">Ninguém está na sua lista de espera.</p>
              ) : (
                waitingForOpponent.map(duel => (
                  <div key={duel.id} className="glass-card-static opacity-70 p-4 flex items-center justify-between border-dashed">
                    <div>
                      <p className="font-bold text-sm">
                        Aguardando <span className="text-amber-500">{duel.challengerId === user.uid ? (students.find(s => s.uid === duel.opponentId)?.name || "Alguém") : (students.find(s => s.uid === duel.challengerId)?.name || "Alguém")}</span>
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">Você já jogou sua vez.</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Histórico Recente */}
      {!loading && completedDuels.length > 0 && (
        <div className="pt-8">
          <h2 className="text-xl font-black mb-4 flex items-center gap-2">
            <span className="text-indigo-500">📜</span> Últimos Duelos
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedDuels.slice(0, 6).map(duel => {
              const iWon = duel.winnerId === user.uid;
              const isDraw = !duel.winnerId;
              const opponent = duel.challengerId === user.uid ? duel.opponentId : duel.challengerId;
              const oppName = students.find(s => s.uid === opponent)?.name || "Oponente";
              return (
                <div key={duel.id} className="glass-card-static p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-black px-2 py-1 rounded-md ${iWon ? "bg-emerald-500/10 text-emerald-500" : isDraw ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"}`}>
                        {iWon ? "VITÓRIA" : isDraw ? "EMPATE" : "DERROTA"}
                      </span>
                      {iWon && <span className="text-xs font-bold text-yellow-500">+{duel.coinsReward} 🟡</span>}
                    </div>
                    <p className="text-sm font-bold mt-2">vs {oppName}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Desafiar */}
      {showChallengeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-card p-6 w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black">Escolha um oponente</h3>
              <button onClick={() => setShowChallengeModal(false)} className="text-[var(--color-text-muted)] hover:text-red-500">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-2">
              {students.length === 0 ? (
                <p className="text-sm text-center text-[var(--color-text-muted)] py-8">Nenhum outro aluno encontrado.</p>
              ) : (
                students.map(student => (
                  <div key={student.uid} className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-indigo-500 transition-colors">
                    <p className="font-bold text-sm">{student.name}</p>
                    <button
                      disabled={challengeLoading}
                      onClick={() => handleChallenge(student.uid)}
                      className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-bold disabled:opacity-50 transition-colors"
                    >
                      Desafiar
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
