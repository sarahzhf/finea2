export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { toPublicQuestion } from "@/lib/quiz/selectQuestions";

export async function GET(_req: NextRequest, ctx: { params: { sessionId: string } }) {
  const supabase = getSupabaseServer();
  const sessionId = ctx.params.sessionId;

  const { data: session, error: sErr } = await supabase
    .from("quiz_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (sErr || !session) {
    return NextResponse.json({ error: sErr?.message ?? "Session not found" }, { status: 404 });
  }

  if (session.finished) {
    return NextResponse.json({
      progress: {
        sessionId: session.id,
        currentIndex: session.current_index,
        totalQuestions: session.total_questions,
        score: session.score,
        finished: true,
      },
      question: null,
    });
  }

  // Get current question id from session_questions
  const { data: sq, error: sqErr } = await supabase
    .from("quiz_session_questions")
    .select("question_id")
    .eq("session_id", sessionId)
    .eq("position", session.current_index)
    .single();

  if (sqErr || !sq) {
    return NextResponse.json({ error: sqErr?.message ?? "Session questions missing" }, { status: 500 });
  }

  const { data: q, error: qErr } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("id", sq.question_id)
    .single();

  if (qErr || !q) {
    return NextResponse.json({ error: qErr?.message ?? "Question not found" }, { status: 500 });
  }

  return NextResponse.json({
    progress: {
      sessionId: session.id,
      currentIndex: session.current_index,
      totalQuestions: session.total_questions,
      score: session.score,
      finished: false,
    },
    question: toPublicQuestion(q),
  });
}
