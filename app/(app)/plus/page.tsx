"use client"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, RefreshCw, ChevronDown, Search, X, TrendingUp, TrendingDown } from "lucide-react"
import { GOLD, GOLD_DIM, BG_CARD, BORDER, GREEN, RED } from "@/lib/theme"

const tabs = [
  { id: "devises", label: "Devises" },
  { id: "epargne", label: "Epargne" },
  { id: "interets", label: "Interets" },
  { id: "calendrier", label: "Calendrier" },
  { id: "credit", label: "Credit" },
]

export default function Plus() {
  const router = useRouter()
  const [active, setActive] = useState("devises")

  return (
    <div className="w-full h-full flex flex-col px-5 pt-10 pb-4">
      <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.back()}
        className="flex items-center gap-2 mb-6" style={{ color: GOLD }}
        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
        <ArrowLeft size={18} />
        <span className="text-sm font-semibold">Retour</span>
      </motion.button>

      <h1 className="text-[26px] font-bold text-white mb-4">Outils & Simulateurs</h1>

      {/* Tabs scroll */}
      <div className="flex gap-2 overflow-x-auto mb-5 pb-1 shrink-0">
        {tabs.map((t) => (
          <motion.button key={t.id} whileTap={{ scale: 0.93 }} onClick={() => setActive(t.id)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0"
            style={{
              background: active === t.id ? GOLD : BG_CARD,
              color: active === t.id ? "#050A14" : "rgba(255,255,255,0.5)",
              border: `1px solid ${active === t.id ? GOLD : BORDER}`,
            }}>
            {t.label}
          </motion.button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div key={active}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}>

            {active === "devises" && <TabDevises />}
            {active === "epargne" && <TabEpargne />}
            {active === "interets" && <TabInterets />}
            {active === "calendrier" && <TabCalendrier />}
            {active === "credit" && <TabCredit />}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

const CURRENCIES = [
  { code: "EUR", name: "Euro",              flag: "🇪🇺", symbol: "€"  },
  { code: "USD", name: "Dollar américain",  flag: "🇺🇸", symbol: "$"  },
  { code: "GBP", name: "Livre sterling",    flag: "🇬🇧", symbol: "£"  },
  { code: "CHF", name: "Franc suisse",      flag: "🇨🇭", symbol: "CHF"},
  { code: "JPY", name: "Yen japonais",      flag: "🇯🇵", symbol: "¥"  },
  { code: "CAD", name: "Dollar canadien",   flag: "🇨🇦", symbol: "CA$"},
  { code: "AUD", name: "Dollar australien", flag: "🇦🇺", symbol: "A$" },
  { code: "CNY", name: "Yuan chinois",      flag: "🇨🇳", symbol: "¥"  },
  { code: "INR", name: "Roupie indienne",   flag: "🇮🇳", symbol: "₹"  },
  { code: "BRL", name: "Réal brésilien",    flag: "🇧🇷", symbol: "R$" },
  { code: "MXN", name: "Peso mexicain",     flag: "🇲🇽", symbol: "$"  },
  { code: "SGD", name: "Dollar singapourien",flag:"🇸🇬", symbol: "S$" },
  { code: "HKD", name: "Dollar de HK",      flag: "🇭🇰", symbol: "HK$"},
  { code: "NOK", name: "Couronne norvégienne",flag:"🇳🇴",symbol: "kr" },
  { code: "SEK", name: "Couronne suédoise", flag: "🇸🇪", symbol: "kr" },
  { code: "DKK", name: "Couronne danoise",  flag: "🇩🇰", symbol: "kr" },
  { code: "PLN", name: "Zloty polonais",    flag: "🇵🇱", symbol: "zł" },
  { code: "TRY", name: "Livre turque",      flag: "🇹🇷", symbol: "₺"  },
  { code: "MAD", name: "Dirham marocain",   flag: "🇲🇦", symbol: "د.م"},
  { code: "TND", name: "Dinar tunisien",    flag: "🇹🇳", symbol: "DT" },
  { code: "AED", name: "Dirham émirien",    flag: "🇦🇪", symbol: "د.إ"},
  { code: "ZAR", name: "Rand sud-africain", flag: "🇿🇦", symbol: "R"  },
  { code: "KRW", name: "Won sud-coréen",    flag: "🇰🇷", symbol: "₩"  },
  { code: "THB", name: "Baht thaïlandais",  flag: "🇹🇭", symbol: "฿"  },
]

// Taux fixes de secours (base EUR) si API indisponible
const FALLBACK_RATES: Record<string, number> = {
  EUR:1,    USD:1.089, GBP:0.857, CHF:0.956, JPY:163.5, CAD:1.476,
  AUD:1.645,CNY:7.879, INR:90.6,  BRL:5.39,  MXN:18.62, SGD:1.456,
  HKD:8.51, NOK:11.62, SEK:11.34, DKK:7.46,  PLN:4.27,  TRY:35.1,
  MAD:10.83,TND:3.36,  AED:3.998, ZAR:20.12, KRW:1448,  THB:38.2,
}

function CurrencyPicker({ value, onChange, label }: {
  value: string; onChange: (c: string) => void; label: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const cur = CURRENCIES.find(c => c.code === value)!
  const filtered = CURRENCIES.filter(c =>
    c.code.includes(search.toUpperCase()) || c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
        style={{ background: "rgba(255,255,255,0.08)", border: `1px solid ${BORDER}` }}>
        <span className="text-base">{cur.flag}</span>
        <span className="text-xs font-bold text-white">{cur.code}</span>
        <ChevronDown size={11} color="rgba(255,255,255,0.4)" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="absolute inset-0 z-40" style={{ background: "rgba(0,0,0,0.55)" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setOpen(false); setSearch("") }} />
            <motion.div className="absolute inset-x-0 bottom-0 z-50 rounded-t-3xl flex flex-col"
              style={{ background: "#0d1929", border: `1px solid ${BORDER}`, maxHeight: "70%" }}
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}>
              <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
                <p className="text-sm font-bold text-white">{label}</p>
                <button onClick={() => { setOpen(false); setSearch("") }}>
                  <X size={18} color="rgba(255,255,255,0.4)" />
                </button>
              </div>
              <div className="px-4 pb-3 shrink-0">
                <div className="flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}` }}>
                  <Search size={13} color="rgba(255,255,255,0.35)" />
                  <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher une devise..."
                    className="flex-1 bg-transparent text-xs text-white placeholder-white/30 outline-none" />
                </div>
              </div>
              <div className="overflow-y-auto flex-1 px-4 pb-6">
                {filtered.map(c => (
                  <button key={c.code} onClick={() => { onChange(c.code); setOpen(false); setSearch("") }}
                    className="w-full flex items-center gap-3 py-3 transition-all"
                    style={{ borderBottom: `1px solid ${BORDER}`, background: c.code === value ? `${GOLD}10` : "transparent" }}>
                    <span className="text-xl">{c.flag}</span>
                    <div className="flex-1 text-left">
                      <p className="text-xs font-bold text-white">{c.code}</p>
                      <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.38)" }}>{c.name}</p>
                    </div>
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{c.symbol}</span>
                    {c.code === value && <span className="text-xs font-bold" style={{ color: GOLD }}>✓</span>}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function TabDevises() {
  const [amount, setAmount]   = useState("100")
  const [from, setFrom]       = useState("EUR")
  const [to, setTo]           = useState("USD")
  const [rates, setRates]     = useState<Record<string, number>>(FALLBACK_RATES)
  const [lastUpdate, setLastUpdate] = useState<string>("")
  const [fetching, setFetching]     = useState(false)

  const fetchRates = useCallback(async () => {
    setFetching(true)
    try {
      // API gratuite sans clé
      const res = await fetch("https://open.er-api.com/v6/latest/EUR")
      if (res.ok) {
        const data = await res.json()
        if (data.rates) {
          setRates({ EUR: 1, ...data.rates })
          setLastUpdate(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }))
        }
      }
    } catch {
      // garde les taux fallback
    } finally {
      setFetching(false)
    }
  }, [])

  useEffect(() => { fetchRates() }, [])

  function getRate(a: string, b: string) {
    const inEur = rates[a] ? 1 / rates[a] : 1
    return (inEur * (rates[b] ?? 1))
  }

  const rate     = getRate(from, to)
  const amountNum = parseFloat(amount.replace(",", ".")) || 0
  const converted = (amountNum * rate).toLocaleString("fr-FR", { maximumFractionDigits: 4 })

  function swap() {
    setFrom(to)
    setTo(from)
    setAmount((amountNum * rate).toFixed(2))
  }

  const popularPairs = [
    ["EUR","USD"],["EUR","GBP"],["EUR","CHF"],["EUR","JPY"],
    ["USD","GBP"],["GBP","EUR"],["EUR","MAD"],["EUR","TND"],
  ]

  const fromCur = CURRENCIES.find(c => c.code === from)!
  const toCur   = CURRENCIES.find(c => c.code === to)!

  return (
    <div className="flex flex-col gap-4 pb-6 relative">

      {/* Convertisseur principal */}
      <div className="rounded-3xl p-5" style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-white">Convertisseur</p>
          <button onClick={fetchRates} className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
            style={{ background: "rgba(255,255,255,0.06)" }}>
            <motion.div animate={{ rotate: fetching ? 360 : 0 }} transition={{ duration: 0.8, repeat: fetching ? Infinity : 0 }}>
              <RefreshCw size={12} color={GOLD} />
            </motion.div>
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
              {lastUpdate ? `màj ${lastUpdate}` : "Taux"}
            </span>
          </button>
        </div>

        {/* Champ DE */}
        <div className="rounded-2xl p-4 mb-3" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}` }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>De</p>
            <CurrencyPicker value={from} onChange={setFrom} label="Convertir depuis" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg" style={{ color: "rgba(255,255,255,0.3)" }}>{fromCur.symbol}</span>
            <input
              className="flex-1 bg-transparent text-3xl font-black text-white outline-none"
              value={amount}
              onChange={e => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
              inputMode="decimal"
              placeholder="0"
            />
          </div>
        </div>

        {/* Bouton swap */}
        <div className="flex justify-center -my-1.5 relative z-10">
          <motion.button whileTap={{ scale: 0.9, rotate: 180 }} onClick={swap}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DIM})` }}>
            <RefreshCw size={14} color="#050A14" />
          </motion.button>
        </div>

        {/* Champ VERS */}
        <div className="rounded-2xl p-4 mt-1.5" style={{ background: `${GOLD}0d`, border: `1px solid ${GOLD}30` }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>Vers</p>
            <CurrencyPicker value={to} onChange={setTo} label="Convertir vers" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg" style={{ color: GOLD + "88" }}>{toCur.symbol}</span>
            <p className="text-3xl font-black" style={{ color: GOLD }}>{converted}</p>
          </div>
        </div>

        <p className="text-center text-[11px] mt-3" style={{ color: "rgba(255,255,255,0.28)" }}>
          1 {from} = {rate.toFixed(4)} {to}
        </p>
      </div>

      {/* Paires populaires */}
      <div className="rounded-2xl p-4" style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>
        <p className="text-xs font-bold text-white mb-3">Paires populaires</p>
        <div className="space-y-0">
          {popularPairs.map(([a, b], i) => {
            const r = getRate(a, b)
            const ca = CURRENCIES.find(c => c.code === a)!
            const cb = CURRENCIES.find(c => c.code === b)!
            // Variation simulée pour l'affichage
            const variation = ((r - FALLBACK_RATES[b] / FALLBACK_RATES[a]) / (FALLBACK_RATES[b] / FALLBACK_RATES[a]) * 100)
            const isUp = variation >= 0
            return (
              <button key={i} onClick={() => { setFrom(a); setTo(b) }}
                className="w-full flex items-center justify-between py-3 transition-all active:bg-white/5"
                style={{ borderBottom: i < popularPairs.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{ca.flag}{cb.flag}</span>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white">{a}/{b}</p>
                    <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{ca.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-white">{r.toFixed(4)}</p>
                  <div className="flex items-center gap-0.5 justify-end">
                    {isUp ? <TrendingUp size={10} color={GREEN} /> : <TrendingDown size={10} color={RED} />}
                    <p className="text-[10px]" style={{ color: isUp ? GREEN : RED }}>
                      {isUp ? "+" : ""}{variation.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Toutes les devises vs EUR */}
      <div className="rounded-2xl p-4" style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>
        <p className="text-xs font-bold text-white mb-3">
          {amountNum > 0 ? `${amountNum} ${from} =` : "Toutes les devises"} vs {from}
        </p>
        <div className="space-y-0">
          {CURRENCIES.filter(c => c.code !== from).map((c, i, arr) => {
            const r = getRate(from, c.code)
            const val = amountNum > 0 ? (amountNum * r) : r
            return (
              <button key={c.code} onClick={() => setTo(c.code)}
                className="w-full flex items-center justify-between py-2.5 transition-all active:bg-white/5"
                style={{ borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : "none",
                  background: c.code === to ? `${GOLD}08` : "transparent" }}>
                <div className="flex items-center gap-2.5">
                  <span>{c.flag}</span>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-white">{c.code}</p>
                    <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{c.name}</p>
                  </div>
                </div>
                <p className="text-xs font-bold" style={{ color: c.code === to ? GOLD : "rgba(255,255,255,0.7)" }}>
                  {val.toLocaleString("fr-FR", { maximumFractionDigits: val < 10 ? 4 : 2 })} {c.symbol}
                </p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function TabEpargne() {
  const [mensualite, setMensualite] = useState("200")
  const [duree, setDuree] = useState("36")
  const [taux, setTaux] = useState("3")

  const m = parseFloat(mensualite) || 0
  const n = parseFloat(duree) || 0
  const r = (parseFloat(taux) || 0) / 100 / 12
  const total = m * n
  const avecInterets = r > 0
    ? m * ((Math.pow(1 + r, n) - 1) / r)
    : total
  const gains = avecInterets - total

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="rounded-3xl p-5" style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>
        <p className="text-sm font-semibold text-white mb-4">Simulateur d'epargne</p>
        {[
          { label: "Versement mensuel (EUR)", val: mensualite, set: setMensualite },
          { label: "Duree (mois)", val: duree, set: setDuree },
          { label: "Taux annuel (%)", val: taux, set: setTaux },
        ].map(({ label, val, set }) => (
          <div key={label} className="mb-3">
            <label className="text-[11px] mb-1.5 block" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</label>
            <input type="number" value={val} onChange={e => set(e.target.value)}
              className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3 text-sm font-semibold text-white outline-none" />
          </div>
        ))}
        <div className="mt-4 rounded-2xl p-4 space-y-2" style={{ background: "rgba(255,255,255,0.04)" }}>
          <div className="flex justify-between text-xs">
            <span style={{ color: "rgba(255,255,255,0.5)" }}>Capital verse :</span>
            <span className="font-bold text-white">{total.toFixed(0)} EUR</span>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: "rgba(255,255,255,0.5)" }}>Interets gagnes :</span>
            <span className="font-bold" style={{ color: GREEN }}>{gains.toFixed(0)} EUR</span>
          </div>
          <div className="flex justify-between text-sm font-bold pt-2 border-t border-white/10">
            <span className="text-white">Total final :</span>
            <span style={{ color: GOLD }}>{avecInterets.toFixed(0)} EUR</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function TabInterets() {
  const [capital, setCapital] = useState("10000")
  const [taux, setTaux] = useState("3")
  const [duree, setDuree] = useState("10")

  const C = parseFloat(capital) || 0
  const r = (parseFloat(taux) || 0) / 100
  const n = parseFloat(duree) || 0
  const simple = C * (1 + r * n)
  const compose = C * Math.pow(1 + r, n)

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="rounded-3xl p-5" style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>
        <p className="text-sm font-semibold text-white mb-4">Interets simples vs composes</p>
        {[
          { label: "Capital initial (EUR)", val: capital, set: setCapital },
          { label: "Taux annuel (%)", val: taux, set: setTaux },
          { label: "Duree (ans)", val: duree, set: setDuree },
        ].map(({ label, val, set }) => (
          <div key={label} className="mb-3">
            <label className="text-[11px] mb-1.5 block" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</label>
            <input type="number" value={val} onChange={e => set(e.target.value)}
              className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3 text-sm font-semibold text-white outline-none" />
          </div>
        ))}
        <div className="mt-4 space-y-3">
          {[["Interets simples", simple, "#60a5fa"], ["Interets composes", compose, GOLD]].map(([label, val, color]) => (
            <div key={label as string} className="rounded-2xl p-3 flex justify-between items-center"
              style={{ background: "rgba(255,255,255,0.04)", border: `1px solid rgba(255,255,255,0.07)` }}>
              <span className="text-xs text-white">{label as string}</span>
              <div className="text-right">
                <p className="text-base font-black" style={{ color: color as string }}>{(val as number).toFixed(0)} EUR</p>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>+{((val as number) - C).toFixed(0)} EUR</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TabCalendrier() {
  const events = [
    { date: "15 Jan", label: "Virement automatique Livret A", amount: "+200 EUR", color: GREEN },
    { date: "28 Jan", label: "Loyer", amount: "-850 EUR", color: RED },
    { date: "1 Fev", label: "Salaire", amount: "+2 400 EUR", color: GREEN },
    { date: "5 Fev", label: "Abonnements (Netflix, Spotify...)", amount: "-28 EUR", color: RED },
    { date: "10 Fev", label: "Assurance habitation", amount: "-42 EUR", color: RED },
    { date: "15 Fev", label: "Virement automatique Livret A", amount: "+200 EUR", color: GREEN },
  ]
  return (
    <div className="flex flex-col gap-3 pb-4">
      <div className="rounded-3xl p-5" style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>
        <p className="text-sm font-semibold text-white mb-4">Prochains evenements financiers</p>
        {events.map((e, i) => (
          <div key={i} className="flex items-center justify-between py-2.5" style={{ borderBottom: i < events.length - 1 ? `1px solid ${BORDER}` : "none" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{ background: `${e.color}15`, color: e.color }}>
                {e.date.split(" ")[0]}<br />{e.date.split(" ")[1]}
              </div>
              <p className="text-xs text-white max-w-[150px] leading-snug">{e.label}</p>
            </div>
            <span className="text-xs font-bold shrink-0" style={{ color: e.color }}>{e.amount}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TabCredit() {
  const [montant, setMontant] = useState("15000")
  const [taux, setTaux] = useState("4.5")
  const [duree, setDuree] = useState("48")

  const P = parseFloat(montant) || 0
  const r = (parseFloat(taux) || 0) / 100 / 12
  const n = parseFloat(duree) || 0
  const mensualite = r > 0
    ? (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
    : P / n
  const totalRembourse = mensualite * n
  const coutCredit = totalRembourse - P

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="rounded-3xl p-5" style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>
        <p className="text-sm font-semibold text-white mb-4">Simulateur de credit</p>
        {[
          { label: "Montant emprunte (EUR)", val: montant, set: setMontant },
          { label: "Taux annuel (%)", val: taux, set: setTaux },
          { label: "Duree (mois)", val: duree, set: setDuree },
        ].map(({ label, val, set }) => (
          <div key={label} className="mb-3">
            <label className="text-[11px] mb-1.5 block" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</label>
            <input type="number" value={val} onChange={e => set(e.target.value)}
              className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3 text-sm font-semibold text-white outline-none" />
          </div>
        ))}
        <div className="mt-4 rounded-2xl p-4 space-y-2" style={{ background: "rgba(255,255,255,0.04)" }}>
          <div className="flex justify-between text-xs">
            <span style={{ color: "rgba(255,255,255,0.5)" }}>Mensualite :</span>
            <span className="font-bold text-white">{mensualite.toFixed(2)} EUR/mois</span>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: "rgba(255,255,255,0.5)" }}>Total rembourse :</span>
            <span className="font-bold text-white">{totalRembourse.toFixed(0)} EUR</span>
          </div>
          <div className="flex justify-between text-sm font-bold pt-2 border-t border-white/10">
            <span style={{ color: RED }}>Cout total du credit :</span>
            <span style={{ color: RED }}>{coutCredit.toFixed(0)} EUR</span>
          </div>
        </div>
      </div>
    </div>
  )
}