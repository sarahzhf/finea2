"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts"
import { GOLD, GOLD_DIM, BG_CARD, BORDER, GREEN, RED } from "@/lib/theme"

const weekData = [
  { day: "L", income: 0, expense: 120 },
  { day: "M", income: 0, expense: 67 },
  { day: "M", income: 650, expense: 14 },
  { day: "J", income: 0, expense: 89 },
  { day: "V", income: 3200, expense: 52 },
  { day: "S", income: 0, expense: 145 },
  { day: "D", income: 0, expense: 35 },
]

const monthData = [
  { day: "1", income: 3200, expense: 180 },
  { day: "5", income: 0, expense: 340 },
  { day: "10", income: 650, expense: 90 },
  { day: "15", income: 0, expense: 210 },
  { day: "20", income: 0, expense: 145 },
  { day: "25", income: 0, expense: 89 },
  { day: "30", income: 0, expense: 55 },
]

const categories = [
  { name: "Alimentation", amount: -342.80, pct: 47, icon: "🛒", color: GOLD },
  { name: "Transport", amount: -124.50, pct: 17, icon: "🚇", color: "#60a5fa" },
  { name: "Abonnements", amount: -89.90, pct: 12, icon: "📱", color: "#a78bfa" },
  { name: "Santé", amount: -45.00, pct: 6, icon: "💊", color: "#f87171" },
  { name: "Restaurants", amount: -98.40, pct: 13, icon: "🍽️", color: "#fb923c" },
  { name: "Autre", amount: -36.60, pct: 5, icon: "📦", color: "#94a3b8" },
]

const pieData = categories.map(c => ({ name: c.name, value: Math.abs(c.amount) }))

export default function Statistiques() {
  const router = useRouter()
  const [period, setPeriod] = useState<"week" | "month">("month")
  const data = period === "week" ? weekData : monthData

  const totalIncome = data.reduce((s, d) => s + d.income, 0)
  const totalExpense = data.reduce((s, d) => s + d.expense, 0)

  return (
    <div className="w-full h-full overflow-y-auto px-5 pt-10 pb-6">
      <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.back()}
        className="flex items-center gap-2 mb-6" style={{ color: GOLD }}
        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
        <ArrowLeft size={18} />
        <span className="text-sm font-semibold">Retour</span>
      </motion.button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-[26px] font-bold text-white mb-1">Analyses</h1>
        <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.38)" }}>
          Vue d'ensemble de vos finances
        </p>
      </motion.div>

      {/* Period toggle */}
      <div className="flex gap-2 mb-5">
        {(["week", "month"] as const).map((p) => (
          <motion.button key={p} whileTap={{ scale: 0.93 }} onClick={() => setPeriod(p)}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold"
            style={{
              background: period === p ? GOLD : BG_CARD,
              color: period === p ? "#050A14" : "rgba(255,255,255,0.5)",
              border: `1px solid ${period === p ? GOLD : BORDER}`,
            }}>
            {p === "week" ? "Cette semaine" : "Ce mois"}
          </motion.button>
        ))}
      </div>

      {/* Summary pills */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="flex gap-3 mb-5">
        <div className="flex-1 rounded-2xl p-3 flex items-center gap-2.5"
          style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.18)" }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(74,222,128,0.15)" }}>
            <TrendingUp size={15} color={GREEN} />
          </div>
          <div>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>Revenus</p>
            <p className="text-sm font-bold" style={{ color: GREEN }}>+{totalIncome.toLocaleString()} €</p>
          </div>
        </div>
        <div className="flex-1 rounded-2xl p-3 flex items-center gap-2.5"
          style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.18)" }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(248,113,113,0.15)" }}>
            <TrendingDown size={15} color={RED} />
          </div>
          <div>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>Dépenses</p>
            <p className="text-sm font-bold" style={{ color: RED }}>-{totalExpense.toLocaleString()} €</p>
          </div>
        </div>
      </motion.div>

      {/* Area Chart */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
        className="rounded-3xl p-4 mb-5"
        style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>
        <p className="text-xs font-semibold text-white mb-3">Flux de trésorerie</p>
        <ResponsiveContainer width="100%" height={130}>
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={GREEN} stopOpacity={0.3} />
                <stop offset="95%" stopColor={GREEN} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={GOLD} stopOpacity={0.3} />
                <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "#0d1a2a", border: `1px solid ${BORDER}`, borderRadius: 12, fontSize: 11 }}
              labelStyle={{ color: "rgba(255,255,255,0.6)" }}
            />
            <Area type="monotone" dataKey="income" stroke={GREEN} strokeWidth={2} fill="url(#income)" />
            <Area type="monotone" dataKey="expense" stroke={GOLD} strokeWidth={2} fill="url(#expense)" />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-1">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1.5 rounded-full" style={{ background: GREEN }} />
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>Revenus</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1.5 rounded-full" style={{ background: GOLD }} />
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>Dépenses</span>
          </div>
        </div>
      </motion.div>

      {/* Pie + categories */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
        className="rounded-3xl p-4 mb-4"
        style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>
        <p className="text-xs font-semibold text-white mb-3">Répartition des dépenses</p>
        <div className="flex items-center gap-4">
          <PieChart width={100} height={100}>
            <Pie data={pieData} cx={45} cy={45} innerRadius={28} outerRadius={45} strokeWidth={0} dataKey="value">
              {pieData.map((_, i) => (
                <Cell key={i} fill={categories[i].color} opacity={0.85} />
              ))}
            </Pie>
          </PieChart>
          <div className="flex-1 flex flex-col gap-1.5">
            {categories.slice(0, 4).map((c) => (
              <div key={c.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                  <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.6)" }}>{c.name}</span>
                </div>
                <span className="text-[11px] font-semibold" style={{ color: RED }}>
                  {c.amount.toFixed(0)} €
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Category list */}
      <p className="text-sm font-semibold text-white mb-3">Détail par catégorie</p>
      <div className="flex flex-col gap-2">
        {categories.map((cat, i) => (
          <motion.div key={cat.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.22 + i * 0.04 }}
            className="rounded-2xl px-4 py-3"
            style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2.5">
                <span className="text-base">{cat.icon}</span>
                <span className="text-sm font-medium text-white">{cat.name}</span>
              </div>
              <span className="text-sm font-bold" style={{ color: RED }}>
                {cat.amount.toFixed(2)} €
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${cat.pct}%` }}
                transition={{ duration: 0.7, delay: 0.3 + i * 0.04, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: cat.color }}
              />
            </div>
            <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.28)" }}>{cat.pct}% du budget</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
