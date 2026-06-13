"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { GOLD, GREEN, RED } from "@/lib/theme";

interface Question {
  id: any;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  theme: string;
  difficulty: number;
}

const LABELS = ["A", "B", "C", "D"];

export default function QuizSessionPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent]     = useState(0);
  const [selected, setSelected]   = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [score, setScore]         = useState(0);
  const [finished, setFinished]   = useState(false);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    // Les questions ont été stockées en sessionStorage par la page d'index
    const raw = sessionStorage.getItem("quiz_questions");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setQuestions(parsed);
        setLoading(false);
        return;
      } catch {}
    }
    // Fallback : recharger depuis l'API
    fetch(`/api/quiz/start?count=10`)
      .then(r => r.json())
      .then(d => {
        if (d.allQuestions) {
          setQuestions(d.allQuestions);
        } else {
          setError("Impossible de charger les questions.");
        }
      })
      .catch(() => setError("Erreur réseau."))
      .finally(() => setLoading(false));
  }, []);

  function confirm() {
    if (selected === null) return;
    setConfirmed(true);
    if (selected === questions[current].correctIndex) {
      setScore(s => s + 1);
    }
  }

  function next() {
    if (current + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
      setConfirmed(false);
    }
  }

  // ── Loading ──
  if (loading) return (
    <div className="w-full h-full flex items-center justify-center bg-[#050A14]">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
        className="w-8 h-8 rounded-full border-2 border-t-transparent" style={{ borderColor: `${GOLD} transparent transparent transparent` }} />
    </div>
  );

  // ── Erreur ──
  if (error) return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#050A14] px-6 gap-4">
      <p className="text-4xl">⚠️</p>
      <p className="text-red-300 text-sm text-center">{error}</p>
      <motion.button whileTap={{ scale: 0.96 }} onClick={() => router.push("/quiz")}
        className="px-6 py-3 rounded-2xl text-sm font-bold"
        style={{ background: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}40` }}>
        Retour au quiz
      </motion.button>
    </div>
  );

  // ── Résultats ──
  if (finished || questions.length === 0) {
    const total = questions.length;
    const pct   = total > 0 ? Math.round((score / total) * 100) : 0;
    const emoji = pct >= 80 ? "🏆" : pct >= 60 ? "👍" : pct >= 40 ? "🤔" : "😬";
    const scoreColor = pct >= 70 ? GREEN : pct >= 45 ? "#fbbf24" : RED;

    return (
      <div className="w-full h-full flex flex-col bg-[#050A14] text-white">
        <div className="flex items-center gap-3 px-4 pt-5 pb-3 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.push("/quiz")}
            className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: GOLD }}>
            <ArrowLeft size={17} />
          </motion.button>
          <h1 className="text-base font-bold">Résultats</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col items-center gap-5">
          <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 240, damping: 20 }}
            className="text-7xl">{emoji}</motion.div>

          <div className="rounded-3xl p-5 w-full text-center"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.38)" }}>Score final</p>
            <p className="text-5xl font-black" style={{ color: scoreColor }}>
              {score}<span className="text-xl" style={{ color: "rgba(255,255,255,0.3)" }}>/{total}</span>
            </p>
            <p className="text-sm mt-1 font-semibold" style={{ color: scoreColor }}>{pct}%</p>
            <div className="mt-4 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                className="h-full rounded-full" style={{ background: scoreColor }} />
            </div>
          </div>

          <div className="rounded-2xl px-4 py-3 w-full flex gap-3 items-start"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <span className="text-xl shrink-0">💛</span>
            <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
              {pct >= 80 ? "Excellent ! Tu maîtrises bien les bases de la finance personnelle. Continue comme ça !"
               : pct >= 60 ? "Bon score ! Quelques thèmes méritent encore un peu de révision."
               : pct >= 40 ? "C'est un début. Consulte les Conseils pour renforcer tes connaissances."
               : "Le quiz a identifié les domaines à travailler. Direction la section Conseils !"}
            </p>
          </div>

          <div className="flex gap-3 w-full">
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => router.push("/quiz")}
              className="flex-1 py-3.5 rounded-2xl text-sm font-semibold"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}>
              Rejouer
            </motion.button>
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => router.push("/conseils")}
              className="flex-1 py-3.5 rounded-2xl text-sm font-black"
              style={{ background: `linear-gradient(135deg, ${GOLD}, #b8973a)`, color: "#050A14" }}>
              Voir les conseils
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // ── Question ──
  const q = questions[current];
  const progressPct = (current / questions.length) * 100;
  const isCorrect = selected === q.correctIndex;

  return (
    <div className="w-full h-full flex flex-col bg-[#050A14] text-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-2 shrink-0">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.push("/quiz")}
          className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: GOLD }}>
          <ArrowLeft size={17} />
        </motion.button>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <p className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.38)" }}>
              Question {current + 1} / {questions.length}
            </p>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: `${GOLD}15`, border: `1px solid ${GOLD}35` }}>
              <span className="text-[9px] font-bold" style={{ color: GOLD }}>Score</span>
              <span className="text-[11px] font-black" style={{ color: GOLD }}>{score}</span>
            </div>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <motion.div animate={{ width: `${progressPct}%` }} transition={{ duration: 0.4 }}
              className="h-full rounded-full" style={{ background: GOLD }} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-6">
        <AnimatePresence mode="wait">
          <motion.div key={q.id}
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22 }}
            className="flex flex-col gap-3">

            {/* Badge thème */}
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold capitalize"
                style={{ background: "rgba(96,165,250,0.12)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.2)" }}>
                {q.theme}
              </span>
              <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                {"●".repeat(Math.min(q.difficulty, 5))}{"○".repeat(Math.max(0, 5 - q.difficulty))}
              </span>
            </div>

            {/* Question */}
            <div className="rounded-2xl p-4"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-sm font-semibold leading-snug">{q.text}</p>
            </div>

            {/* Options */}
            <div className="flex flex-col gap-2">
              {q.options.map((opt, i) => {
                let bg   = "rgba(255,255,255,0.04)"
                let border = "rgba(255,255,255,0.08)"
                let color  = "rgba(255,255,255,0.72)"

                if (confirmed) {
                  if (i === q.correctIndex) { bg = `${GREEN}18`; border = GREEN; color = GREEN }
                  else if (i === selected)  { bg = `${RED}18`;   border = RED;   color = RED }
                } else if (selected === i) {
                  bg = `${GOLD}12`; border = GOLD + "55"; color = GOLD
                }

                return (
                  <motion.button key={i} whileTap={{ scale: confirmed ? 1 : 0.98 }}
                    onClick={() => !confirmed && setSelected(i)}
                    className="w-full text-left rounded-2xl px-4 py-3 transition-all"
                    style={{ background: bg, border: `1px solid ${border}`, color }}>
                    <div className="flex items-start gap-3">
                      <span className="text-[10px] font-black shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{
                          background: selected === i && !confirmed ? GOLD : confirmed && i === q.correctIndex ? GREEN : confirmed && i === selected ? RED : "rgba(255,255,255,0.08)",
                          color: (selected === i && !confirmed) || (confirmed && (i === q.correctIndex || i === selected)) ? "#050A14" : "rgba(255,255,255,0.4)",
                        }}>
                        {LABELS[i]}
                      </span>
                      <span className="text-xs leading-snug flex-1">{opt}</span>
                      {confirmed && i === q.correctIndex && <CheckCircle size={16} color={GREEN} className="shrink-0 mt-0.5" />}
                      {confirmed && i === selected && i !== q.correctIndex && <XCircle size={16} color={RED} className="shrink-0 mt-0.5" />}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Explication après confirmation */}
            <AnimatePresence>
              {confirmed && q.explanation && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl px-4 py-3 text-[11px] leading-relaxed"
                  style={{ background: `${GOLD}0D`, border: `1px solid ${GOLD}25`, color: `${GOLD}CC` }}>
                  💡 {q.explanation}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bouton confirmer / suivant */}
            {!confirmed ? (
              <motion.button whileTap={{ scale: 0.97 }} onClick={confirm}
                disabled={selected === null}
                className="w-full py-4 rounded-2xl font-black text-sm mt-1 disabled:opacity-40 transition"
                style={{
                  background: selected !== null ? `linear-gradient(135deg, ${GOLD}, #b8973a)` : "rgba(255,255,255,0.06)",
                  color: selected !== null ? "#050A14" : "rgba(255,255,255,0.3)",
                  border: selected !== null ? "none" : "1px solid rgba(255,255,255,0.08)",
                }}>
                {selected !== null ? "Valider ma réponse →" : "Sélectionne une réponse"}
              </motion.button>
            ) : (
              <motion.button initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.97 }} onClick={next}
                className="w-full py-4 rounded-2xl font-black text-sm"
                style={{ background: `linear-gradient(135deg, ${GOLD}, #b8973a)`, color: "#050A14" }}>
                {current + 1 >= questions.length ? "Voir mes résultats 🏆" : "Question suivante →"}
              </motion.button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
