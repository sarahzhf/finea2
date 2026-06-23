"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, ChevronDown, Check, Search, X } from "lucide-react"
import { GOLD, BG_CARD, BORDER, GREEN, RED } from "@/lib/theme"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"
import { useAuth } from "@/components/AuthProvider"

interface Transaction {
  id: string; label: string; category: string; amount: number; date: string; type: "in" | "out"
}

const CAT_ICONS: Record<string, string> = {
  "Abonnements": "📱", "Alimentation": "🛒", "Transport": "🚆",
  "Logement": "🏠", "Revenus": "💼", "Santé": "💊",
  "Shopping": "🛍️", "Restaurants": "🍽️", "Impôts": "🏛️",
  "Virements": "💸", "Autre": "💳",
}

const MOIS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"]
function formatMonth(ym: string) {
  const [y, m] = ym.split("-")
  return `${MOIS_FR[parseInt(m,10)-1]} ${y}`
}

export default function TransactionsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading]           = useState(true)
  const [selectedMonth, setSelectedMonth] = useState("")
  const [monthOpen, setMonthOpen]       = useState(false)
  const [search, setSearch]             = useState("")
  const [filterType, setFilterType]     = useState<"all"|"in"|"out">("all")

  useEffect(() => {
    if (!user) return
    loadTransactions()
    window.addEventListener("transactions-updated", loadTransactions)
    return () => window.removeEventListener("transactions-updated", loadTransactions)
  }, [user])

  async function loadTransactions() {
    try {
      const q = query(collection(db, "transactions"), where("userId", "==", user!.uid))
      const snap = await getDocs(q)
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction))
      all.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
      setTransactions(all)
    } catch(e) { console.error(e) } finally { setLoading(false) }
  }

  const availableMonths = useMemo(() => {
    const set = new Set<string>()
    transactions.forEach(t => { if (t.date?.length >= 7) set.add(t.date.slice(0,7)) })
    return Array.from(set).sort((a,b) => b.localeCompare(a))
  }, [transactions])

  useEffect(() => {
    if (availableMonths.length > 0 && !selectedMonth) setSelectedMonth(availableMonths[0])
  }, [availableMonths])

  const filtered = useMemo(() => {
    return transactions
      .filter(t => !selectedMonth || t.date?.startsWith(selectedMonth))
      .filter(t => filterType === "all" || t.type === filterType)
      .filter(t => !search || t.label?.toLowerCase().includes(search.toLowerCase()) || t.category?.toLowerCase().includes(search.toLowerCase()))
  }, [transactions, selectedMonth, filterType, search])

  const revenus  = filtered.filter(t => t.type === "in" ).reduce((s,t) => s + t.amount, 0)
  const depenses = filtered.filter(t => t.type === "out").reduce((s,t) => s + Math.abs(t.amount), 0)
  const solde    = revenus - depenses

  // Grouper par date
  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>()
    filtered.forEach(t => {
      const key = t.date ?? "—"
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
    })
    return Array.from(map.entries()).sort((a,b) => b[0].localeCompare(a[0]))
  }, [filtered])

  function formatDate(d: string) {
    if (!d || d.length < 10) return d
    const [y, m, day] = d.split("-")
    const date = new Date(parseInt(y), parseInt(m)-1, parseInt(day))
    return date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#050A14] text-white">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-3 border-b border-white/[0.06] shrink-0">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.back()}
          className="w-9 h-9 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0"
          style={{ color: GOLD }}>
          <ArrowLeft size={17} />
        </motion.button>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Finances</p>
          <h1 className="text-base font-bold text-white">Transactions</h1>
        </div>
        {/* Filtre mois */}
        {availableMonths.length > 0 && (
          <div className="relative">
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setMonthOpen(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{ background: "rgba(245,214,87,0.08)", border: `1px solid rgba(245,214,87,${monthOpen?"0.45":"0.22"})`, color: GOLD }}>
              <span>{selectedMonth ? formatMonth(selectedMonth) : "Mois"}</span>
              <motion.div animate={{ rotate: monthOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={12} />
              </motion.div>
            </motion.button>
            <AnimatePresence>
              {monthOpen && (
                <>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40" onClick={() => setMonthOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: -4 }}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                    className="absolute right-0 top-9 z-50 rounded-2xl overflow-hidden min-w-[160px]"
                    style={{ background: "rgba(10,22,40,0.98)", border: "1px solid rgba(245,214,87,0.2)", boxShadow: "0 16px 40px rgba(0,0,0,0.7)", backdropFilter: "blur(20px)" }}>
                    {availableMonths.map((ym, i) => (
                      <motion.button key={ym} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => { setSelectedMonth(ym); setMonthOpen(false) }}
                        className="w-full flex items-center justify-between px-4 py-3 text-left text-sm transition-colors hover:bg-white/[0.06]"
                        style={{ borderBottom: i < availableMonths.length-1 ? "1px solid rgba(255,255,255,0.05)" : "none", color: ym === selectedMonth ? GOLD : "rgba(255,255,255,0.75)", fontWeight: ym === selectedMonth ? 700 : 500 }}>
                        <span>{formatMonth(ym)}</span>
                        {ym === selectedMonth && <Check size={13} color={GOLD} />}
                      </motion.button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Résumé mois */}
      {!loading && filtered.length > 0 && (
        <div className="flex gap-3 px-4 py-3 border-b border-white/[0.04] shrink-0">
          <div className="flex-1 rounded-2xl px-3 py-2 text-center" style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.12)" }}>
            <p className="text-[10px] text-white/30 uppercase tracking-wider">Revenus</p>
            <p className="text-sm font-bold" style={{ color: GREEN }}>+{revenus.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €</p>
          </div>
          <div className="flex-1 rounded-2xl px-3 py-2 text-center" style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.12)" }}>
            <p className="text-[10px] text-white/30 uppercase tracking-wider">Dépenses</p>
            <p className="text-sm font-bold" style={{ color: RED }}>−{depenses.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €</p>
          </div>
          <div className="flex-1 rounded-2xl px-3 py-2 text-center" style={{ background: solde >= 0 ? "rgba(74,222,128,0.06)" : "rgba(248,113,113,0.06)", border: `1px solid ${solde >= 0 ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)"}` }}>
            <p className="text-[10px] text-white/30 uppercase tracking-wider">Solde net</p>
            <p className="text-sm font-bold" style={{ color: solde >= 0 ? GREEN : RED }}>
              {solde >= 0 ? "+" : "−"}{Math.abs(solde).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €
            </p>
          </div>
        </div>
      )}

      {/* Recherche + filtre type */}
      <div className="flex gap-2 px-4 py-3 shrink-0">
        <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>
          <Search size={14} color="rgba(255,255,255,0.3)" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder-white/25"
          />
          {search && <button onClick={() => setSearch("")}><X size={13} color="rgba(255,255,255,0.3)" /></button>}
        </div>
        <div className="flex rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
          {(["all","in","out"] as const).map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className="px-3 py-2 text-xs font-semibold transition-colors"
              style={{ background: filterType === t ? GOLD : BG_CARD, color: filterType === t ? "#050A14" : "rgba(255,255,255,0.4)" }}>
              {t === "all" ? "Tout" : t === "in" ? "↓" : "↑"}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="flex justify-center pt-16">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              className="w-6 h-6 rounded-full border-2 border-t-transparent" style={{ borderColor: GOLD }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-16 gap-3">
            <span className="text-4xl">🗓️</span>
            <p className="text-white/40 text-sm">Aucune transaction</p>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            {grouped.map(([date, txs]) => (
              <div key={date}>
                {/* Label date */}
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-2 capitalize" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {formatDate(date)}
                </p>
                <div className="flex flex-col gap-1.5">
                  {txs.map((tx, i) => (
                    <motion.div key={tx.id}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      className="flex items-center justify-between rounded-2xl px-4 py-3"
                      style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                          style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}` }}>
                          {CAT_ICONS[tx.category] ?? "💳"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-white truncate max-w-[160px]">{tx.label}</p>
                          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>{tx.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ background: tx.type === "in" ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.15)" }}>
                          {tx.type === "in"
                            ? <ArrowDownLeft size={9} color="#4ade80" />
                            : <ArrowUpRight  size={9} color="#f87171" />}
                        </div>
                        <span className="text-[13px] font-bold"
                          style={{ color: tx.type === "in" ? "#4ade80" : "#f87171" }}>
                          {tx.type === "in" ? "+" : "−"}{Math.abs(tx.amount).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
