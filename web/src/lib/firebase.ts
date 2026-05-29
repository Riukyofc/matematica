import { initializeApp, getApps } from "firebase/app";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile, type User,
} from "firebase/auth";
import {
  getFirestore, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
  collection, query, orderBy, limit, serverTimestamp, increment, addDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCQpavsnI_RGer13JrkcMfBCXp6FFjI6bg",
  authDomain: "matematica-1f25e.firebaseapp.com",
  projectId: "matematica-1f25e",
  storageBucket: "matematica-1f25e.firebasestorage.app",
  messagingSenderId: "605749634000",
  appId: "1:605749634000:web:07a44ab51ff70623470fd5",
  measurementId: "G-NQ7P661J1R",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);

// ════════════════════ AUTH ════════════════════
export async function registerUser(name: string, email: string, password: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  await setDoc(doc(db, "users", cred.user.uid), {
    name, email, role: "STUDENT",
    xp: 0, level: 1, streak: 0, bestStreak: 0,
    quizzesCompleted: 0, perfectQuizzes: 0, lessonsCompleted: 0,
    totalStudyMinutes: 0, lastActiveDate: serverTimestamp(), createdAt: serverTimestamp(),
  });
  return cred.user;
}

export async function loginUser(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  try { await updateStreak(cred.user.uid); } catch {}
  return cred.user;
}

export async function logoutUser() { await signOut(auth); }
export function onAuthChange(cb: (user: User | null) => void) { return onAuthStateChanged(auth, cb); }

// ════════════════════ USER PROFILE ════════════════════
export async function getUserProfile(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

export async function updateUserProfile(uid: string, data: Record<string, unknown>) {
  await updateDoc(doc(db, "users", uid), data);
}

// ════════════════════ STREAK ════════════════════
export async function updateStreak(uid: string) {
  const profile = await getUserProfile(uid);
  if (!profile) return;
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const lastActive = profile.lastActiveDate;
  let lastDate = "";
  if (lastActive && typeof lastActive === "object" && "seconds" in lastActive) {
    lastDate = new Date((lastActive as { seconds: number }).seconds * 1000).toISOString().split("T")[0];
  }
  if (lastDate === today) return;
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  const newStreak = lastDate === yesterday.toISOString().split("T")[0] ? (Number(profile.streak) || 0) + 1 : 1;
  await updateDoc(doc(db, "users", uid), {
    streak: newStreak,
    bestStreak: Math.max(newStreak, Number(profile.bestStreak) || 0),
    lastActiveDate: serverTimestamp(),
  });
}

// ════════════════════ QUIZ RESULTS ════════════════════
export async function saveQuizResult(uid: string, quizId: string, score: number, total: number, xpEarned: number) {
  await addDoc(collection(db, "users", uid, "quizResults"), {
    quizId, score, total, percentage: Math.round((score / total) * 100),
    xpEarned, completedAt: serverTimestamp(),
  });
  const updates: Record<string, unknown> = {
    xp: increment(xpEarned),
    quizzesCompleted: increment(1),
    lastActiveDate: serverTimestamp(),
  };
  if (score === total) updates.perfectQuizzes = increment(1);
  await updateDoc(doc(db, "users", uid), updates);
}

export async function getQuizHistory(uid: string) {
  const q = query(collection(db, "users", uid, "quizResults"), orderBy("completedAt", "desc"), limit(20));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ════════════════════ ACHIEVEMENTS ════════════════════
// Achievements are computed from user data, not stored as hardcoded booleans
export interface Achievement {
  id: string; icon: string; title: string; desc: string;
  check: (profile: Record<string, unknown>) => boolean;
}

export const ACHIEVEMENT_DEFS: Achievement[] = [
  { id: "a1", icon: "🏆", title: "Primeiro Passo", desc: "Complete seu primeiro quiz", check: p => (Number(p.quizzesCompleted) || 0) >= 1 },
  { id: "a2", icon: "🔥", title: "Em Chamas", desc: "Sequência de 3 dias", check: p => (Number(p.streak) || 0) >= 3 },
  { id: "a3", icon: "⚡", title: "Veloz", desc: "Complete 5 quizzes", check: p => (Number(p.quizzesCompleted) || 0) >= 5 },
  { id: "a4", icon: "🎯", title: "Perfeição", desc: "100% em um quiz", check: p => (Number(p.perfectQuizzes) || 0) >= 1 },
  { id: "a5", icon: "💎", title: "Dedicado", desc: "Acumule 1000 XP", check: p => (Number(p.xp) || 0) >= 1000 },
  { id: "a6", icon: "👑", title: "Mestre", desc: "Acumule 5000 XP", check: p => (Number(p.xp) || 0) >= 5000 },
  { id: "a7", icon: "📝", title: "Anotador", desc: "Salve 3 anotações", check: () => false },
  { id: "a8", icon: "🔟", title: "Dez em Dez", desc: "Complete 10 quizzes", check: p => (Number(p.quizzesCompleted) || 0) >= 10 },
];

// ════════════════════ NOTES ════════════════════
export async function saveNote(uid: string, lessonId: string, content: string) {
  await setDoc(doc(db, "users", uid, "notes", lessonId), { content, lessonId, updatedAt: serverTimestamp() });
}
export async function getNote(uid: string, lessonId: string) {
  const snap = await getDoc(doc(db, "users", uid, "notes", lessonId));
  return snap.exists() ? snap.data() : null;
}
export async function getAllNotes(uid: string) {
  const snap = await getDocs(collection(db, "users", uid, "notes"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function deleteNote(uid: string, lessonId: string) {
  await deleteDoc(doc(db, "users", uid, "notes", lessonId));
}

// ════════════════════ INFRACTIONS ════════════════════
export async function saveInfraction(uid: string, type: string, description: string) {
  await addDoc(collection(db, "users", uid, "infractions"), {
    type, description, automatic: true, createdAt: serverTimestamp(),
  });
}

// ════════════════════ LEADERBOARD ════════════════════
export async function getLeaderboard(limitCount: number = 10) {
  const q = query(collection(db, "users"), orderBy("xp", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map((d, i) => ({
    uid: d.id, name: d.data().name || "Anônimo",
    xp: d.data().xp || 0, level: Math.floor((d.data().xp || 0) / 500) + 1, pos: i + 1,
  }));
}

// ════════════════════ TEACHER: PLATFORM SETTINGS ════════════════════
export async function getSettings() {
  const snap = await getDoc(doc(db, "settings", "platform"));
  return snap.exists() ? snap.data() : null;
}
export async function saveSettings(data: Record<string, unknown>) {
  await setDoc(doc(db, "settings", "platform"), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

// ════════════════════ TEACHER: CUSTOM FORMULAS ════════════════════
export async function getCustomFormulas() {
  const snap = await getDocs(collection(db, "formulas"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function saveCustomFormula(data: { category: string; name: string; formula: string }) {
  await addDoc(collection(db, "formulas"), { ...data, createdAt: serverTimestamp() });
}
export async function deleteCustomFormula(id: string) {
  await deleteDoc(doc(db, "formulas", id));
}

// ════════════════════ TEACHER: CUSTOM LESSONS ════════════════════
export async function getCustomLessons() {
  const snap = await getDocs(collection(db, "lessons"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function saveCustomLesson(data: Record<string, unknown>) {
  await addDoc(collection(db, "lessons"), { ...data, createdAt: serverTimestamp() });
}
export async function deleteCustomLesson(id: string) {
  await deleteDoc(doc(db, "lessons", id));
}

// ════════════════════ STUDY TIME ════════════════════
export async function addStudyTime(uid: string, minutes: number) {
  await updateDoc(doc(db, "users", uid), { totalStudyMinutes: increment(minutes), lastActiveDate: serverTimestamp() });
}
