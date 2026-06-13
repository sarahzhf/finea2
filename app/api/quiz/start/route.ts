export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db  = getFirestore(app);

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const count  = Math.min(Math.max(Number(searchParams.get("count") ?? "10"), 1), 25);
    const tags   = searchParams.get("tags")?.split(",").filter(Boolean) ?? [];

    // Chercher dans quiz_questions (ou questions selon la collection Firebase)
    let questions: any[] = [];

    // Essaie plusieurs noms de collection possibles
    for (const colName of ["quiz_questions", "questions", "quiz"]) {
      try {
        const snap = await getDocs(collection(db, colName));
        if (!snap.empty) {
          questions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          break;
        }
      } catch { /* continue */ }
    }

    if (questions.length === 0) {
      return NextResponse.json({ error: "Aucune question trouvée dans Firebase" }, { status: 404 });
    }

    // Filtrer par tags si fournis
    let filtered = questions;
    if (tags.length > 0) {
      filtered = questions.filter(q => {
        const qTags: string[] = [
          ...(Array.isArray(q.tags) ? q.tags : []),
          q.theme, q.category, q.tag,
        ].filter((x): x is string => typeof x === "string" && x.length > 0)
        if (qTags.length === 0) return true // pas de tag → on inclut
        return tags.some(t => qTags.some(qt => qt.toLowerCase().includes(t.toLowerCase())))
      })
      if (filtered.length < 3) filtered = questions
    }

    const selected = shuffle(filtered).slice(0, count);
    const sessionId = `local_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    return NextResponse.json({
      progress: {
        sessionId,
        currentIndex: 0,
        totalQuestions: selected.length,
        score: 0,
        finished: false,
      },
      question: formatQuestion(selected[0]),
      allQuestions: selected.map(formatQuestion), // on envoie tout pour le client
    });

  } catch (e: any) {
    console.error("QUIZ START ERROR", e?.message);
    return NextResponse.json({ error: e?.message ?? "Erreur serveur" }, { status: 500 });
  }
}

function formatQuestion(q: any) {
  return {
    id:          q.id,
    text:        q.question ?? q.text ?? q.question_text ?? "?",
    options:     q.options ?? q.choices ?? q.answers ?? [],
    correctIndex: q.correctIndex ?? q.correct_index ?? q.answer_index ?? 0,
    explanation: q.explanation ?? q.explication ?? "",
    theme:       q.theme ?? q.category ?? q.tags?.[0] ?? "Finance",
    difficulty:  q.difficulty ?? q.difficulte ?? 2,
  };
}
