export type AnswerChoice = "A" | "B" | "C" | "D";

export type QuizQuestionPublic = {
  id: string;
  theme: string;
  difficulty_level: number;
  question_text: string;
  explanation?: string | null;
  tags: string[];
  answers: Record<AnswerChoice, string>;
};

export type QuizProgress = {
  sessionId: string;
  currentIndex: number;
  totalQuestions: number;
  score: number;
  finished: boolean;
};

export type QuizQuestionResponse = {
  progress: QuizProgress;
  question: QuizQuestionPublic | null;
};

export type QuizAnswerRequest = {
  selected: AnswerChoice;
};

export type QuizAnswerResponse =
  | { progress: QuizProgress; nextQuestion: QuizQuestionPublic }
  | { progress: QuizProgress; results: { score: number; total: number } };

// Supabase DB row type
export type QuizQuestionRow = {
  id: string;
  theme: string;
  difficulty_level: number;
  question_text: string;
  answer_a: string;
  answer_b: string;
  answer_c: string;
  answer_d: string;
  correct_answer: AnswerChoice;
  explanation?: string | null;
  tags?: string[];
  active?: boolean;
};
