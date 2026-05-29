"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getTracks, getLessonsByTrack, getQuizzesByLessonId, getCompletedQuizIds, type Track, type Lesson } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface TrackWithLessons extends Track {
  lessons: (Lesson & { completed: boolean; quizId?: string })[];
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  
  const [tracks, setTracks] = useState<TrackWithLessons[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const allTracks = await getTracks();
      const completedQuizIds = await getCompletedQuizIds(user.uid);

      const tracksWithLessons: TrackWithLessons[] = [];
      
      for (const track of allTracks) {
        const lessons = await getLessonsByTrack(track.id);
        const lessonsWithCompletion = await Promise.all(
          lessons.filter(l => l.isPublished).map(async (lesson) => {
            const quizzes = await getQuizzesByLessonId(lesson.id);
            const quizId = quizzes.length > 0 ? quizzes[0].id : undefined;
            const completed = quizId ? completedQuizIds.includes(quizId) : false;
            return { ...lesson, completed, quizId };
          })
        );
        
        if (lessonsWithCompletion.length > 0) {
          tracksWithLessons.push({ ...track, lessons: lessonsWithCompletion });
        }
      }

      setTracks(tracksWithLessons);
    } catch (err) {
      console.error("Error loading dashboard:", err);
      setError("Erro ao carregar dados. Verifique a conexão.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user, loadData]);

  if (!user) return null;

  const name = user.displayName || String(profile?.name) || "Aluno";
  const firstName = name.split(" ")[0];
  const xp = Number(profile?.xp) || 0;
  const level = Math.floor(xp / 500) + 1;
  const streak = Number(profile?.streak) || 0;
  const quizzesCompleted = Number(profile?.quizzesCompleted) || 0;

  // Calculate overall progress
  const totalLessons = tracks.reduce((acc, t) => acc + t.lessons.length, 0);
  const completedLessons = tracks.reduce((acc, t) => acc + t.lessons.filter(l => l.completed).length, 0);
  const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="animate-fade-up">
        <h1 className="text-3xl sm:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 mb-1">
          Olá, {firstName}! 👋
        </h1>
        <p className="text-sm font-medium text-[var(--color-text-secondary)]">O que vamos aprender hoje?</p>
      </header>

      {/* Stats Cards */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 animate-fade-up" style={{ animationDelay: "0.1s" }}>
        {[
          { label: "XP Total", value: xp.toLocaleString(), color: "from-indigo-500 to-violet-500", icon: "⚡" },
          { label: "Nível", value: level, color: "from-violet-500 to-purple-500", icon: "🎯" },
          { label: "Sequência", value: `${streak} dias`, color: "from-emerald-500 to-teal-500", icon: "🔥" },
          { label: "Quizzes", value: quizzesCompleted, color: "from-amber-500 to-orange-500", icon: "📝" },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className="stat-card p-4 sm:p-5 text-center animate-fade-up"
            style={{ animationDelay: `${0.1 + i * 0.05}s` }}
          >
            <div className="text-2xl mb-1">{stat.icon}</div>
            <p className={`text-2xl sm:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r ${stat.color}`}>
              {stat.value}
            </p>
            <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mt-1">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Overall Progress */}
      {totalLessons > 0 && (
        <div className="glass-card-static p-5 animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </div>
              <div>
                <p className="text-sm font-bold">Progresso Geral</p>
                <p className="text-xs text-[var(--color-text-muted)]">{completedLessons} de {totalLessons} aulas concluídas</p>
              </div>
            </div>
            <span className="text-xl font-black text-indigo-500">{overallProgress}%</span>
          </div>
          <div className="h-2.5 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 transition-all duration-1000 ease-out"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-[var(--color-bg-secondary)] animate-pulse border border-[var(--color-border)]" />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-12 animate-fade-up">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-lg font-bold text-[var(--color-text-primary)] mb-2">{error}</p>
          <button onClick={loadData} className="px-6 py-2.5 rounded-xl btn-primary text-sm font-bold">Tentar Novamente</button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && tracks.length === 0 && (
        <div className="text-center py-16 animate-fade-up">
          <div className="text-6xl mb-4 animate-bounce-in">📚</div>
          <h2 className="text-2xl font-black text-[var(--color-text-primary)] mb-2">Nenhuma trilha disponível</h2>
          <p className="text-sm text-[var(--color-text-muted)] max-w-sm mx-auto">
            O professor ainda não criou conteúdo. Aguarde ou peça ao professor para adicionar trilhas e aulas no painel.
          </p>
        </div>
      )}

      {/* Tracks & Lessons */}
      {!loading && !error && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {tracks.map((track, i) => {
            const tTotal = track.lessons.length;
            const tCompleted = track.lessons.filter(l => l.completed).length;
            const progress = tTotal > 0 ? Math.round((tCompleted / tTotal) * 100) : 0;

            return (
              <div
                key={track.id}
                className="glass-card-static rounded-2xl overflow-hidden animate-fade-up"
                style={{ animationDelay: `${0.3 + i * 0.08}s` }}
              >
                <div className="p-5">
                  {/* Track Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-2xl shadow-inner border border-indigo-500/20">
                        {track.icon || "📘"}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">{track.title}</h3>
                        <p className="text-xs font-medium text-[var(--color-text-muted)]">{track.description}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-[var(--color-bg-secondary)] text-[10px] font-bold text-[var(--color-text-secondary)] border border-[var(--color-border)] shadow-sm">
                      {tCompleted}/{tTotal}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-[10px] font-bold mb-1.5">
                      <span className="text-[var(--color-text-secondary)] uppercase tracking-wider">Progresso</span>
                      <span className="text-indigo-500">{progress}%</span>
                    </div>
                    <div className="h-2 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden shadow-inner">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-1000 ease-out" 
                        style={{ width: `${progress}%` }} 
                      />
                    </div>
                  </div>

                  {/* Lessons List */}
                  <div className="space-y-2">
                    {track.lessons.map(lesson => (
                      <div key={lesson.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-indigo-500/30 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          {lesson.completed ? (
                            <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-[var(--color-bg-input)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                              <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-muted)]" />
                            </div>
                          )}
                          <span className={`text-sm font-semibold truncate ${lesson.completed ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"}`}>
                            {lesson.title}
                          </span>
                        </div>
                        <div className="flex gap-2 shrink-0 ml-2">
                          <button 
                            onClick={() => router.push(`/lesson/${lesson.id}`)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--color-bg-card)] border border-[var(--color-border)] hover:bg-indigo-500/5 hover:text-indigo-500 hover:border-indigo-500/30 transition-all cursor-pointer"
                          >
                            Aula
                          </button>
                          {lesson.quizId && (
                            <button 
                              onClick={() => router.push(`/quiz/${lesson.quizId}`)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${lesson.completed ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-indigo-500 text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-600"}`}
                            >
                              Quiz
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
