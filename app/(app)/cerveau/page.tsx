"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Brain, Target, HelpCircle, Lightbulb, ChevronRight, Star, Zap } from "lucide-react"
import { GOLD, GOLD_DIM, BG_CARD, BORDER } from "@/lib/theme"

const sections = [
  {
    id: "missions",
    href: "/missions",
    emoji: "🎯",
    title: "Missions",
    subtitle: "Mini-jeux financiers interactifs",
    desc: "Monde 3D · Swipe Game · Bill Rush · Savings Lab — Apprends en jouant dans un espace immersif.",
    tag: "3 mini-jeux",
    color: "#f59e0b",
  },
  {
    id: "quiz",
    href: "/quiz",
    emoji: "🧠",
    title: "Quiz",
    subtitle: "Quiz adaptatif Supabase",
    desc: "10 questions sélectionnées par un algorithme adaptatif qui s'ajuste à ton niveau en temps réel.",
    tag: "Adaptatif",
    color: "#60a5fa",
  },
  {
    id: "conseils",
    href: "/conseils",
    emoji: "💡",
    title: "Conseils",
    subtitle: "Guides & astuces premium",
    desc: "Catégories de conseils, pièges à éviter et calculateurs d'économies intégrés.",
    tag: "32 articles",
    color: "#4ade80",
  },
]

export default function Cerveau() {
  const router = useRouter()

  return (
    <div className="w-full h-full overflow-y-auto px-5 pt-10 pb-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(236,204,104,0.12)", border: "1px solid rgba(236,204,104,0.22)" }}>
          <Brain size={20} color={GOLD} />
        </div>
        <div>
          <h1 className="text-[26px] font-bold text-white leading-tight">Espace Savoirs</h1>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>Apprendre · Progresser · Maîtriser</p>
        </div>
      </motion.div>

      {/* XP Bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}
        className="rounded-2xl p-4 mb-6 mt-4"
        style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <Star size={14} color={GOLD} fill={GOLD} />
            <p className="text-xs font-semibold text-white">Niveau 4 — Expert Financier</p>
          </div>
          <p className="text-xs font-bold" style={{ color: GOLD }}>1 240 XP</p>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
          <motion.div
            initial={{ width: 0 }} animate={{ width: "62%" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${GOLD}, ${GOLD_DIM})` }}
          />
        </div>
        <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.28)" }}>760 XP pour le niveau 5</p>
      </motion.div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {[
          { label: "Missions", value: "3", icon: <Target size={14} color="#f59e0b" />, color: "#f59e0b" },
          { label: "Quiz joués", value: "7", icon: <HelpCircle size={14} color="#60a5fa" />, color: "#60a5fa" },
          { label: "Conseils lus", value: "12", icon: <Lightbulb size={14} color="#4ade80" />, color: "#4ade80" },
        ].map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="rounded-2xl p-3 text-center"
            style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>
            <div className="flex justify-center mb-1">{s.icon}</div>
            <p className="text-base font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[9px] uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.35)" }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Section cards — navigate to real pages */}
      <div className="flex flex-col gap-4">
        {sections.map((s, i) => (
          <motion.button key={s.id}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.08 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push(s.href)}
            className="w-full rounded-3xl p-5 flex items-start gap-4 text-left"
            style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
              style={{ background: `${s.color}18`, border: `1px solid ${s.color}38` }}>
              {s.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-base font-bold text-white">{s.title}</p>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: `${s.color}22`, color: s.color }}>
                  {s.tag}
                </span>
              </div>
              <p className="text-xs font-semibold mb-1" style={{ color: s.color }}>{s.subtitle}</p>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.42)" }}>{s.desc}</p>
            </div>
            <ChevronRight size={18} color="rgba(255,255,255,0.25)" className="shrink-0 mt-1" />
          </motion.button>
        ))}
      </div>

      {/* Daily challenge */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="mt-5 rounded-3xl p-4"
        style={{ background: `linear-gradient(135deg, rgba(236,204,104,0.08), rgba(184,151,58,0.05))`, border: `1px solid rgba(236,204,104,0.22)` }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0"
            style={{ background: "rgba(236,204,104,0.12)" }}>
            ⚡
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-white">Défi du jour</p>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.42)" }}>
              Complète un quiz de 10 questions et gagne 150 XP bonus
            </p>
          </div>
          <motion.button whileTap={{ scale: 0.9 }}
            onClick={() => router.push("/quiz")}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold shrink-0"
            style={{ background: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}35` }}>
            <Zap size={11} />
            Go
          </motion.button>
        </div>
<<<<<<< HEAD
        <button onClick={() => router.push("/defis")}
          className="w-full mt-3 pt-3 text-[10px] font-semibold text-left flex items-center justify-between"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)", color: GOLD }}>
          <span>🏆 Voir mon score & tous mes défis</span>
          <ChevronRight size={13} />
        </button>
=======
>>>>>>> c2ce98782d34bda170bcf3571c6142480a36998b
      </motion.div>
    </div>
  )
}
