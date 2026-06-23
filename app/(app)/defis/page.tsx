"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Loader2, Trophy, Sparkles, Lock, Check } from "lucide-react"
import { GOLD, GOLD_DIM, BG_CARD, BORDER, GREEN } from "@/lib/theme"
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { useAuth } from "@/components/AuthProvider"
import { fetchUserStats, UserStats } from "@/lib/finea-stats"

function Ring({ percent, size = 120, stroke = 9, color = GOLD, children }: {
  percent: number; size?: number; stroke?: number; color?: string; children?: React.ReactNode
}) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - Math.min(percent, 100) / 100) }}
          transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  )
}

export default function DefisPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [claimed, setClaimed] = useState<string[]>([])

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [s, snap] = await Promise.all([
        fetchUserStats(user.uid),
        getDoc(doc(db, "users", user.uid)),
      ])
      setStats(s)
      setClaimed(snap.exists() ? ((snap.data() as any)?.claimedChallenges ?? []) : [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }, [user])

  useEffect(() => {
    if (!user) { setStats(null); return }
    load()
  }, [user, load])

  async function claim(id: string) {
    if (!user || claimed.includes(id)) return
    const next = [...claimed, id]
    setClaimed(next)
    try { await setDoc(doc(db, "users", user.uid), { claimedChallenges: next }, { merge: true }) }
    catch (e) { console.error(e) }
  }

  const score = stats?.score
  const challenges = stats?.challenges ?? []
  const claimable = challenges.filter(c => c.completed && !claimed.includes(c.id)).length

  return (
    <div className="w-full h-full overflow-y-auto flex flex-col px-5 pt-10 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.back()}
          className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: BG_CARD, border: `1px solid ${BORDER}`, color: GOLD }}>
          <ArrowLeft size={17} />
        </motion.button>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.4)" }}>Progression</p>
          <h1 className="text-base font-bold text-white">Score & défis</h1>
        </div>
        {claimable > 0 && (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1"
            style={{ background: "rgba(74,222,128,0.14)", color: GREEN, border: "1px solid rgba(74,222,128,0.3)" }}>
            <Sparkles size={11} /> {claimable} à récupérer
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin" style={{ color: GOLD }} />
        </div>
      ) : (
        <>
          {/* Carte score */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-5 mb-5"
            style={{ background: "linear-gradient(135deg, rgba(236,204,104,0.10), rgba(255,255,255,0.02))", border: "1px solid rgba(236,204,104,0.18)" }}>
            <div className="flex items-center gap-5">
              <Ring percent={score?.score ?? 0} size={108} stroke={8}>
                <span className="font-bold text-2xl" style={{ color: GOLD }}>{score?.score ?? 0}</span>
                <span className="text-[9px] mt-0.5" style={{ color: "rgba(245,214,87,0.5)" }}>/ 100</span>
              </Ring>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: "rgba(245,214,87,0.5)" }}>Ton score de suivi</p>
                <p className="text-xl font-bold mb-2" style={{ color: GOLD }}>{score?.label}</p>
                <div className="space-y-1.5">
                  {score?.breakdown.map(b => (
                    <div key={b.label} className="flex items-center gap-2">
                      <span className="text-[10px] w-24 shrink-0" style={{ color: "rgba(255,255,255,0.45)" }}>{b.label}</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <motion.div className="h-full rounded-full" style={{ background: GOLD }}
                          initial={{ width: 0 }} animate={{ width: `${(b.points / b.max) * 100}%` }} transition={{ duration: 0.9 }} />
                      </div>
                      <span className="text-[9px] w-9 text-right" style={{ color: "rgba(255,255,255,0.35)" }}>{b.points}/{b.max}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Conseils */}
          {score && score.insights.length > 0 && (
            <div className="mb-5 space-y-2">
              {score.insights.map((tip, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="rounded-2xl px-4 py-3 text-xs" style={{ background: BG_CARD, border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.7)" }}>
                  {tip}
                </motion.div>
              ))}
            </div>
          )}

          {/* Défis */}
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={15} color={GOLD} />
            <p className="text-sm font-semibold text-white">Tes défis</p>
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
              {challenges.filter(c => c.completed).length}/{challenges.length} réussis
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {challenges.map((c, i) => {
              const isClaimed = claimed.includes(c.id)
              return (
                <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="rounded-3xl p-4" style={{ background: BG_CARD, border: `1px solid ${c.completed ? "rgba(74,222,128,0.25)" : BORDER}` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0"
                      style={{ background: c.completed ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.05)" }}>
                      {c.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-white">{c.title}</p>
                        {c.completed && <Check size={13} color={GREEN} />}
                      </div>
                      <p className="text-[11px] leading-snug" style={{ color: "rgba(255,255,255,0.45)" }}>{c.description}</p>
                    </div>
                    <span className="text-[10px] font-bold shrink-0" style={{ color: GOLD }}>+{c.reward} pts</span>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <motion.div className="h-full rounded-full"
                        style={{ background: c.completed ? GREEN : GOLD }}
                        initial={{ width: 0 }} animate={{ width: `${c.progress * 100}%` }} transition={{ duration: 1, delay: i * 0.06 }} />
                    </div>
                    <span className="text-[10px] shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {c.current}{c.unit === "%" ? "%" : c.unit === "€" ? " €" : ` ${c.unit}`}
                    </span>
                  </div>

                  {c.completed && (
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => claim(c.id)} disabled={isClaimed}
                      className="w-full mt-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                      style={isClaimed
                        ? { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }
                        : { background: "linear-gradient(135deg, #4ade80, #22c55e)", color: "#04210f" }}>
                      {isClaimed ? <><Check size={13} /> Récompense récupérée</> : <><Sparkles size={13} /> Récupérer +{c.reward} pts</>}
                    </motion.button>
                  )}
                  {!c.completed && (
                    <p className="text-[10px] mt-2 flex items-center gap-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                      <Lock size={10} /> Objectif : {c.target}{c.unit === "%" ? "%" : c.unit === "€" ? " €" : ` ${c.unit}`}
                    </p>
                  )}
                </motion.div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
