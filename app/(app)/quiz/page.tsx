"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { GOLD } from "@/lib/theme"

const TAG_OPTIONS = [
  { id: "budget", label: "Budget" },
  { id: "depenses", label: "Dépenses" },
  { id: "revenus", label: "Revenus" },
  { id: "epargne", label: "Épargne" },
  { id: "precaution", label: "Épargne de précaution" },
  { id: "credit", label: "Crédit" },
  { id: "investissement", label: "Investissement" },
]

export default function QuizIndexPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  async function start() {
    setLoading(true)
    setError(null)
    try {
      const qs = new URLSearchParams()
      qs.set("count", "10")
      if (selectedTags.length > 0) qs.set("tags", selectedTags.join(","))
      const origin = typeof window !== "undefined" ? window.location.origin : ""
      const res = await fetch(`${origin}/api/quiz/start?${qs.toString()}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let data: any = null
      try { data = await res.json() } catch { throw new Error("API did not return valid JSON") }
      if (!res.ok) throw new Error(data?.error ?? "Failed to start quiz")
      const sessionId = data?.progress?.sessionId
      if (!sessionId || typeof sessionId !== "string") throw new Error("Session ID invalide")
      // Stocker les questions en sessionStorage pour la page de session
      if (data.allQuestions) {
        sessionStorage.setItem("quiz_questions", JSON.stringify(data.allQuestions))
      }
      router.push(`/quiz/${encodeURIComponent(sessionId)}`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#050A14] text-slate-50">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-3 border-b border-white/[0.06] shrink-0">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.back()}
          className="w-9 h-9 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0"
          style={{ color: GOLD }}>
          <ArrowLeft size={17} />
        </motion.button>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Espace Savoirs</p>
          <h1 className="text-base font-bold text-white">🧠 Quiz Finance</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-5 flex flex-col gap-4 pb-6">

        {/* Intro card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-4 space-y-2"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
              style={{ background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.25)" }}>
              🧠
            </div>
            <div>
              <p className="text-sm font-bold text-white">Quiz adaptatif</p>
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.42)" }}>
                10 questions · Niveau ajusté à ton score
              </p>
            </div>
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.52)" }}>
            Teste tes connaissances en finance personnelle. Le quiz s'adapte à ton niveau au fil des réponses — plus tu sais, plus c'est exigeant.
          </p>
        </motion.div>

        {/* Tag filters */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
          className="rounded-2xl p-4"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-xs font-semibold text-white mb-3">Filtrer par thème <span style={{ color: "rgba(255,255,255,0.35)" }}>(optionnel)</span></p>
          <div className="grid grid-cols-2 gap-2">
            {TAG_OPTIONS.map(tag => (
              <motion.button key={tag.id} whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedTags(prev =>
                  prev.includes(tag.id) ? prev.filter(t => t !== tag.id) : [...prev, tag.id]
                )}
                className="py-2 px-3 rounded-xl text-xs font-medium transition-all text-left"
                style={{
                  background: selectedTags.includes(tag.id) ? `${GOLD}18` : "rgba(255,255,255,0.04)",
                  border: `1px solid ${selectedTags.includes(tag.id) ? GOLD + "50" : "rgba(255,255,255,0.08)"}`,
                  color: selectedTags.includes(tag.id) ? GOLD : "rgba(255,255,255,0.6)",
                }}>
                {selectedTags.includes(tag.id) && <span className="mr-1">✓</span>}
                {tag.label}
              </motion.button>
            ))}
          </div>
          {selectedTags.length > 0 && (
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              onClick={() => setSelectedTags([])}
              className="mt-2 text-[10px] underline"
              style={{ color: "rgba(255,255,255,0.35)" }}>
              Effacer les filtres
            </motion.button>
          )}
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-2xl px-4 py-3 text-xs text-rose-300"
            style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)" }}>
            ⚠️ {error}
          </motion.div>
        )}

        {/* Start button */}
        <motion.button
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          whileTap={{ scale: 0.97 }}
          onClick={start}
          disabled={loading}
          className="w-full rounded-2xl py-4 font-black text-sm transition disabled:opacity-60"
          style={{
            background: `linear-gradient(135deg, ${GOLD}, #b8973a)`,
            color: "#050A14",
            boxShadow: `0 8px 28px rgba(236,204,104,0.28)`,
          }}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
              Démarrage...
            </span>
          ) : "🚀 Démarrer une session (10 questions)"}
        </motion.button>

        <p className="text-[10px] text-center" style={{ color: "rgba(255,255,255,0.25)" }}>
          Questions sélectionnées parmi notre base Supabase · Mode adaptatif actif
        </p>
      </div>
    </div>
  )
}
