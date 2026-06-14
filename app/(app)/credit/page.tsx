"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { ArrowLeft, X, ChevronRight } from "lucide-react"
import { GOLD, GOLD_DIM, BG_CARD, BORDER } from "@/lib/theme"

// ─── Simulateur Consommation ─────────────────────────────────────────────────
function SimulateurConso({ onClose }: { onClose: () => void }) {
  const [amount, setAmount] = useState(10000)
  const [rate,   setRate]   = useState(5)
  const [months, setMonths] = useState(48)

  const { monthly, total, interest } = useMemo(() => {
    const r = rate / 100 / 12
    if (r === 0) { const m = amount / months; return { monthly: m, total: amount, interest: 0 } }
    const m = amount * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
    const t = m * months
    return { monthly: m, total: t, interest: t - amount }
  }, [amount, rate, months])

  const amortRows = useMemo(() => {
    const r = rate / 100 / 12; let rem = amount; const rows = []
    for (let i = 1; i <= Math.min(months, 6); i++) {
      const int = rem * r; const cap = monthly - int; rem -= cap
      rows.push({ i, cap, int, rem: Math.max(rem, 0) })
    }
    return rows
  }, [amount, rate, months, monthly])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-end justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div initial={{ y: 64, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 64, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="bg-[#0B1120] border border-white/[0.08] rounded-3xl p-6 w-full max-h-[88%] overflow-y-auto">

        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] mb-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Simulateur</p>
            <h3 className="text-base font-bold text-white">Crédit consommation 🪙</h3>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <X size={14} color="rgba(255,255,255,0.45)" />
          </button>
        </div>

        <div className="space-y-4 mb-5">
          {[
            { label: "Montant emprunté", val: amount, set: setAmount, min: 1000, max: 75000, step: 500, fmt: (v: number) => `${v.toLocaleString("fr-FR")} €` },
            { label: "Taux annuel (TAEG)", val: rate, set: setRate, min: 0.5, max: 20, step: 0.1, fmt: (v: number) => `${v.toFixed(1)} %` },
            { label: "Durée", val: months, set: setMonths, min: 6, max: 84, step: 6, fmt: (v: number) => `${v} mois (${(v/12).toFixed(1)} ans)` },
          ].map(({ label, val, set, min, max, step, fmt }) => (
            <div key={label} className="rounded-2xl p-3.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex justify-between text-[11px] mb-2.5">
                <span style={{ color: "rgba(255,255,255,0.4)" }}>{label}</span>
                <span className="font-semibold" style={{ color: GOLD }}>{fmt(val)}</span>
              </div>
              <input type="range" min={min} max={max} step={step} value={val}
                onChange={e => set(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer"
                style={{ accentColor: GOLD }} />
            </div>
          ))}
        </div>

        {/* Résultats */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {[
            { label: "Mensualité", val: `${monthly.toFixed(2)} €`, color: GOLD },
            { label: "Coût total",  val: `${total.toFixed(0)} €`,   color: "white" },
            { label: "Intérêts",   val: `${interest.toFixed(0)} €`, color: "#F87171" },
          ].map(({ label, val, color }) => (
            <div key={label} className="rounded-2xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[10px] mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</p>
              <p className="font-bold text-sm" style={{ color }}>{val}</p>
            </div>
          ))}
        </div>

        {/* Barre capital/intérêts */}
        <div className="mb-5">
          <div className="flex justify-between text-[10px] mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            <span>Capital</span><span>Intérêts</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden flex" style={{ background: "rgba(255,255,255,0.06)" }}>
            <motion.div className="h-full rounded-full" style={{ background: GOLD }}
              initial={{ width: 0 }} animate={{ width: `${(amount / total) * 100}%` }} transition={{ duration: 0.8 }} />
            <div className="h-full flex-1 bg-red-400/30" />
          </div>
        </div>

        {/* Tableau d'amortissement */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>
            Premiers remboursements
          </p>
          <div className="space-y-2">
            {amortRows.map(row => (
              <div key={row.i} className="flex items-center gap-2.5 text-[11px]">
                <span className="w-6 shrink-0 font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>M{row.i}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden flex" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div style={{ width: `${(row.cap / monthly) * 100}%`, background: GOLD }} className="h-full rounded-full" />
                  <div className="h-full flex-1 bg-red-400/20" />
                </div>
                <span className="w-16 text-right font-semibold" style={{ color: GOLD }}>{row.cap.toFixed(0)} €</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Simulateur Immobilier ────────────────────────────────────────────────────
function SimulateurImmo({ onClose }: { onClose: () => void }) {
  const [price,     setPrice]     = useState(250000)
  const [apport,    setApport]    = useState(50000)
  const [rate,      setRate]      = useState(3.5)
  const [years,     setYears]     = useState(20)
  const [assurance, setAssurance] = useState(0.35)

  const borrowed   = Math.max(price - apport, 0)
  const months     = years * 12
  const apportPct  = price > 0 ? (apport / price) * 100 : 0

  const { monthly, total, interest, assuranceMensuelle, mensualiteTotale } = useMemo(() => {
    const r = rate / 100 / 12
    if (borrowed <= 0) return { monthly: 0, total: 0, interest: 0, assuranceMensuelle: 0, mensualiteTotale: 0 }
    const m   = r === 0 ? borrowed / months : borrowed * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
    const ass = (borrowed * assurance / 100) / 12
    const t   = m * months
    return { monthly: m, total: t, interest: t - borrowed, assuranceMensuelle: ass, mensualiteTotale: m + ass }
  }, [borrowed, rate, months, assurance])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-end justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div initial={{ y: 64, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 64, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="bg-[#0B1120] border border-white/[0.08] rounded-3xl p-6 w-full max-h-[88%] overflow-y-auto">

        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] mb-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Simulateur</p>
            <h3 className="text-base font-bold text-white">Crédit immobilier 🏡</h3>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <X size={14} color="rgba(255,255,255,0.45)" />
          </button>
        </div>

        <div className="space-y-4 mb-5">
          {[
            { label: "Prix du bien",                              val: price,     set: setPrice,     min: 50000, max: 1000000, step: 5000, fmt: (v: number) => `${v.toLocaleString("fr-FR")} €` },
            { label: `Apport personnel (${apportPct.toFixed(0)}%)`, val: apport, set: setApport,    min: 0,     max: price,   step: 5000, fmt: (v: number) => `${v.toLocaleString("fr-FR")} €` },
            { label: "Taux crédit (TAEG)",                        val: rate,      set: setRate,      min: 0.5,   max: 8,       step: 0.05, fmt: (v: number) => `${v.toFixed(2)} %` },
            { label: "Durée",                                     val: years,     set: setYears,     min: 5,     max: 30,      step: 1,    fmt: (v: number) => `${v} ans` },
            { label: "Taux assurance",                            val: assurance, set: setAssurance, min: 0.1,   max: 1,       step: 0.05, fmt: (v: number) => `${v.toFixed(2)} %` },
          ].map(({ label, val, set, min, max, step, fmt }) => (
            <div key={label} className="rounded-2xl p-3.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex justify-between text-[11px] mb-2.5">
                <span style={{ color: "rgba(255,255,255,0.4)" }}>{label}</span>
                <span className="font-semibold" style={{ color: GOLD }}>{fmt(val)}</span>
              </div>
              <input type="range" min={min} max={max} step={step} value={val}
                onChange={e => set(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer"
                style={{ accentColor: GOLD }} />
            </div>
          ))}
        </div>

        {/* Résultats */}
        <div className="rounded-3xl overflow-hidden mb-5" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
          {[
            { label: "Montant emprunté",       val: `${borrowed.toLocaleString("fr-FR")} €`, color: "rgba(255,255,255,0.9)", bold: false },
            { label: "Mensualité (hors ass.)", val: `${monthly.toFixed(2)} €`,                color: GOLD,                   bold: false },
            { label: "Assurance mensuelle",    val: `${assuranceMensuelle.toFixed(2)} €`,     color: "rgba(255,255,255,0.45)", bold: false },
            { label: "Mensualité totale",      val: `${mensualiteTotale.toFixed(2)} €`,       color: GOLD,                   bold: true  },
            { label: "Coût total intérêts",    val: `${interest.toFixed(0)} €`,               color: "#F87171",              bold: false },
          ].map(({ label, val, color, bold }, idx, arr) => (
            <div key={label}
              className="flex items-center justify-between px-4 py-3"
              style={{
                background: bold ? `${GOLD}0A` : "rgba(255,255,255,0.025)",
                borderBottom: idx < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
              }}>
              <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</span>
              <span className={`text-xs ${bold ? "font-bold" : "font-medium"}`} style={{ color }}>{val}</span>
            </div>
          ))}
        </div>

        {/* Barre apport/crédit */}
        <div>
          <div className="flex justify-between text-[10px] mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            <span>Apport ({apportPct.toFixed(0)} %)</span>
            <span>Crédit ({(100 - apportPct).toFixed(0)} %)</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden flex" style={{ background: "rgba(255,255,255,0.06)" }}>
            <motion.div className="h-full rounded-full bg-emerald-400"
              initial={{ width: 0 }} animate={{ width: `${apportPct}%` }} transition={{ duration: 0.8 }} />
            <div className="h-full flex-1" style={{ background: `${GOLD}55` }} />
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Modal Ajouter Banque ─────────────────────────────────────────────────────
const BANKS = [
  { name: "Crédit Agricole",   icon: "🌾", color: "#00AA4F" },
  { name: "BNP Paribas",       icon: "🏦", color: "#009B77" },
  { name: "Société Générale",  icon: "🔴", color: "#E4012C" },
  { name: "LCL",               icon: "💙", color: "#003F8C" },
  { name: "Caisse d'Épargne",  icon: "🐿️", color: "#BE1622" },
  { name: "La Banque Postale", icon: "✉️", color: "#FFCC00" },
  { name: "Boursorama",        icon: "📱", color: "#00B2EF" },
  { name: "Hello bank!",       icon: "👋", color: "#FF5733" },
  { name: "N26",               icon: "⚫", color: "#333333" },
  { name: "Revolut",           icon: "🌀", color: "#0666EB" },
  { name: "Autre banque",      icon: "🏛️", color: "#888888" },
]

function AjouterBanqueModal({ onClose }: { onClose: () => void }) {
  const [step,   setStep]   = useState<"list" | "confirm">("list")
  const [chosen, setChosen] = useState<typeof BANKS[0] | null>(null)
  const [iban,   setIban]   = useState("")
  const [done,   setDone]   = useState(false)

  function select(b: typeof BANKS[0]) { setChosen(b); setStep("confirm") }
  function confirm() {
    if (!iban.trim()) return
    setDone(true)
    setTimeout(onClose, 1800)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-end justify-center z-50"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div initial={{ y: 64, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 64, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="bg-[#0B1120] border border-white/[0.08] rounded-t-3xl w-full max-h-[85%] overflow-y-auto">

        <div className="sticky top-0 bg-[#0B1120] z-10 flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            {step === "confirm" && (
              <button onClick={() => setStep("list")}
                className="w-7 h-7 rounded-xl flex items-center justify-center mr-1"
                style={{ background: "rgba(255,255,255,0.06)" }}>
                <ArrowLeft size={13} color="white" />
              </button>
            )}
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.35)" }}>
                {step === "list" ? "Connexion bancaire" : chosen?.name}
              </p>
              <h3 className="text-sm font-bold text-white">
                {step === "list" ? "Choisir ma banque" : "Entrer mon IBAN"}
              </h3>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <X size={14} color="rgba(255,255,255,0.45)" />
          </button>
        </div>

        <div className="px-5 pb-8 pt-4">
          <AnimatePresence mode="wait">
            {step === "list" && (
              <motion.div key="list" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
                <p className="text-[11px] mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Sélectionne ta banque pour suivre tes crédits
                </p>
                <div className="space-y-2">
                  {BANKS.map(b => (
                    <motion.button key={b.name} whileTap={{ scale: 0.97 }} onClick={() => select(b)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                        style={{ background: b.color + "22", border: `1px solid ${b.color}44` }}>
                        {b.icon}
                      </div>
                      <span className="text-sm font-semibold text-white flex-1">{b.name}</span>
                      <ChevronRight size={15} color="rgba(255,255,255,0.25)" />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === "confirm" && !done && chosen && (
              <motion.div key="confirm" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
                className="space-y-4">
                {/* Banque choisie */}
                <div className="flex items-center gap-3 p-4 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: chosen.color + "22", border: `1px solid ${chosen.color}44` }}>
                    {chosen.icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{chosen.name}</p>
                    <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>Connexion sécurisée · Lecture seule</p>
                  </div>
                </div>

                {/* IBAN */}
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                    IBAN du compte à connecter
                  </label>
                  <input value={iban} onChange={e => setIban(e.target.value.toUpperCase())}
                    placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                    className="w-full rounded-2xl px-4 py-3 text-sm font-mono text-white outline-none transition-all"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                    onFocus={e => e.currentTarget.style.borderColor = GOLD + "55"}
                    onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
                  />
                </div>

                {/* Note sécurité */}
                <div className="flex gap-2.5 p-3.5 rounded-2xl"
                  style={{ background: `${GOLD}0A`, border: `1px solid ${GOLD}25` }}>
                  <span className="text-base shrink-0">🔒</span>
                  <p className="text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Tes données sont chiffrées. Finéa n'a qu'un accès en lecture seule — aucun virement possible.
                  </p>
                </div>

                {/* Bouton */}
                <motion.button whileTap={{ scale: 0.97 }} onClick={confirm}
                  disabled={!iban.trim()}
                  className="w-full py-4 rounded-2xl font-bold text-sm disabled:opacity-40 transition"
                  style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DIM})`, color: "#050A14" }}>
                  Connecter ma banque
                </motion.button>
              </motion.div>
            )}

            {done && (
              <motion.div key="done" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-3 py-10">
                <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl"
                  style={{ background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)" }}>
                  ✅
                </div>
                <p className="text-base font-bold text-white">{chosen?.name} connectée !</p>
                <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Tes crédits seront synchronisés automatiquement.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function CreditPage() {
  const router = useRouter()
  const [showConso,   setShowConso]   = useState(false)
  const [showImmo,    setShowImmo]    = useState(false)
  const [showAddBank, setShowAddBank] = useState(false)

  return (
    <div className="w-full h-full flex flex-col bg-[#050A14] text-slate-50">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-3 border-b border-white/[0.06] shrink-0">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.back()}
          className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: GOLD }}>
          <ArrowLeft size={17} />
        </motion.button>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Finances</p>
          <h1 className="text-base font-bold text-white">Crédits 💳</h1>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-5 pb-6 space-y-5">

        {/* Carte total crédit */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-5"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-[10px] uppercase tracking-[0.18em] mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
            Encours total
          </p>
          <p className="text-4xl font-black text-white mb-1">0,00 €</p>
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
            Aucun crédit en cours · Ajoute ta banque pour synchroniser
          </p>
        </motion.div>

        {/* Simulateurs */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] mb-3 px-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            Simulateurs
          </p>
          <div className="space-y-2.5">
            {[
              { label: "Crédit consommation", sub: "Calcule ta mensualité et le coût total", emoji: "🪙", action: () => setShowConso(true) },
              { label: "Crédit immobilier",   sub: "Simule ton prêt avec assurance",          emoji: "🏡", action: () => setShowImmo(true)  },
            ].map(({ label, sub, emoji, action }) => (
              <motion.button key={label} whileTap={{ scale: 0.97 }} onClick={action}
                className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-left"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0"
                  style={{ background: `${GOLD}15`, border: `1px solid ${GOLD}30` }}>
                  {emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>{sub}</p>
                </div>
                <ChevronRight size={15} color="rgba(255,255,255,0.25)" />
              </motion.button>
            ))}
          </div>
        </div>

        {/* Banques */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] mb-3 px-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            Mes banques
          </p>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowAddBank(true)}
            className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-left"
            style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${GOLD}30` }}>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0"
              style={{ background: `${GOLD}15`, border: `1px solid ${GOLD}30` }}>
              ➕
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: GOLD }}>Ajouter une banque</p>
              <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>Synchronise tes crédits automatiquement</p>
            </div>
            <ChevronRight size={15} color={GOLD + "80"} />
          </motion.button>
        </div>

      </div>

      <AnimatePresence>
        {showConso   && <SimulateurConso    onClose={() => setShowConso(false)}   />}
        {showImmo    && <SimulateurImmo     onClose={() => setShowImmo(false)}    />}
        {showAddBank && <AjouterBanqueModal onClose={() => setShowAddBank(false)} />}
      </AnimatePresence>
    </div>
  )
}
