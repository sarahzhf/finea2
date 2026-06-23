export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { AnswerChoice } from "@/lib/quiz/types";
import { toPublicQuestion } from "@/lib/quiz/selectQuestions";
import { pickWeakestTheme, selectNextQuestion, updateThetaElo } from "@/lib/quiz/adaptive";

export async function POST(req: NextRequest, ctx: { params: { sessionId: string } }) {
  const supabase = getSupabaseServer();
  const sessionId = ctx.params.sessionId;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const selected = String(body?.selected ?? "").trim().toUpperCase();
  if (!selected || !["A","B","C","D"].includes(selected)) {
    return NextResponse.json({ error: "Invalid answer" }, { status: 400 });
  }

  const { data: session, error: sErr } = await supabase
    .from("quiz_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (sErr || !session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (session.finished) return NextResponse.json({ error: "Session already finished" }, { status: 400 });

  const position = session.current_index;

  const { data: sq, error: sqErr } = await supabase
    .from("quiz_session_questions")
    .select("question_id")
    .eq("session_id", sessionId)
    .eq("position", position)
    .single();

  if (sqErr || !sq) return NextResponse.json({ error: "Session question not found" }, { status: 500 });

  const { data: q, error: qErr } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("id", sq.question_id)
    .single();

  if (qErr || !q) return NextResponse.json({ error: "Question not found" }, { status: 500 });

  const isCorrect =
    String(selected).toUpperCase() ===
    String(q.correct_answer ?? "").trim().toUpperCase();

  // --- Adaptive update ---
  const theme = String((q as any).theme ?? "general");
  const prevThetaOverall = Number((session as any).theta_overall ?? 0);
  const prevThemeTheta = ((session as any).theme_theta ?? {}) as Record<string, number>;

  const { theta: newThetaOverall } = updateThetaElo({
    theta: prevThetaOverall,
    difficultyLevel: Number((q as any).difficulty_level ?? 3),
    correct: isCorrect,
  });

  const { theta: newThetaTheme } = updateThetaElo({
    theta: Number(prevThemeTheta[theme] ?? 0),
    difficultyLevel: Number((q as any).difficulty_level ?? 3),
    correct: isCorrect,
  });

  const newThemeTheta = { ...prevThemeTheta, [theme]: newThetaTheme };

  // record answer
  const { error: aErr } = await supabase.from("quiz_answers").insert({
    session_id: sessionId,
    question_id: q.id,
    position,
    selected_answer: selected,
    is_correct: isCorrect,
  });
  if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });

  const nextIndex = position + 1;
  const nextScore = session.score + (isCorrect ? 1 : 0);
  const finished = nextIndex >= session.total_questions;

  const { error: uErr } = await supabase
    .from("quiz_sessions")
    .update({
      current_index: finished ? position : nextIndex,
      score: nextScore,
      finished,
      finished_at: finished ? new Date().toISOString() : null,
      theta_overall: newThetaOverall,
      theme_theta: newThemeTheta,
    })
    .eq("id", sessionId);

  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

  const progress = {
    sessionId,
    currentIndex: finished ? position : nextIndex,
    totalQuestions: session.total_questions,
    score: nextScore,
    finished,
  };

  if (finished) {
    return NextResponse.json({ progress, results: { score: nextScore, total: session.total_questions } });
  }

  // Fetch or create next question (adaptive selector)
  const { data: sq2, error: sq2Err } = await supabase
    .from("quiz_session_questions")
    .select("question_id")
    .eq("session_id", sessionId)
    .eq("position", nextIndex)
    .maybeSingle();

  let q2: any = null;

  if (!sq2Err && sq2?.question_id) {
    const { data: fetched, error: q2Err } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("id", sq2.question_id)
      .single();
    if (q2Err || !fetched) return NextResponse.json({ error: "Next question not found" }, { status: 500 });
    q2 = fetched;
  } else {
    // Build asked set
    const { data: askedRows, error: askedErr } = await supabase
      .from("quiz_session_questions")
      .select("question_id")
      .eq("session_id", sessionId);

    if (askedErr) return NextResponse.json({ error: askedErr.message }, { status: 500 });
    const askedIds = new Set((askedRows ?? []).map((r) => r.question_id));

    // Candidate pool
    let poolQ = supabase.from("quiz_questions").select("*").eq("active", true);
    if (session.theme_filter) poolQ = poolQ.ilike("theme", session.theme_filter);

    const { data: pool, error: poolErr } = await poolQ.limit(500);
    if (poolErr) return NextResponse.json({ error: poolErr.message }, { status: 500 });

    const preferredTheme = pickWeakestTheme(newThemeTheta) ?? session.theme_filter ?? null;

    const next = selectNextQuestion({
      candidates: pool ?? [],
      askedIds,
      thetaOverall: newThetaOverall,
      themeTheta: newThemeTheta,
      preferredTheme,
      epsilon: 0.2,
    });

    if (!next) {
      return NextResponse.json({ progress: { ...progress, finished: true }, results: { score: nextScore, total: session.total_questions } });
    }

    const { error: insErr } = await supabase.from("quiz_session_questions").insert({
      session_id: sessionId,
      question_id: next.id,
      position: nextIndex,
    });
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
    q2 = next;
  }

  try {
    return NextResponse.json({ progress, nextQuestion: toPublicQuestion(q2) });
  } catch (e: any) {
    console.error("FINAL SERIALIZATION ERROR", e);
    return NextResponse.json(
      { error: "Failed to serialize next question" },
      { status: 500 }
    );
  }
}
