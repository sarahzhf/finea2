"use client"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Mic, Sparkles } from "lucide-react"
import Image from "next/image"
import FineaAnimated from "@/components/finea-animated"
import { GOLD, GOLD_DIM, BG_CARD, BORDER } from "@/lib/theme"
import { useAuth } from "@/components/AuthProvider"

type Msg = { role: "assistant" | "user"; text: string; id: number }

const INITIAL: Msg[] = [
  {
    id: 1,
    role: "assistant",
    text: "Bonjour ! Je suis Finéa, ta coach financière IA. 💛\n\nJ'ai accès à toutes tes données financières importées. Pose-moi n'importe quelle question sur ton budget, tes dépenses ou ton épargne !",
  },
]

const SUGGESTIONS = [
  "Mes dépenses inutiles ?",
  "Conseils épargne",
  "Analyse mon budget",
  "Comment économiser ?",
]

let nextId = 10

export default function CoachPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Msg[]>(INITIAL)
  const [input, setInput]       = useState("")
  const [typing, setTyping]     = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, typing])

  async function send(text?: string) {
    const msg = text ?? input.trim()
    if (!msg || typing) return
    setInput("")
    setError(null)

    const userMsg: Msg = { id: nextId++, role: "user", text: msg }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setTyping(true)

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, text: m.text })),
          userId: user?.uid ?? "",
        }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        throw new Error(data.error || "Erreur serveur")
      }

      setMessages(m => [...m, { id: nextId++, role: "assistant", text: data.text }])
    } catch (err: any) {
      setError("Impossible de contacter Finéa. Vérifie ta connexion.")
      // Fallback sympa
      setMessages(m => [...m, {
        id: nextId++,
        role: "assistant",
        text: "Désolée, je rencontre un problème technique. Réessaie dans un instant ! 🙏",
      }])
    } finally {
      setTyping(false)
    }
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#050A14] text-slate-50">
      {/* Header */}
      <div className="px-4 pt-8 pb-3 shrink-0">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3">
          <div className="relative">
            <FineaAnimated size={44} />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#050A14]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-base font-bold text-white">Finéa Coach</p>
              <Sparkles size={13} color={GOLD} />
            </div>
<<<<<<< HEAD
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.38)" }}>Coach IA · Données personnalisées</p>
=======
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.38)" }}>Coach IA · Gemini · Données personnalisées</p>
>>>>>>> c2ce98782d34bda170bcf3571c6142480a36998b
          </div>
        </motion.div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-2 flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {messages.map(m => (
            <motion.div key={m.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              {m.role === "assistant" && (
                <div className="shrink-0 mt-0.5">
                  <Image src="/icons/fineasmile.png" alt="Finéa" width={28} height={28} />
                </div>
              )}
              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-line
                  ${m.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                style={m.role === "user"
                  ? { background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DIM})`, color: "#050A14", fontWeight: 600 }
                  : { background: BG_CARD, border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.85)" }
                }
              >
                {m.text}
              </div>
            </motion.div>
          ))}

          {typing && (
            <motion.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex gap-2.5">
              <FineaAnimated size={28} talking />
              <div className="rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center"
                style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>
                {[0, 1, 2].map(i => (
                  <motion.span key={i} className="w-1.5 h-1.5 rounded-full"
                    style={{ background: GOLD }}
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Suggestions — uniquement au début */}
      {messages.length <= 2 && !typing && (
        <div className="px-4 pb-2 shrink-0">
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {SUGGESTIONS.map(s => (
              <motion.button key={s} whileTap={{ scale: 0.93 }}
                onClick={() => send(s)}
                className="shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap"
                style={{ background: `${GOLD}12`, color: GOLD, border: `1px solid ${GOLD}30` }}>
                {s}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="mx-4 mb-2 px-3 py-2 rounded-xl text-[10px] text-red-300"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          {error}
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 shrink-0">
        <div className="flex gap-2 items-center rounded-2xl px-3 py-2"
          style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>
          <Mic size={17} color="rgba(255,255,255,0.25)" className="shrink-0" />
          <input
            className="flex-1 bg-transparent text-xs text-white placeholder:text-white/30 outline-none"
            placeholder="Pose ta question financière..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
          />
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => send()}
            disabled={!input.trim() || typing}
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-40 transition"
            style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DIM})`, color: "#050A14" }}>
            <Send size={14} />
          </motion.button>
        </div>
      </div>
    </div>
  )
}
