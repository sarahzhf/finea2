"use client"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, Plus, CreditCard, BarChart2, MoreHorizontal, ChevronRight, ArrowUpRight, ArrowDownLeft, TrendingUp, Loader2, ChevronDown, Check } from "lucide-react"
import { GOLD, GOLD_DIM, BG_CARD, BORDER, GREEN, RED } from "@/lib/theme"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import ProfileMenu from "@/components/profile-menu"
import { useAuth } from "@/components/AuthProvider"
<<<<<<< HEAD
import { fetchUserStats, UserStats } from "@/lib/finea-stats"
=======
>>>>>>> c2ce98782d34bda170bcf3571c6142480a36998b

const BUBBLE_ITEMS = [
  { emoji: "🏦", label: "Épargne",       route: "/epargne"      },
  { emoji: "💳", label: "Crédit",        route: "/credit"       },
  { emoji: "💱", label: "Convertisseur", route: "/plus"         },
]

interface Transaction {
  id: string
  label: string
  category: string
  amount: number
  date: string
  type: "in" | "out"
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
  return `${MOIS_FR[parseInt(m, 10) - 1]} ${y}`
}

export default function Dashboard() {
  const router = useRouter()
  const { user } = useAuth()
<<<<<<< HEAD
  const displayName = (user?.displayName || user?.email?.split("@")[0] || "toi").replace(/[._-]+/g, " ").replace(/\s+/g, " ").trim()
=======
  const displayName = user?.displayName || user?.email?.split("@")[0] || "toi"
>>>>>>> c2ce98782d34bda170bcf3571c6142480a36998b
  const firstName   = displayName.split(" ")[0]
  const initials    = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
  const [bubbleOpen, setBubbleOpen]   = useState(false)
  const [monthOpen, setMonthOpen]     = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<string>("")   // "YYYY-MM"
  // Solde réel depuis l'Excel (extrait du relevé CA)
  const [realSolde, setRealSolde]           = useState<number | null>(null)
  const [accountName, setAccountName]       = useState("")
  const [accountNumber, setAccountNumber]   = useState("")
<<<<<<< HEAD
  // Score de suivi + défis (par utilisateur)
  const [stats, setStats]       = useState<UserStats | null>(null)
  const [claimable, setClaimable] = useState(0)

  useEffect(() => {
    if (!user) {
      setTransactions([]); setRealSolde(null); setAccountName(""); setAccountNumber("")
      setStats(null); setClaimable(0)
      return
    }
=======

  useEffect(() => {
    if (!user) return
>>>>>>> c2ce98782d34bda170bcf3571c6142480a36998b
    loadAll()
    const onFocus  = () => loadAll()
    const onImport = () => loadAll()
    window.addEventListener("focus", onFocus)
    window.addEventListener("transactions-updated", onImport)
    return () => {
      window.removeEventListener("focus", onFocus)
      window.removeEventListener("transactions-updated", onImport)
    }
  }, [user])

  async function loadAll() {
<<<<<<< HEAD
    if (!user) return
    await Promise.all([loadTransactions(), loadAccountMeta(), loadStats()])
  }

  async function loadStats() {
    try {
      const [s, snap] = await Promise.all([
        fetchUserStats(user!.uid),
        getDoc(doc(db, "users", user!.uid)),
      ])
      setStats(s)
      const claimed: string[] = snap.exists() ? ((snap.data() as any)?.claimedChallenges ?? []) : []
      setClaimable(s.challenges.filter(c => c.completed && !claimed.includes(c.id)).length)
    } catch (e) {
      console.error("stats error:", e)
    }
=======
    await Promise.all([loadTransactions(), loadAccountMeta()])
>>>>>>> c2ce98782d34bda170bcf3571c6142480a36998b
  }

  async function loadAccountMeta() {
    try {
      const snap = await getDoc(doc(db, "account_meta", user!.uid))
      if (snap.exists()) {
        const d = snap.data()
        if (d.solde         != null) setRealSolde(d.solde)
        if (d.accountName)           setAccountName(d.accountName)
        if (d.accountNumber)         setAccountNumber(d.accountNumber)
      }
    } catch (e) {
      console.error("account_meta error:", e)
    }
  }

  async function loadTransactions() {
    try {
      const q = query(collection(db, "transactions"), where("userId", "==", user!.uid))
      const snap = await getDocs(q)
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction))
      all.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
      setTransactions(all)
    } catch (e) {
      console.error("Firestore error:", e)
    } finally {
      setLoading(false)
    }
  }

  // Mois disponibles (dédupliqués, triés desc)
  const availableMonths = useMemo(() => {
    const set = new Set<string>()
    transactions.forEach(t => {
      if (t.date?.length >= 7) set.add(t.date.slice(0, 7))
    })
    return Array.from(set).sort((a, b) => b.localeCompare(a))
  }, [transactions])

  // Sélection automatique du mois le plus récent à chaque chargement
  useEffect(() => {
    if (availableMonths.length > 0 && !availableMonths.includes(selectedMonth)) {
      setSelectedMonth(availableMonths[0])
    }
  }, [availableMonths])

  // Transactions filtrées par mois sélectionné
  const filtered = useMemo(() => {
    if (!selectedMonth) return transactions
    return transactions.filter(t => t.date?.startsWith(selectedMonth))
  }, [transactions, selectedMonth])

  // La carte de solde = toujours le mois le plus récent avec des données
  const latestMonth = availableMonths[0] ?? ""
  const latestTx = useMemo(() =>
    transactions.filter(t => latestMonth ? t.date?.startsWith(latestMonth) : false),
    [transactions, latestMonth]
  )
  const revenus  = latestTx.filter(t => t.type === "in" ).reduce((s, t) => s + t.amount, 0)
  const depenses = latestTx.filter(t => t.type === "out").reduce((s, t) => s + Math.abs(t.amount), 0)
  const solde    = revenus - depenses

  return (
    <div className="w-full h-full overflow-y-auto flex flex-col px-5 pt-10 pb-4 relative">

      <ProfileMenu
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        accountName={accountName}
        accountNumber={accountNumber}
        solde={realSolde}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          {/* Avatar cliquable → ouvre le menu profil */}
          <motion.button whileTap={{ scale: 0.92 }} onClick={() => setProfileOpen(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 relative"
            style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DIM})`, color: "#050A14" }}>
            {initials}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#050A14]"
              style={{ background: "#22c55e" }} />
          </motion.button>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Bonjour, {firstName} 👋</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>Tableau de bord</p>
          </div>
        </motion.div>
<<<<<<< HEAD
        <motion.button whileTap={{ scale: 0.88 }} onClick={() => router.push("/defis")}
          className="relative w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>
          <Bell size={17} color={claimable > 0 ? GOLD : "rgba(255,255,255,0.6)"} />
          {claimable > 0 && (
            <motion.span
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[9px] font-bold"
              style={{ background: "#f87171", color: "#fff", border: "2px solid #050A14" }}>
              {claimable}
            </motion.span>
          )}
=======
        <motion.button whileTap={{ scale: 0.88 }}
          className="relative w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>
          <Bell size={17} color="rgba(255,255,255,0.6)" />
>>>>>>> c2ce98782d34bda170bcf3571c6142480a36998b
        </motion.button>
      </div>

      {/* Balance card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="rounded-3xl mb-5 relative"
        style={{
          background: "linear-gradient(135deg, #0d1f2d 0%, #0a1628 60%, #131a0d 100%)",
          border: "1px solid rgba(245,214,87,0.18)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.55)",
        }}>
        <div className="absolute -top-10 -right-6 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(245,214,87,0.09), transparent 70%)" }} />
        <div className="absolute -bottom-8 -left-4 w-28 h-28 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(96,165,250,0.06), transparent 70%)" }} />

        <div className="relative z-10 px-5 pt-4 pb-5">
          {/* Ligne 1 : label + compte */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[11px] font-medium tracking-wide" style={{ color: "rgba(255,255,255,0.38)" }}>
                SOLDE ACTUEL · EUR
              </p>
              {accountName ? (
                <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.22)" }}>
                  {accountName}{accountNumber ? ` · ${accountNumber}` : ""}
                </p>
              ) : null}
            </div>
            {!loading && realSolde != null && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full"
                style={{
                  background: realSolde >= 0 ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)",
                  border: `1px solid ${realSolde >= 0 ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.25)"}`,
                }}>
                <TrendingUp size={10} color={realSolde >= 0 ? "#4ade80" : "#f87171"} />
                <span className="text-[10px] font-bold" style={{ color: realSolde >= 0 ? "#4ade80" : "#f87171" }}>
                  {realSolde >= 0 ? "+" : ""}
                  {realSolde.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </span>
              </div>
            )}
          </div>

          {/* Montant principal = solde réel du relevé */}
          {loading ? (
            <div className="flex items-center gap-2 h-12">
              <Loader2 size={20} className="animate-spin" style={{ color: GOLD }} />
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Chargement…</span>
            </div>
          ) : realSolde == null ? (
            <div className="h-12 flex flex-col justify-center">
              <p className="text-[28px] font-bold text-white/30 tracking-tight leading-none">— €</p>
              <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.28)" }}>Importez un relevé pour commencer</p>
            </div>
          ) : (
            <div className="mb-1">
              <div className="flex items-end gap-2">
                <p className="font-bold tracking-tight leading-none"
                  style={{
                    fontSize: Math.abs(realSolde) >= 10000 ? "26px" : Math.abs(realSolde) >= 1000 ? "30px" : "34px",
                    color: realSolde >= 0 ? "#ffffff" : "#f87171",
                  }}>
                  {realSolde >= 0 ? "" : "−"}{Math.abs(realSolde).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <span className="text-base font-semibold pb-0.5"
                  style={{ color: realSolde >= 0 ? "rgba(255,255,255,0.35)" : "rgba(248,113,113,0.5)" }}>€</span>
              </div>
              <p className="text-[11px] mt-1.5" style={{ color: "rgba(255,255,255,0.28)" }}>
                Solde du relevé{latestMonth ? ` · ${formatMonth(latestMonth)}` : ""}
              </p>
            </div>
          )}

          {/* Séparateur */}
          <div className="my-4 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />

          {/* Revenus / Dépenses / Solde calculé du mois */}
          <div className="flex items-end justify-between">
            <div className="flex gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Revenus{latestMonth ? ` ${formatMonth(latestMonth).split(" ")[0]}` : ""}
                </p>
                <p className="text-sm font-bold" style={{ color: GREEN }}>
                  {loading ? "—" : `+${revenus.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €`}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Dépenses
                </p>
                <p className="text-sm font-bold" style={{ color: RED }}>
                  {loading ? "—" : `−${depenses.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €`}
                </p>
              </div>
              {/* Solde net du mois */}
              {!loading && transactions.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>Net mois</p>
                  <p className="text-sm font-bold" style={{ color: solde >= 0 ? GREEN : RED }}>
                    {solde >= 0 ? "+" : "−"}{Math.abs(solde).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €
                  </p>
                </div>
              )}
            </div>
            <button onClick={() => router.push("/ajouter")}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 shrink-0"
              style={{ background: "rgba(245,214,87,0.12)", border: "1px solid rgba(245,214,87,0.3)", color: GOLD }}>
              Importer →
            </button>
          </div>
        </div>
      </motion.div>

<<<<<<< HEAD
      {/* Score de suivi (par utilisateur) */}
      {stats && (
        <motion.button initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          whileTap={{ scale: 0.98 }} onClick={() => router.push("/defis")}
          className="w-full rounded-3xl mb-5 p-4 flex items-center gap-4 text-left"
          style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>
          <div className="relative w-14 h-14 shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3.5" />
              <circle cx="18" cy="18" r="15.5" fill="none" stroke={GOLD} strokeWidth="3.5" strokeLinecap="round"
                strokeDasharray={`${(stats.score.score / 100) * 97.4} 97.4`} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-bold text-sm" style={{ color: GOLD }}>{stats.score.score}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-wider mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Score de suivi</p>
            <p className="text-sm font-bold text-white">{stats.score.label}</p>
            <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
              {stats.completedChallenges}/{stats.challenges.length} défis réussis
              {claimable > 0 && <span style={{ color: GREEN }}> · {claimable} à récupérer 🎁</span>}
            </p>
          </div>
          <ChevronRight size={18} color="rgba(255,255,255,0.3)" />
        </motion.button>
      )}

=======
>>>>>>> c2ce98782d34bda170bcf3571c6142480a36998b
      {/* Quick actions */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-4 gap-3 mb-6">
        {[
          { icon: <Plus size={20} />,       label: "Ajouter", route: "/ajouter"      },
          { icon: <CreditCard size={20} />, label: "Cartes",  route: "/cartes"       },
          { icon: <BarChart2  size={20} />, label: "Stats",   route: "/statistiques" },
        ].map((a, i) => (
          <motion.button key={a.label} whileTap={{ scale: 0.88 }} onClick={() => router.push(a.route)}
            className="flex flex-col items-center gap-2"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + i * 0.04 }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, rgba(236,204,104,0.16), rgba(236,204,104,0.05))`, border: `1px solid rgba(236,204,104,0.28)`, color: GOLD, boxShadow: "0 4px 16px rgba(0,0,0,0.35)" }}>
              {a.icon}
            </div>
            <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>{a.label}</span>
          </motion.button>
        ))}

        {/* Bouton Plus avec bulle */}
        <motion.div className="flex flex-col items-center gap-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => setBubbleOpen(v => !v)}
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: bubbleOpen
                ? `linear-gradient(135deg, rgba(236,204,104,0.30), rgba(236,204,104,0.12))`
                : `linear-gradient(135deg, rgba(236,204,104,0.16), rgba(236,204,104,0.05))`,
              border: `1px solid rgba(236,204,104,0.28)`, color: GOLD, boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
            }}>
            <MoreHorizontal size={20} />
          </motion.button>
          <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>Plus</span>
        </motion.div>
      </motion.div>

      {/* Bulle Plus */}
      <AnimatePresence>
        {bubbleOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-40" onClick={() => setBubbleOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.85, y: 8 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              className="absolute right-5 z-50 rounded-2xl overflow-hidden shadow-2xl"
              style={{ top: "calc(10rem + 56px)", background: "rgba(13,26,42,0.97)", border: `1px solid rgba(236,204,104,0.22)`, backdropFilter: "blur(20px)", minWidth: 180, boxShadow: "0 16px 48px rgba(0,0,0,0.7)" }}>
              {BUBBLE_ITEMS.map((item, i) => (
                <motion.button key={item.label}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setBubbleOpen(false); router.push(item.route) }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.06]"
                  style={{ borderBottom: i < BUBBLE_ITEMS.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                  <span className="text-xl">{item.emoji}</span>
                  <span className="text-sm font-semibold" style={{ color: GOLD }}>{item.label}</span>
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Section transactions ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}>

        {/* Header : titre + filtre mois */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-white">Transactions récentes</p>

          <div className="flex items-center gap-2">
            {/* Filtre mois */}
            {availableMonths.length > 0 && (
              <div className="relative">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setMonthOpen(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                  style={{
                    background: monthOpen ? "rgba(245,214,87,0.18)" : "rgba(245,214,87,0.08)",
                    border: `1px solid rgba(245,214,87,${monthOpen ? "0.45" : "0.22"})`,
                    color: GOLD,
                  }}>
                  <span>{selectedMonth ? formatMonth(selectedMonth) : "Mois"}</span>
                  <motion.div animate={{ rotate: monthOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={12} />
                  </motion.div>
                </motion.button>

                {/* Dropdown mois */}
                <AnimatePresence>
                  {monthOpen && (
                    <>
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40" onClick={() => setMonthOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: -4 }}
                        transition={{ type: "spring", stiffness: 400, damping: 28 }}
                        className="absolute right-0 top-9 z-50 rounded-2xl overflow-hidden min-w-[160px]"
                        style={{
                          background: "rgba(10,22,40,0.98)",
                          border: "1px solid rgba(245,214,87,0.2)",
                          boxShadow: "0 16px 40px rgba(0,0,0,0.7)",
                          backdropFilter: "blur(20px)",
                        }}>
                        {availableMonths.map((ym, i) => (
                          <motion.button
                            key={ym}
                            initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => { setSelectedMonth(ym); setMonthOpen(false) }}
                            className="w-full flex items-center justify-between px-4 py-3 text-left text-sm transition-colors hover:bg-white/[0.06]"
                            style={{
                              borderBottom: i < availableMonths.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                              color: ym === selectedMonth ? GOLD : "rgba(255,255,255,0.75)",
                              fontWeight: ym === selectedMonth ? 700 : 500,
                            }}>
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

            {transactions.length > 0 && (
              <button className="flex items-center gap-0.5 text-xs font-medium" style={{ color: GOLD }}
                onClick={() => router.push("/transactions")}>
                Voir tout <ChevronRight size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Liste */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={22} className="animate-spin" style={{ color: GOLD }} />
          </div>
        ) : transactions.length === 0 ? (
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push("/ajouter")}
            className="w-full rounded-3xl py-10 flex flex-col items-center gap-3 border border-dashed"
            style={{ borderColor: "rgba(236,204,104,0.2)", background: "rgba(236,204,104,0.03)" }}>
            <span className="text-4xl">📂</span>
            <div className="text-center">
              <p className="text-sm font-semibold" style={{ color: GOLD }}>Aucune transaction</p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>Appuyez pour importer un relevé bancaire</p>
            </div>
          </motion.button>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl py-8 flex flex-col items-center gap-2 border border-dashed"
            style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
            <span className="text-3xl">🗓️</span>
            <p className="text-sm font-semibold text-white/50">Aucune transaction ce mois</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.slice(0, 8).map((tx, i) => (
              <motion.div key={tx.id}
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.04 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-between rounded-2xl px-4 py-3 cursor-pointer"
                style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}` }}>
                    {CAT_ICONS[tx.category] ?? "💳"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-white truncate max-w-[140px]">{tx.label}</p>
                    <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {tx.category} · {tx.date?.slice(8, 10)}/{tx.date?.slice(5, 7)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: tx.type === "in" ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.15)" }}>
                    {tx.type === "in"
                      ? <ArrowDownLeft size={10} color="#4ade80" />
                      : <ArrowUpRight  size={10} color="#f87171" />}
                  </div>
                  <span className="text-[13px] font-bold"
                    style={{ color: tx.type === "in" ? "#4ade80" : "#f87171" }}>
                    {tx.type === "in" ? "+" : "−"}{Math.abs(tx.amount).toFixed(2)} €
                  </span>
                </div>
              </motion.div>
            ))}

            {/* Compteur si plus de 8 transactions */}
            {filtered.length > 8 && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/transactions")}
                className="w-full py-3 rounded-2xl text-xs font-semibold text-center"
                style={{ background: "rgba(245,214,87,0.06)", border: "1px solid rgba(245,214,87,0.15)", color: GOLD }}>
                +{filtered.length - 8} autres transactions · Voir tout →
              </motion.button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}
