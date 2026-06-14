"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, CheckCircle, AlertCircle, X, Loader2, Trash2 } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, addDoc, query, where, getDocs, updateDoc, doc, serverTimestamp, deleteDoc } from "firebase/firestore"
import { useAuth } from "@/components/AuthProvider"

const GOLD = "#F5D657"

interface SavingsEntry   { id?: string; userId: string; date: string; amount: number; note?: string }
interface SavingsGoal    { id?: string; userId: string; name: string; targetAmount: number; currentAmount: number; emoji: string; color: string; deadline?: string }
interface SavingsAccount {
  id: string; accountId: string; name: string; accountNumber: string; holder: string
  balance: number; interestRate: number; ceiling: number | null; updatedAt?: unknown
}
interface SavingsTx { id: string; label: string; amount: number; date: string; type: "in" | "out"; accountId: string }

const ACCOUNT_PALETTE = [
  { color: "#34D399", glow: "rgba(52,211,153,0.18)",  grad: "from-emerald-400/20 to-teal-600/15"  },
  { color: "#60A5FA", glow: "rgba(96,165,250,0.18)",  grad: "from-blue-400/20 to-indigo-600/15"  },
  { color: "#A78BFA", glow: "rgba(167,139,250,0.18)", grad: "from-violet-400/20 to-purple-600/15" },
  { color: "#F5D657", glow: "rgba(245,214,87,0.18)",  grad: "from-yellow-400/20 to-amber-600/15"  },
]

const GOAL_PRESETS = [
  { emoji: "🏠", color: "#F59E0B", name: "Achat immobilier" },
  { emoji: "✈️", color: "#60A5FA", name: "Voyage"           },
  { emoji: "🛡️", color: "#34D399", name: "Précaution"       },
  { emoji: "🎓", color: "#A78BFA", name: "Formation"        },
  { emoji: "🚗", color: "#F87171", name: "Véhicule"         },
  { emoji: "💍", color: "#EC4899", name: "Projet de vie"    },
]

function useCountUp(target: number) {
  const [val, setVal] = useState(0)
  const prev = useRef(0)
  useEffect(() => {
    const from = prev.current; prev.current = target
    const start = performance.now()
    const raf = requestAnimationFrame(function step(now) {
      const t = Math.min((now - start) / 1000, 1)
      setVal(from + (target - from) * (1 - Math.pow(1 - t, 3)))
      if (t < 1) requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(raf)
  }, [target])
  return val
}

function AnimatedEuro({ value, decimals = 2 }: { value: number; decimals?: number }) {
  const v = useCountUp(value)
  return <>{v.toLocaleString("fr-FR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} €</>
}

function RingProgress({ percent, color, size = 108, stroke = 7, children }: {
  percent: number; color: string; size?: number; stroke?: number; children?: React.ReactNode
}) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke}/>
        <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - Math.min(percent, 100) / 100) }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}/>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-1">{children}</div>
    </div>
  )
}

export default function EpargnePage() {
  const router = useRouter()
  const { user } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<"comptes" | "objectifs" | "historique">("comptes")

  // Comptes réels (importés)
  const [accounts, setAccounts]               = useState<SavingsAccount[]>([])
  const [savingsTxs, setSavingsTxs]           = useState<SavingsTx[]>([])
  const [accountsLoading, setAccountsLoading] = useState(true)
  const [activeAccount, setActiveAccount]     = useState(0)

  // Import
  const [importStatus, setImportStatus] = useState<"idle"|"loading"|"done"|"error">("idle")
  const [importMsg, setImportMsg]       = useState("")
  const [importCount, setImportCount]   = useState(0)

  // Entrées manuelles + objectifs
  const [savingsEntries, setSavingsEntries] = useState<SavingsEntry[]>([])
  const [savingsGoals,   setSavingsGoals]   = useState<SavingsGoal[]>([])
  const [isLoading,      setIsLoading]      = useState(true)
  const [currentMonth,   setCurrentMonth]   = useState(new Date())
  const [showAddModal,   setShowAddModal]   = useState(false)
  const [selectedDate,   setSelectedDate]   = useState("")
  const [modalAmount,    setModalAmount]    = useState("")
  const [modalNote,      setModalNote]      = useState("")
  const [existingEntry,  setExistingEntry]  = useState<SavingsEntry | null>(null)
  const [showGoalModal,  setShowGoalModal]  = useState(false)
  const [editGoal,       setEditGoal]       = useState<SavingsGoal | null>(null)
  const [goalName,       setGoalName]       = useState("")
  const [goalEmoji,      setGoalEmoji]      = useState("🎯")
  const [goalColor,      setGoalColor]      = useState(GOLD)
  const [goalTarget,     setGoalTarget]     = useState("")
  const [goalCurrent,    setGoalCurrent]    = useState("")
  const [goalDeadline,   setGoalDeadline]   = useState("")

  // Simulateur
  const [simAmount, setSimAmount] = useState(300)
  const [simRate,   setSimRate]   = useState(3)
  const [simYears,  setSimYears]  = useState(5)

  const simResult   = useMemo(() => { const r = simRate/100/12; const n = simYears*12; if(r===0) return simAmount*n; return simAmount*((Math.pow(1+r,n)-1)/r)*(1+r) }, [simAmount,simRate,simYears])
  const simInterest = simResult - simAmount * simYears * 12

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    await Promise.all([loadAccounts(), loadEntries(), loadGoals()])
  }

  async function loadAccounts() {
    try {
      setAccountsLoading(true)
      const q = query(collection(db, "savings_accounts"), where("userId", "==", user!.uid))
      const snap = await getDocs(q)
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as SavingsAccount))
      setAccounts(all)

      const qt = query(collection(db, "savings_transactions"), where("userId", "==", user!.uid))
      const snTx = await getDocs(qt)
      const txs = snTx.docs.map(d => ({ id: d.id, ...d.data() } as SavingsTx))
      txs.sort((a, b) => b.date.localeCompare(a.date))
      setSavingsTxs(txs)
    } catch(e) { console.error(e) } finally { setAccountsLoading(false) }
  }

  async function loadEntries() {
    try {
      const q = query(collection(db, "savings_entries"), where("userId", "==", user!.uid))
      const snap = await getDocs(q)
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as SavingsEntry))
      all.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
      setSavingsEntries(all)
    } catch(e) { console.error(e) } finally { setIsLoading(false) }
  }
  async function loadGoals() {
    try {
      const q = query(collection(db, "savings_goals_v2"), where("userId", "==", user!.uid))
      const snap = await getDocs(q)
      setSavingsGoals(snap.docs.map(d => ({ id: d.id, ...d.data() } as SavingsGoal)))
    } catch(e) { console.error(e) }
  }

  // ─── Import fichier épargne ───────────────────────────────────────────────
  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportStatus("loading")
    setImportMsg("")
    try {
      const form = new FormData()
      form.append("file", file)
      form.append("userId", user?.uid ?? "")
      const res  = await fetch("/api/import-savings", { method: "POST", body: form })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setImportStatus("error")
        setImportMsg(data.error ?? "Erreur inconnue")
      } else {
        setImportStatus("done")
        setImportMsg(`${data.accountName} · ${data.solde?.toLocaleString("fr-FR", {minimumFractionDigits:2})} €`)
        setImportCount(data.count)
        await loadAccounts()
      }
    } catch(err: any) {
      setImportStatus("error")
      setImportMsg(err.message ?? "Erreur réseau")
    }
    if (fileRef.current) fileRef.current.value = ""
  }

  // ─── Gestion entrées manuelles ───────────────────────────────────────────
  async function saveSavingsEntry() {
    if (!selectedDate || !modalAmount) return
    try {
      const amount = parseFloat(modalAmount)
      if (existingEntry?.id) {
        if (amount === 0) await deleteDoc(doc(db, "savings_entries", existingEntry.id))
        else await updateDoc(doc(db, "savings_entries", existingEntry.id), { amount, note: modalNote || "" })
      } else if (amount > 0) {
        await addDoc(collection(db, "savings_entries"), { userId: user!.uid, date: selectedDate, amount, note: modalNote || "", createdAt: serverTimestamp() })
      }
      await loadEntries()
      setShowAddModal(false); setModalAmount(""); setModalNote(""); setSelectedDate(""); setExistingEntry(null)
    } catch { alert("Erreur lors de la sauvegarde") }
  }
  async function saveGoal() {
    if (!goalName || !goalTarget) return
    try {
      const data = { userId: user!.uid, name: goalName, emoji: goalEmoji, color: goalColor, targetAmount: parseFloat(goalTarget), currentAmount: parseFloat(goalCurrent)||0, deadline: goalDeadline||null, createdAt: serverTimestamp() }
      if (editGoal?.id) await updateDoc(doc(db, "savings_goals_v2", editGoal.id), data)
      else await addDoc(collection(db, "savings_goals_v2"), data)
      await loadGoals(); closeGoalModal()
    } catch(e) { console.error(e) }
  }
  async function deleteGoal(id: string) { await deleteDoc(doc(db, "savings_goals_v2", id)); await loadGoals() }
  function openGoalModal(goal?: SavingsGoal) {
    if (goal) { setEditGoal(goal); setGoalName(goal.name); setGoalEmoji(goal.emoji); setGoalColor(goal.color); setGoalTarget(goal.targetAmount.toString()); setGoalCurrent(goal.currentAmount.toString()); setGoalDeadline(goal.deadline||"") }
    else { setEditGoal(null); setGoalName(""); setGoalEmoji("🎯"); setGoalColor(GOLD); setGoalTarget(""); setGoalCurrent(""); setGoalDeadline("") }
    setShowGoalModal(true)
  }
  function closeGoalModal() { setShowGoalModal(false); setEditGoal(null) }

  // ─── Calendrier heatmap ──────────────────────────────────────────────────
  function getDaysInMonth(date: Date) {
    const [year, month] = [date.getFullYear(), date.getMonth()]
    const offset = (() => { const d = new Date(year, month, 1).getDay(); return d === 0 ? 6 : d - 1 })()
    const days: (number | null)[] = Array(offset).fill(null)
    for (let d = 1; d <= new Date(year, month + 1, 0).getDate(); d++) days.push(d)
    return days
  }
  function dateStr(day: number | null) {
    if (!day) return ""
    return `${currentMonth.getFullYear()}-${String(currentMonth.getMonth()+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`
  }
  function getAmount(day: number | null) { if (!day) return 0; return savingsEntries.find(e => e.date === dateStr(day))?.amount || 0 }
  function getEntry(day: number | null) { if (!day) return null; return savingsEntries.find(e => e.date === dateStr(day)) || null }
  function handleDayClick(day: number | null) {
    if (!day) return
    const entry = getEntry(day)
    setSelectedDate(dateStr(day))
    if (entry) { setExistingEntry(entry); setModalAmount(entry.amount.toString()); setModalNote(entry.note||"") }
    else { setExistingEntry(null); setModalAmount(""); setModalNote("") }
    setShowAddModal(true)
  }

  const days       = getDaysInMonth(currentMonth)
  const maxDayAmt  = Math.max(...days.map(d => getAmount(d)), 1)
  const totalSaved = savingsEntries.reduce((s, e) => s + e.amount, 0)
  const currentYear = new Date().getFullYear()
  const monthlyStats = Array.from({ length: 12 }, (_, i) => {
    const prefix = `${currentYear}-${String(i+1).padStart(2,"0")}`
    return { label: ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"][i], amount: savingsEntries.filter(e => e.date.startsWith(prefix)).reduce((s, e) => s + e.amount, 0) }
  })
  const maxBar      = Math.max(...monthlyStats.map(m => m.amount), 1)
  const curMonthIdx = new Date().getMonth()

  // Totaux réels des comptes importés
  const totalBalance = accounts.reduce((s, a) => s + (a.balance ?? 0), 0)

  // Compte actif
  const acc = accounts[activeAccount]
  const pal = ACCOUNT_PALETTE[activeAccount % ACCOUNT_PALETTE.length]
  const ceilPct      = acc && acc.ceiling ? Math.min((acc.balance / acc.ceiling) * 100, 100) : 0
  const interestEarned = acc ? (acc.balance * acc.interestRate) / 100 : 0

  // Transactions du compte actif
  const activeTxs = acc ? savingsTxs.filter(t => t.accountId === acc.accountId).slice(0, 8) : []

  return (
    <div className="w-full h-full flex flex-col bg-[#050A14] text-slate-50">
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportFile} />

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-3 border-b border-white/[0.06] shrink-0">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.back()}
          className="w-9 h-9 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0"
          style={{ color: GOLD }}>
          <ArrowLeft size={17} />
        </motion.button>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Finances</p>
          <h1 className="text-base font-bold text-white">Épargne</h1>
        </div>
        {/* Bouton import rapide */}
        <motion.button whileTap={{ scale: 0.9 }}
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
          style={{ background: "rgba(245,214,87,0.10)", border: "1px solid rgba(245,214,87,0.25)", color: GOLD }}>
          {importStatus === "loading"
            ? <Loader2 size={12} className="animate-spin" />
            : importStatus === "done"
            ? <CheckCircle size={12} />
            : <Upload size={12} />}
          <span>{importStatus === "loading" ? "Chargement…" : importStatus === "done" ? "Importé ✓" : "Importer"}</span>
        </motion.button>
      </div>

      {/* Bandeau retour import */}
      <AnimatePresence>
        {(importStatus === "done" || importStatus === "error") && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="flex items-center justify-between px-4 py-2 shrink-0"
            style={{ background: importStatus === "done" ? "rgba(74,222,128,0.08)" : "rgba(248,113,113,0.08)", borderBottom: `1px solid ${importStatus === "done" ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.15)"}` }}>
            <div className="flex items-center gap-2">
              {importStatus === "done"
                ? <CheckCircle size={13} color="#4ade80" />
                : <AlertCircle size={13} color="#f87171" />}
              <span className="text-xs font-medium" style={{ color: importStatus === "done" ? "#4ade80" : "#f87171" }}>
                {importStatus === "done" ? `${importMsg} · ${importCount} opérations` : importMsg}
              </span>
            </div>
            <button onClick={() => setImportStatus("idle")}><X size={13} color="rgba(255,255,255,0.3)" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-6 space-y-4">

        {/* Hero strip */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="relative overflow-hidden bg-gradient-to-br from-[#F5D657]/10 via-white/[0.02] to-emerald-500/8 border border-[#F5D657]/12 rounded-3xl p-5">
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#F5D657]/6 blur-3xl rounded-full pointer-events-none" />
          <div className="flex items-center gap-4">
            <RingProgress percent={accounts.length > 0 && totalBalance > 0 ? Math.min((totalSaved / totalBalance) * 100, 100) : 0} color="#F5D657" size={88} stroke={6}>
              <span className="text-[#F5D657] font-bold text-sm leading-none">
                {accounts.length > 0 ? accounts.length : "—"}
              </span>
              <span className="text-[#F5D657]/40 text-[9px] mt-0.5">{accounts.length === 1 ? "compte" : "comptes"}</span>
            </RingProgress>
            <div className="flex-1 min-w-0">
              <p className="text-[#F5D657]/50 text-[11px] uppercase tracking-widest mb-1">Total épargne</p>
              {accountsLoading ? (
                <p className="text-white/30 font-bold text-2xl leading-none">— €</p>
              ) : accounts.length === 0 ? (
                <div>
                  <p className="text-white/30 font-bold text-xl leading-none mb-1">Aucun compte</p>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => fileRef.current?.click()}
                    className="text-xs font-semibold px-3 py-1 rounded-lg"
                    style={{ background: "rgba(245,214,87,0.12)", color: GOLD }}>
                    + Importer un relevé
                  </motion.button>
                </div>
              ) : (
                <>
                  <p className="text-[#F5D657] font-bold text-2xl leading-none"><AnimatedEuro value={totalBalance} /></p>
                  <div className="flex flex-wrap gap-2.5 mt-2">
                    {accounts.map((a, i) => (
                      <div key={a.id} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ACCOUNT_PALETTE[i % ACCOUNT_PALETTE.length].color }} />
                        <span className="text-white/35 text-[10px]">{a.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1.5 p-1 bg-white/[0.03] rounded-2xl border border-white/[0.05]">
          {([
            { key: "comptes"    as const, label: "Comptes",   icon: "🏦" },
            { key: "objectifs"  as const, label: "Objectifs", icon: "🎯" },
            { key: "historique" as const, label: "Historique",icon: "📈" },
          ]).map(({ key, label, icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${tab === key ? "text-[#0A1D37]" : "text-[#F5D657]/45"}`}>
              {tab === key && <motion.div layoutId="savings-tab" className="absolute inset-0 bg-[#F5D657] rounded-xl" transition={{ type: "spring", stiffness: 380, damping: 30 }} />}
              <span className="relative z-10 text-sm">{icon}</span>
              <span className="relative z-10">{label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── COMPTES ── */}
          {tab === "comptes" && (
            <motion.div key="comptes" initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.22 }} className="space-y-4">

              {accountsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 size={22} className="animate-spin" style={{ color: GOLD }} />
                </div>
              ) : accounts.length === 0 ? (
                /* ─ Aucun compte importé ─ */
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => fileRef.current?.click()}
                  className="w-full rounded-3xl py-12 flex flex-col items-center gap-3 border border-dashed"
                  style={{ borderColor: "rgba(245,214,87,0.2)", background: "rgba(245,214,87,0.03)" }}>
                  <span className="text-4xl">🏦</span>
                  <div className="text-center">
                    <p className="text-sm font-semibold" style={{ color: GOLD }}>Aucun compte d'épargne</p>
                    <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                      Importez votre relevé Livret A, PEA…
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold"
                    style={{ background: "rgba(245,214,87,0.12)", color: GOLD }}>
                    <Upload size={13} /> Importer un relevé
                  </div>
                </motion.button>
              ) : (
                <>
                  {/* Carousel */}
                  <div className="relative">
                    <AnimatePresence mode="wait">
                      <motion.div key={activeAccount}
                        initial={{ opacity: 0, x: 56, scale: 0.97 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -56, scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 320, damping: 28 }}
                        className={`relative overflow-hidden bg-gradient-to-br ${pal.grad} backdrop-blur-xl border border-white/[0.1] rounded-3xl p-5`}
                        style={{ boxShadow: `0 24px 64px ${pal.glow}` }}>
                        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-25" style={{ backgroundColor: pal.color }} />
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="text-white/35 text-xs tracking-wider">{acc.accountNumber ? `•••• ${acc.accountNumber.slice(-4)}` : "—"}</p>
                            <h2 className="text-white font-bold text-xl mt-1">{acc.name}</h2>
                            {acc.holder && <p className="text-white/30 text-[11px] mt-0.5">{acc.holder}</p>}
                          </div>
                          {acc.interestRate > 0 && (
                            <div className="bg-white/[0.08] backdrop-blur rounded-2xl px-3 py-2 text-center border border-white/[0.1]">
                              <p className="font-bold text-sm leading-none" style={{ color: pal.color }}>{acc.interestRate}%</p>
                              <p className="text-white/40 text-[9px] mt-0.5">/ an</p>
                            </div>
                          )}
                        </div>

                        {/* Solde réel importé */}
                        <p className="text-white font-bold text-[2rem] leading-none mb-1">
                          <AnimatedEuro value={acc.balance} />
                        </p>
                        {acc.interestRate > 0 && (
                          <p className="text-xs mb-3" style={{ color: pal.color }}>
                            +{interestEarned.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} € générés / an
                          </p>
                        )}

                        {/* Barre plafond */}
                        {acc.ceiling && (
                          <div className="mt-2">
                            <div className="flex justify-between text-[11px] text-white/40 mb-1.5">
                              <span>Remplissage du plafond</span>
                              <span>{ceilPct.toFixed(0)}% · max {acc.ceiling.toLocaleString("fr-FR")} €</span>
                            </div>
                            <div className="h-2 bg-white/[0.08] rounded-full overflow-hidden">
                              <motion.div className="h-full rounded-full" style={{ backgroundColor: pal.color }}
                                initial={{ width: 0 }} animate={{ width: `${ceilPct}%` }} transition={{ duration: 1.1, ease: "easeOut" }} />
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                    {accounts.length > 1 && <>
                      <button onClick={() => setActiveAccount((activeAccount - 1 + accounts.length) % accounts.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur flex items-center justify-center text-white text-lg">‹</button>
                      <button onClick={() => setActiveAccount((activeAccount + 1) % accounts.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur flex items-center justify-center text-white text-lg">›</button>
                    </>}
                  </div>

                  {/* Dots */}
                  {accounts.length > 1 && (
                    <div className="flex justify-center gap-1.5">
                      {accounts.map((_, i) => (
                        <button key={i} onClick={() => setActiveAccount(i)}
                          className={`h-1.5 rounded-full transition-all duration-300 ${i === activeAccount ? "w-6 bg-[#F5D657]" : "w-1.5 bg-white/20"}`} />
                      ))}
                    </div>
                  )}

                  {/* Grille miniatures comptes */}
                  {accounts.length > 1 && (
                    <div className="grid grid-cols-3 gap-2.5">
                      {accounts.map((a, i) => (
                        <motion.button key={a.id} onClick={() => setActiveAccount(i)} whileTap={{ scale: 0.96 }}
                          className={`relative overflow-hidden bg-white/[0.04] rounded-2xl p-3 border transition-all ${i === activeAccount ? "border-[#F5D657]/25 bg-[#F5D657]/[0.04]" : "border-white/[0.06]"}`}>
                          <div className="w-2.5 h-2.5 rounded-full mb-2" style={{ backgroundColor: ACCOUNT_PALETTE[i % ACCOUNT_PALETTE.length].color }} />
                          <p className="text-white/35 text-[10px] truncate">{a.name}</p>
                          <p className="text-white text-xs font-bold mt-0.5">
                            {a.balance >= 1000 ? `${(a.balance/1000).toFixed(1)}k` : a.balance.toFixed(0)} €
                          </p>
                        </motion.button>
                      ))}
                    </div>
                  )}

                  {/* Dernières opérations du compte actif */}
                  {activeTxs.length > 0 && (
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-4">
                      <p className="text-white/50 text-xs uppercase tracking-wider mb-3">Dernières opérations</p>
                      <div className="space-y-2">
                        {activeTxs.map(tx => (
                          <div key={tx.id} className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-xl flex items-center justify-center text-sm"
                                style={{ background: tx.type === "in" ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)" }}>
                                {tx.type === "in" ? "↓" : "↑"}
                              </div>
                              <div>
                                <p className="text-[12px] font-medium text-white truncate max-w-[150px]">{tx.label}</p>
                                <p className="text-[10px] text-white/30">{tx.date?.slice(8,10)}/{tx.date?.slice(5,7)}/{tx.date?.slice(0,4)}</p>
                              </div>
                            </div>
                            <p className="text-[13px] font-bold" style={{ color: tx.type === "in" ? "#4ade80" : "#f87171" }}>
                              {tx.type === "in" ? "+" : "−"}{Math.abs(tx.amount).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bouton ajouter un autre compte */}
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={() => fileRef.current?.click()}
                    className="w-full py-3 rounded-2xl border border-dashed text-xs font-semibold flex items-center justify-center gap-2"
                    style={{ borderColor: "rgba(245,214,87,0.2)", color: "rgba(245,214,87,0.5)" }}>
                    <Upload size={13} /> Importer un autre compte
                  </motion.button>
                </>
              )}

              {/* Simulateur intérêts composés */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-5">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-2xl bg-[#F5D657]/10 border border-[#F5D657]/15 flex items-center justify-center text-lg">🔮</div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">Simulateur d'intérêts</h3>
                    <p className="text-white/35 text-[10px]">Épargne mensuelle avec intérêts composés</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { label: "Versement / mois", val: simAmount, set: setSimAmount, min: 50,  max: 2000, step: 50,  fmt: (v: number) => `${v} €`    },
                    { label: "Taux annuel",       val: simRate,   set: setSimRate,   min: 0,   max: 10,   step: 0.5, fmt: (v: number) => `${v}%`     },
                    { label: "Durée",             val: simYears,  set: setSimYears,  min: 1,   max: 30,   step: 1,   fmt: (v: number) => `${v} ans`  },
                  ].map(({ label, val, set, min, max, step, fmt }) => (
                    <div key={label}>
                      <div className="flex justify-between text-[11px] mb-1.5">
                        <span className="text-white/40">{label}</span>
                        <span className="text-[#F5D657] font-medium">{fmt(val)}</span>
                      </div>
                      <input type="range" min={min} max={max} step={step} value={val}
                        onChange={e => set(Number(e.target.value))}
                        className="w-full h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer"
                        style={{ accentColor: "#F5D657" }} />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2.5 mt-5">
                  <div className="bg-white/[0.04] rounded-2xl p-3 text-center">
                    <p className="text-white/35 text-[10px] mb-1">Capital versé</p>
                    <p className="text-white font-bold text-sm">{(simAmount*simYears*12).toLocaleString("fr-FR")} €</p>
                  </div>
                  <div className="bg-white/[0.04] rounded-2xl p-3 text-center">
                    <p className="text-white/35 text-[10px] mb-1">Intérêts</p>
                    <p className="text-green-400 font-bold text-sm">+{Math.round(simInterest).toLocaleString("fr-FR")} €</p>
                  </div>
                  <div className="rounded-2xl p-3 text-center" style={{ background: "rgba(245,214,87,0.08)", border: "1px solid rgba(245,214,87,0.15)" }}>
                    <p className="text-[#F5D657]/50 text-[10px] mb-1">Capital final</p>
                    <p className="text-[#F5D657] font-bold text-sm">{Math.round(simResult).toLocaleString("fr-FR")} €</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── OBJECTIFS ── */}
          {tab === "objectifs" && (
            <motion.div key="objectifs" initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.22 }}>
              {isLoading ? (
                <div className="flex justify-center pt-10">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    className="w-6 h-6 rounded-full border-2 border-[#F5D657] border-t-transparent" />
                </div>
              ) : savingsGoals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <motion.p initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: "spring" }} className="text-5xl mb-4">🎯</motion.p>
                  <p className="text-white/50 text-sm mb-1">Aucun objectif défini</p>
                  <p className="text-white/25 text-xs mb-6">Commence par créer ton premier projet d'épargne</p>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => openGoalModal()}
                    className="px-6 py-2.5 bg-[#F5D657] text-[#0A1D37] rounded-xl text-sm font-semibold">
                    Créer un objectif
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-4">
                  {savingsGoals.map((goal, i) => {
                    const pct = Math.min((goal.currentAmount / Math.max(goal.targetAmount, 1)) * 100, 100)
                    const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0)
                    const daysLeft = goal.deadline ? Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000)) : null
                    return (
                      <motion.div key={goal.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                        className="relative overflow-hidden bg-white/[0.04] border border-white/[0.07] rounded-3xl p-5">
                        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl opacity-20" style={{ backgroundColor: goal.color }} />
                        <div className="flex items-center gap-4">
                          <RingProgress percent={pct} color={goal.color} size={82} stroke={6}>
                            <span className="font-bold text-sm leading-none text-white">{Math.round(pct)}%</span>
                          </RingProgress>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-xl">{goal.emoji}</span>
                              <h3 className="text-white font-semibold text-sm truncate">{goal.name}</h3>
                            </div>
                            <p className="text-white/40 text-xs mb-2">{goal.currentAmount.toLocaleString("fr-FR")} € / {goal.targetAmount.toLocaleString("fr-FR")} €</p>
                            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                              <motion.div className="h-full rounded-full" style={{ backgroundColor: goal.color }}
                                initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.2, ease: "easeOut", delay: i * 0.08 }} />
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                              {remaining > 0 && <span className="text-[10px] text-white/30">Reste {remaining.toLocaleString("fr-FR")} €</span>}
                              {daysLeft !== null && <span className="text-[10px] font-medium" style={{ color: goal.color }}>{daysLeft}j restants</span>}
                              {pct >= 100 && <span className="text-[10px] text-green-400 font-medium">✓ Objectif atteint !</span>}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5 shrink-0">
                            <button onClick={() => openGoalModal(goal)} className="w-7 h-7 rounded-xl bg-white/[0.06] flex items-center justify-center text-xs text-white/40">✎</button>
                            <button onClick={() => goal.id && deleteGoal(goal.id)} className="w-7 h-7 rounded-xl bg-white/[0.06] flex items-center justify-center text-xs text-red-400/50">✕</button>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                  <motion.button whileTap={{ scale: 0.98 }} onClick={() => openGoalModal()}
                    className="w-full py-3.5 rounded-2xl border border-dashed border-[#F5D657]/20 text-[#F5D657]/50 text-sm">
                    + Nouvel objectif
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}

          {/* ── HISTORIQUE ── */}
          {tab === "historique" && (
            <motion.div key="historique" initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.22 }} className="space-y-4">
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth()-1))}
                    className="w-8 h-8 rounded-xl bg-white/[0.06] text-[#F5D657] flex items-center justify-center text-lg">‹</button>
                  <h2 className="text-white font-semibold text-sm capitalize">{currentMonth.toLocaleDateString("fr-FR",{month:"long",year:"numeric"})}</h2>
                  <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth()+1))}
                    className="w-8 h-8 rounded-xl bg-white/[0.06] text-[#F5D657] flex items-center justify-center text-lg">›</button>
                </div>
                <div className="grid grid-cols-7 gap-0.5 mb-1">
                  {["L","M","M","J","V","S","D"].map((d,i) => <div key={i} className="text-center text-white/20 text-[9px] font-medium py-1">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {days.map((day, idx) => {
                    const amount    = getAmount(day)
                    const intensity = day ? amount / maxDayAmt : 0
                    const today     = day && dateStr(day) === new Date().toISOString().split("T")[0]
                    return (
                      <motion.button key={idx} onClick={() => handleDayClick(day)} disabled={!day} whileTap={day ? { scale: 0.88 } : {}}
                        className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all ${today ? "ring-1 ring-[#F5D657]/50" : ""}`}
                        style={day ? { backgroundColor: amount > 0 ? `rgba(245,214,87,${0.08+intensity*0.55})` : "rgba(255,255,255,0.03)" } : {}}>
                        {day && <>
                          <span className="text-[10px] font-medium leading-none" style={{ color: amount > 0 ? `rgba(245,214,87,${0.55+intensity*0.45})` : "rgba(255,255,255,0.25)" }}>{day}</span>
                          {amount > 0 && <span className="text-[7.5px] leading-none mt-0.5" style={{ color: `rgba(245,214,87,${0.4+intensity*0.4})` }}>{amount>=1000?`${(amount/1000).toFixed(1)}k`:amount.toFixed(0)}</span>}
                        </>}
                      </motion.button>
                    )
                  })}
                </div>
                <motion.button whileTap={{ scale: 0.98 }}
                  onClick={() => { setSelectedDate(new Date().toISOString().split("T")[0]); setExistingEntry(null); setModalAmount(""); setModalNote(""); setShowAddModal(true) }}
                  className="w-full mt-4 py-2.5 rounded-xl bg-[#F5D657] text-[#0A1D37] font-semibold text-sm">
                  + Ajouter une mise de côté
                </motion.button>
              </div>

              <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-5">
                <h3 className="text-white font-semibold text-sm mb-5">Évolution {currentYear}</h3>
                <div className="flex items-end gap-1 h-28">
                  {monthlyStats.map((s,i) => {
                    const h = (s.amount/maxBar)*100
                    const isCur = i === curMonthIdx
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <motion.div className="w-full rounded-t-lg min-h-[3px]"
                          style={{ backgroundColor: isCur ? "#F5D657" : "rgba(245,214,87,0.2)" }}
                          initial={{ height: 0 }} animate={{ height: `${Math.max(h,2)}%` }}
                          transition={{ duration: 0.7, delay: i*0.04, ease: "easeOut" }} />
                        <span className="text-[8px] text-white/25">{s.label.slice(0,1)}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/[0.05]">
                  {[
                    { label: "Total enregistré", value: `${totalSaved.toLocaleString("fr-FR")} €`, color: "text-[#F5D657]" },
                    { label: "Nbre d'entrées",   value: savingsEntries.length,                      color: "text-white" },
                    { label: "Moy. par entrée",  value: `${savingsEntries.length>0?Math.round(totalSaved/savingsEntries.length).toLocaleString("fr-FR"):0} €`, color: "text-white" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="text-center">
                      <p className={`font-bold text-sm ${color}`}>{value}</p>
                      <p className="text-white/30 text-[10px] mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-end justify-center z-50 p-4"
            onClick={e => { if (e.target === e.currentTarget) { setShowAddModal(false); setExistingEntry(null) } }}>
            <motion.div initial={{ y: 64, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 64, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="bg-[#0F2B52] border border-white/[0.08] rounded-3xl p-6 w-full">
              <h3 className="text-lg font-bold text-[#F5D657] mb-5">{existingEntry ? "Modifier" : "Mise de côté"}</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-[#F5D657]/40 text-[11px] block mb-1.5 uppercase tracking-wider">Date</label>
                  <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                    className="w-full bg-[#0A1D37] text-[#F5D657] rounded-xl px-3 py-2.5 text-sm border border-white/[0.06] outline-none" />
                </div>
                <div>
                  <label className="text-[#F5D657]/40 text-[11px] block mb-1.5 uppercase tracking-wider">Montant (€)</label>
                  <input type="number" value={modalAmount} onChange={e => setModalAmount(e.target.value)}
                    className="w-full bg-[#0A1D37] text-[#F5D657] rounded-xl px-3 py-2.5 text-2xl font-bold border border-white/[0.06] outline-none" placeholder="50" />
                </div>
                <div>
                  <label className="text-[#F5D657]/40 text-[11px] block mb-1.5 uppercase tracking-wider">Note</label>
                  <input type="text" value={modalNote} onChange={e => setModalNote(e.target.value)}
                    className="w-full bg-[#0A1D37] text-[#F5D657] rounded-xl px-3 py-2.5 text-sm border border-white/[0.06] outline-none" placeholder="Épargne mensuelle…" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => { setShowAddModal(false); setExistingEntry(null) }} className="flex-1 py-2.5 rounded-xl bg-white/[0.06] text-[#F5D657] text-sm">Annuler</button>
                  <button onClick={saveSavingsEntry} className="flex-1 py-2.5 rounded-xl bg-[#F5D657] text-[#0A1D37] text-sm font-bold">
                    {existingEntry ? "Modifier" : "Enregistrer"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showGoalModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-end justify-center z-50 p-4"
            onClick={e => { if (e.target === e.currentTarget) closeGoalModal() }}>
            <motion.div initial={{ y: 64, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 64, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="bg-[#0F2B52] border border-white/[0.08] rounded-3xl p-6 w-full max-h-[85%] overflow-y-auto">
              <h3 className="text-lg font-bold text-[#F5D657] mb-5">{editGoal ? "Modifier l'objectif" : "Nouvel objectif"}</h3>
              {!editGoal && (
                <div className="mb-5">
                  <p className="text-[#F5D657]/40 text-[11px] uppercase tracking-wider mb-2">Modèle rapide</p>
                  <div className="grid grid-cols-3 gap-2">
                    {GOAL_PRESETS.map(p => (
                      <button key={p.name} onClick={() => { setGoalEmoji(p.emoji); setGoalColor(p.color); setGoalName(p.name) }}
                        className={`flex flex-col items-center p-2.5 rounded-2xl text-center transition border ${goalName===p.name?"border-[#F5D657]/30 bg-[#F5D657]/[0.06]":"border-white/[0.06] bg-white/[0.02]"}`}>
                        <span className="text-2xl">{p.emoji}</span>
                        <span className="text-[9px] text-white/40 mt-1 leading-tight">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-3">
                <div>
                  <label className="text-[#F5D657]/40 text-[11px] block mb-1.5 uppercase tracking-wider">Nom</label>
                  <input type="text" value={goalName} onChange={e => setGoalName(e.target.value)}
                    className="w-full bg-[#0A1D37] text-[#F5D657] rounded-xl px-3 py-2.5 text-sm border border-white/[0.06] outline-none" placeholder="Mon projet d'épargne" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#F5D657]/40 text-[11px] block mb-1.5 uppercase tracking-wider">Cible (€)</label>
                    <input type="number" value={goalTarget} onChange={e => setGoalTarget(e.target.value)}
                      className="w-full bg-[#0A1D37] text-[#F5D657] rounded-xl px-3 py-2.5 text-sm font-bold border border-white/[0.06] outline-none" placeholder="5 000" />
                  </div>
                  <div>
                    <label className="text-[#F5D657]/40 text-[11px] block mb-1.5 uppercase tracking-wider">Déjà épargné</label>
                    <input type="number" value={goalCurrent} onChange={e => setGoalCurrent(e.target.value)}
                      className="w-full bg-[#0A1D37] text-[#F5D657] rounded-xl px-3 py-2.5 text-sm border border-white/[0.06] outline-none" placeholder="0" />
                  </div>
                </div>
                <div>
                  <label className="text-[#F5D657]/40 text-[11px] block mb-1.5 uppercase tracking-wider">Date limite (optionnelle)</label>
                  <input type="date" value={goalDeadline} onChange={e => setGoalDeadline(e.target.value)}
                    className="w-full bg-[#0A1D37] text-[#F5D657] rounded-xl px-3 py-2.5 text-sm border border-white/[0.06] outline-none" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={closeGoalModal} className="flex-1 py-2.5 rounded-xl bg-white/[0.06] text-[#F5D657] text-sm">Annuler</button>
                  <button onClick={saveGoal} className="flex-1 py-2.5 rounded-xl bg-[#F5D657] text-[#0A1D37] text-sm font-bold">Enregistrer</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
