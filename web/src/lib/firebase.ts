import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  where,
  Timestamp,
} from "firebase/firestore";

// ── Config ──
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

// ════════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════════
export async function registerUser(name: string, email: string, password: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  await setDoc(doc(db, "users", cred.user.uid), {
    name,
    email,
    role: "STUDENT",
    xp: 0,
    level: 1,
    streak: 0,
    bestStreak: 0,
    quizzesCompleted: 0,
    lessonsCompleted: 0,
    totalStudyMinutes: 0,
    lastActiveDate: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
  return cred.user;
}

export async function loginUser(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  // Update streak on login
  try { await updateStreak(cred.user.uid); } catch {}
  return cred.user;
}

export async function logoutUser() { await signOut(auth); }

export function onAuthChange(cb: (user: User | null) => void) {
  return onAuthStateChanged(auth, cb);
}

// ════════════════════════════════════════════════════════════════
// USER PROFILE
// ════════════════════════════════════════════════════════════════
export async function getUserProfile(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

export async function updateUserProfile(uid: string, data: Record<string, unknown>) {
  await updateDoc(doc(db, "users", uid), data);
}

// ════════════════════════════════════════════════════════════════
// STREAK SYSTEM
// ════════════════════════════════════════════════════════════════
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

  if (lastDate === today) return; // Already active today

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const newStreak = lastDate === yesterdayStr ? (Number(profile.streak) || 0) + 1 : 1;
  const bestStreak = Math.max(newStreak, Number(profile.bestStreak) || 0);

  await updateDoc(doc(db, "users", uid), {
    streak: newStreak,
    bestStreak,
    lastActiveDate: serverTimestamp(),
  });
}

// ════════════════════════════════════════════════════════════════
// QUIZ RESULTS
// ════════════════════════════════════════════════════════════════
export async function saveQuizResult(uid: string, quizId: string, score: number, total: number, xpEarned: number) {
  const resultId = `${quizId}_${Date.now()}`;
  await setDoc(doc(db, "users", uid, "quizResults", resultId), {
    quizId,
    score,
    total,
    percentage: Math.round((score / total) * 100),
    xpEarned,
    completedAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "users", uid), {
    xp: increment(xpEarned),
    quizzesCompleted: increment(1),
    lastActiveDate: serverTimestamp(),
  });
}

export async function getQuizHistory(uid: string) {
  const q = query(
    collection(db, "users", uid, "quizResults"),
    orderBy("completedAt", "desc"),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ════════════════════════════════════════════════════════════════
// STUDENT NOTES
// ════════════════════════════════════════════════════════════════
export async function saveNote(uid: string, lessonId: string, content: string) {
  await setDoc(doc(db, "users", uid, "notes", lessonId), {
    content,
    lessonId,
    updatedAt: serverTimestamp(),
  });
}

export async function getNote(uid: string, lessonId: string) {
  const snap = await getDoc(doc(db, "users", uid, "notes", lessonId));
  return snap.exists() ? snap.data() : null;
}

export async function getAllNotes(uid: string) {
  const snap = await getDocs(collection(db, "users", uid, "notes"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function deleteNote(uid: string, lessonId: string) {
  await deleteDoc(doc(db, "users", uid, "notes", lessonId));
}

// ════════════════════════════════════════════════════════════════
// INFRACTIONS
// ════════════════════════════════════════════════════════════════
export async function saveInfraction(uid: string, type: string, description: string, quizId?: string) {
  const infractionId = `${type}_${Date.now()}`;
  await setDoc(doc(db, "users", uid, "infractions", infractionId), {
    type,
    description,
    quizId: quizId || null,
    automatic: true,
    createdAt: serverTimestamp(),
  });
}

// ════════════════════════════════════════════════════════════════
// LEADERBOARD
// ════════════════════════════════════════════════════════════════
export async function getLeaderboard(limitCount: number = 10) {
  const q = query(
    collection(db, "users"),
    orderBy("xp", "desc"),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d, i) => ({
    uid: d.id,
    name: d.data().name || "Anônimo",
    xp: d.data().xp || 0,
    level: Math.floor((d.data().xp || 0) / 500) + 1,
    pos: i + 1,
  }));
}

// ════════════════════════════════════════════════════════════════
// STUDY TIME TRACKING
// ════════════════════════════════════════════════════════════════
export async function addStudyTime(uid: string, minutes: number) {
  await updateDoc(doc(db, "users", uid), {
    totalStudyMinutes: increment(minutes),
    lastActiveDate: serverTimestamp(),
  });
}
