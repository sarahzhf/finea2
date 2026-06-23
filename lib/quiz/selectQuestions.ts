import type { AnswerChoice, QuizQuestionPublic } from "./types";

export function toPublicQuestion(row: any): QuizQuestionPublic {
  const answers = {
    A: row.answer_a,
    B: row.answer_b,
    C: row.answer_c,
    D: row.answer_d,
  } satisfies Record<AnswerChoice, string>;

  return {
    id: row.id,
    theme: row.theme,
    difficulty_level: row.difficulty_level,
    question_text: row.question_text,
    explanation: row.explanation ?? null,
    tags: Array.isArray(row.tags) ? row.tags : [],
    answers,
  };
}
