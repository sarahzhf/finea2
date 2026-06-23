"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"

// ——— Types ———
type ItemType = "income" | "essential" | "fun" | "invest"
type Screen = "intro" | "playing" | "result"

interface ItemTemplate {
  type: ItemType
  emoji: string
  label: string
  amount: number
  lesson: string
}

interface GameItem extends ItemTemplate {
  id: number
  lane: 0 | 1 | 2
  y: number
}

interface Collected {
  type: ItemType
  emoji: string
  label: string
  amount: number
  lesson: string
}

// ——— Game config ———
<<<<<<< HEAD
const TICK_MS = 55
const ITEM_SPEED = 0.95
const PLAYER_Y = 80
const HIT_ZONE = 9
const TOTAL_SPAWNS = 22
const SPAWN_EVERY = 12
=======
const TICK_MS = 48
const ITEM_SPEED = 1.55
const PLAYER_Y = 80
const HIT_ZONE = 9
const TOTAL_SPAWNS = 22
const SPAWN_EVERY = 9
>>>>>>> c2ce98782d34bda170bcf3571c6142480a36998b

const LANE_FAR = [37, 50, 63]
const LANE_NEAR = [16, 50, 84]

function getLaneX(lane: 0 | 1 | 2, y: number): number {
  const t = Math.max(0, Math.min(1, y / 100))
  return LANE_FAR[lane] * (1 - t) + LANE_NEAR[lane] * t
}
function getScale(y: number): number {
  return Math.max(0.14, 0.14 + (y / 100) * 0.96)
}

// ——— Item pool ———
const ITEMS: ItemTemplate[] = [
  { type: "income",    emoji: "💰", label: "Salaire",      amount:  1800, lesson: "Ton salaire = ton point de départ. Tous tes arbitrages découlent de ce chiffre." },
  { type: "income",    emoji: "💵", label: "Remb. ami",    amount:    50, lesson: "Note ce qu'on te doit. Même 50 € non réclamés, c'est 50 € perdus sur l'année." },
  { type: "income",    emoji: "🎁", label: "Prime",        amount:   200, lesson: "Les revenus exceptionnels sont idéaux pour booster l'épargne d'un coup." },
  { type: "essential", emoji: "🏠", label: "Loyer",        amount:  -750, lesson: "Règle des 33 % : le loyer idéal ne dépasse pas un tiers de ton salaire net." },
  { type: "essential", emoji: "⚡", label: "Électricité",  amount:   -80, lesson: "Les charges fixes forment ton socle incompressible. Réduis-les une fois = économie 12 mois." },
  { type: "essential", emoji: "🚌", label: "Transports",   amount:   -90, lesson: "Transport = souvent le 2ᵉ poste. L'abonnement annuel coûte 20-30 % moins cher que mensuel." },
  { type: "essential", emoji: "🍎", label: "Courses",      amount:  -200, lesson: "150-200 €/mois par personne est une bonne base. La liste écrite réduit les achats impulsifs de 25 %." },
  { type: "fun",       emoji: "🍕", label: "Livraison",    amount:   -35, lesson: "3 livraisons/semaine = 420 €/mois. Cuisiner 5 repas soi-même économise ~250 €/mois." },
  { type: "fun",       emoji: "👗", label: "Shopping",     amount:  -120, lesson: "Attendre 48h avant d'acheter réduit les achats impulsifs de 70 %. Essaie." },
  { type: "fun",       emoji: "🎬", label: "Abonnements",  amount:   -45, lesson: "L'abonnement inutilisé moyen coûte 300 €/an. Audite tes abos 2 fois par an." },
  { type: "fun",       emoji: "🥂", label: "Sorties",      amount:   -60, lesson: "Budgéter ses loisirs (ex : 100 € fixe/mois) évite culpabilité ET dépassements." },
  { type: "invest",    emoji: "📚", label: "Formation",    amount:  -150, lesson: "+1 % de compétence peut valoir +5 % de salaire. Une bonne formation se rembourse en 6 mois." },
  { type: "invest",    emoji: "📈", label: "Épargne",      amount:  -100, lesson: "Épargner 10 % avant de dépenser = règle d'or des finances perso. Automatise-le." },
  { type: "invest",    emoji: "🏋️", label: "Sport",        amount:   -50, lesson: "Santé = premier capital. L'activité physique améliore productivité et revenus long terme." },
  { type: "invest",    emoji: "🔧", label: "Matériel pro", amount:   -80, lesson: "Le bon outil multiplie la productivité. Investir dans ses outils est souvent rentable." },
]

const TYPE_CARD: Record<ItemType, string> = {
  income:    "bg-emerald-500 border-emerald-200/30 shadow-[0_0_22px_rgba(16,185,129,0.9)]",
  essential: "bg-amber-500  border-amber-200/30   shadow-[0_0_22px_rgba(245,158,11,0.9)]",
  fun:       "bg-rose-500   border-rose-200/30     shadow-[0_0_22px_rgba(239,68,68,0.9)]",
  invest:    "bg-sky-500    border-sky-200/30      shadow-[0_0_22px_rgba(14,165,233,0.9)]",
}
const TYPE_FLASH: Record<ItemType, string> = {
  income: "rgba(16,185,129,0.22)", essential: "rgba(245,158,11,0.22)",
  fun: "rgba(239,68,68,0.18)", invest: "rgba(14,165,233,0.22)",
}
const TYPE_LABEL: Record<ItemType, string> = {
  income: "Revenus", essential: "Essentiels", fun: "Plaisirs", invest: "Investissements",
}
const TYPE_COLOR: Record<ItemType, string> = {
  income: "text-emerald-400", essential: "text-amber-400", fun: "text-rose-400", invest: "text-sky-400",
}

// ——— Item card rendered on road ———
function RoadItem({ item }: { item: GameItem }) {
  const x = getLaneX(item.lane, item.y)
  const scale = getScale(item.y)
  const opacity = Math.max(0.3, Math.min(1, item.y / 30))
  return (
    <div
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${item.y}%`,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity,
        transition: `left ${TICK_MS}ms linear, top ${TICK_MS}ms linear, transform ${TICK_MS}ms linear`,
        zIndex: Math.round(item.y),
        willChange: "transform, left, top",
      }}
    >
      <div className={`${TYPE_CARD[item.type]} border rounded-[18px] px-2.5 py-1.5 text-center min-w-[64px]`}>
        <div className="text-2xl leading-tight">{item.emoji}</div>
        <div className="text-white font-bold text-[11px] leading-tight mt-0.5">{item.label}</div>
        <div className="text-white/80 text-[10px] font-semibold">
          {item.amount > 0 ? `+${item.amount}€` : `${item.amount}€`}
        </div>
      </div>
    </div>
  )
}

// ——— Main page ———
export default function BillRushPage() {
  const router = useRouter()
  const [screen, setScreen] = useState<Screen>("intro")

  const [items, setItems] = useState<GameItem[]>([])
  const [playerLane, setPlayerLane] = useState<0 | 1 | 2>(1)
  const [balance, setBalance] = useState(400)
  const [monthProgress, setMonthProgress] = useState(0)
  const [collectedList, setCollectedList] = useState<Collected[]>([])
  const [toast, setToast] = useState<GameItem | null>(null)
  const [flash, setFlash] = useState("")
  const [playerBounce, setPlayerBounce] = useState(false)

  const runningRef = useRef(false)
  const laneRef = useRef<0 | 1 | 2>(1)
  const itemsRef = useRef<GameItem[]>([])
  const balanceRef = useRef(400)
  const tickRef = useRef(0)
  const spawnedRef = useRef(0)
  const collectedRef = useRef<Collected[]>([])
  const nextIdRef = useRef(1)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => { laneRef.current = playerLane }, [playerLane])

  const spawnItem = () => {
    const lane = Math.floor(Math.random() * 3) as 0 | 1 | 2
    const prog = spawnedRef.current / TOTAL_SPAWNS
    let pool = ITEMS
    if (spawnedRef.current === 0) pool = ITEMS.filter(i => i.label === "Salaire")
    else if (prog < 0.2) pool = ITEMS.filter(i => i.type === "income" || i.type === "essential")
    else if (prog > 0.7) pool = ITEMS.filter(i => i.type === "fun" || i.type === "invest")
    const tpl = pool[Math.floor(Math.random() * pool.length)]
    itemsRef.current = [...itemsRef.current, { ...tpl, id: nextIdRef.current++, lane, y: -10 }]
    spawnedRef.current++
  }

  const tick = useCallback(() => {
    tickRef.current++
    if (tickRef.current % SPAWN_EVERY === 0 && spawnedRef.current < TOTAL_SPAWNS) spawnItem()

    const kept: GameItem[] = []
    const hits: GameItem[] = []

    for (const item of itemsRef.current) {
      const ny = item.y + ITEM_SPEED
      const hit = ny >= PLAYER_Y - HIT_ZONE && ny <= PLAYER_Y + HIT_ZONE && item.lane === laneRef.current
      if (hit) {
        hits.push({ ...item, y: ny })
      } else if (ny < 110) {
        kept.push({ ...item, y: ny })
      }
    }

    itemsRef.current = kept
    let delta = 0
    for (const h of hits) {
      delta += h.amount
      collectedRef.current = [...collectedRef.current, { type: h.type, emoji: h.emoji, label: h.label, amount: h.amount, lesson: h.lesson }]
      setToast(h)
      setTimeout(() => setToast(t => t?.id === h.id ? null : t), 1500)
      setFlash(TYPE_FLASH[h.type])
      setTimeout(() => setFlash(""), 220)
      setPlayerBounce(true)
      setTimeout(() => setPlayerBounce(false), 300)
    }
    balanceRef.current += delta

    const prog = Math.min(1, tickRef.current / (TOTAL_SPAWNS * SPAWN_EVERY + 25))

    setItems([...itemsRef.current])
    if (delta !== 0) setBalance(balanceRef.current)
    setMonthProgress(prog)
    if (hits.length > 0) setCollectedList([...collectedRef.current])

    if (spawnedRef.current >= TOTAL_SPAWNS && itemsRef.current.length === 0 && prog > 0.95) {
      runningRef.current = false
      if (intervalRef.current) clearInterval(intervalRef.current)
      setTimeout(() => setScreen("result"), 700)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startGame = useCallback(() => {
    itemsRef.current = []; balanceRef.current = 400; tickRef.current = 0
    spawnedRef.current = 0; collectedRef.current = []; nextIdRef.current = 1
    setItems([]); setPlayerLane(1); laneRef.current = 1
    setBalance(400); setMonthProgress(0); setCollectedList([])
    setToast(null); setFlash(""); setPlayerBounce(false)
    setScreen("playing")
    runningRef.current = true
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(tick, TICK_MS)
  }, [tick])

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  useEffect(() => {
    if (screen !== "playing") return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A")
        setPlayerLane(p => Math.max(0, p - 1) as 0 | 1 | 2)
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D")
        setPlayerLane(p => Math.min(2, p + 1) as 0 | 1 | 2)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [screen])

  // ——— Result computations ———
  const byType = {
    income:    collectedList.filter(c => c.type === "income"),
    essential: collectedList.filter(c => c.type === "essential"),
    fun:       collectedList.filter(c => c.type === "fun"),
    invest:    collectedList.filter(c => c.type === "invest"),
  }
  const sum = (arr: Collected[]) => arr.reduce((s, c) => s + c.amount, 0)
  const absSum = (arr: Collected[]) => arr.reduce((s, c) => s + Math.abs(c.amount), 0)

  const getProfile = () => {
    const f = absSum(byType.fun), iv = absSum(byType.invest), es = absSum(byType.essential)
    const total = f + iv + es || 1
    if (iv / total > 0.45) return { icon: "📈", label: "Investisseur", color: "text-sky-400", desc: "Tu priorises l'avenir. Attention à ne pas oublier de profiter du présent." }
    if (f / total > 0.5) return { icon: "🎉", label: "Hédoniste", color: "text-rose-400", desc: "Tu profites du moment. Risque : pas assez de réserves pour les imprévus." }
    if (es / total > 0.55) return { icon: "🧱", label: "Pragmatique", color: "text-amber-400", desc: "Tu couvres le nécessaire avant tout. Solide, mais pense aussi à ton futur." }
    return { icon: "⚖️", label: "Équilibré", color: "text-emerald-400", desc: "Tu trouves un bon équilibre entre plaisir, nécessaire et investissement." }
  }

  const lessons = Array.from(new Map(collectedList.map(c => [c.lesson, c])).values()).slice(0, 4)
  const balanceColor = balance < 0 ? "text-rose-400" : balance < 300 ? "text-amber-400" : "text-emerald-400"
  const playerX = getLaneX(playerLane, PLAYER_Y)

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-[#020617] to-[#0b1120] text-slate-50 overflow-hidden">
      <AnimatePresence mode="wait">

        {/* ——— INTRO ——— */}
        {screen === "intro" && (
          <motion.div key="intro"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-6 h-full overflow-y-auto">

            <button onClick={() => router.push("/missions")}
              className="self-start w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white transition text-xl leading-none">
              ‹
            </button>

            <div className="text-center space-y-3">
              <div className="text-6xl mb-2">🏎️</div>
              <h1 className="text-4xl font-black text-white">Bill Rush</h1>
              <p className="text-slate-400 text-sm max-w-xs mx-auto leading-relaxed">
                Un mois défile devant toi. Attrape les bons éléments, esquive les tentations — ou assume leurs conséquences.
              </p>
            </div>

            {/* Legend */}
            <div className="w-full max-w-sm grid grid-cols-2 gap-3">
              {(["income","essential","fun","invest"] as ItemType[]).map(type => (
                <div key={type} className="bg-white/[0.05] border border-white/[0.07] rounded-2xl px-4 py-3">
                  <p className={`text-xs font-bold mb-1 ${TYPE_COLOR[type]}`}>{TYPE_LABEL[type]}</p>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    {type === "income" && "Encaisse-les toujours en priorité."}
                    {type === "essential" && "Payer = rester à flot. Esquiver = impayés."}
                    {type === "fun" && "Plaisir court terme — pèse le coût."}
                    {type === "invest" && "Coûte maintenant, rapporte plus tard."}
                  </p>
                </div>
              ))}
            </div>

            <div className="w-full max-w-sm space-y-3">
              <p className="text-[11px] text-slate-500 text-center">← → ou swipe pour changer de voie</p>
              <button onClick={startGame}
                className="w-full py-4 rounded-2xl bg-[#eccc68] text-[#060d1a] font-black text-base shadow-[0_8px_32px_rgba(236,204,104,0.3)] hover:bg-[#f5da80] active:scale-[0.98] transition">
                Démarrer le mois →
              </button>
            </div>
          </motion.div>
        )}

        {/* ——— PLAYING ——— */}
        {screen === "playing" && (
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col h-full"
            style={{ backgroundColor: flash ? flash : undefined, transition: "background-color 0.1s" }}>

            {/* Stats bar */}
            <div className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0">
              <button onClick={() => { runningRef.current = false; if (intervalRef.current) clearInterval(intervalRef.current); router.push("/missions") }}
                className="w-9 h-9 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white transition text-lg leading-none">
                ‹
              </button>
              <div className="text-center">
                <p className="text-[9px] uppercase tracking-widest text-slate-500">Solde</p>
                <p className={`text-xl font-black ${balanceColor}`}>{balance.toLocaleString("fr-FR")} €</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-slate-500 uppercase tracking-wider">Mois</p>
                <p className="text-sm font-bold text-slate-300">{Math.round(monthProgress * 100)}%</p>
              </div>
            </div>

            {/* Progress */}
            <div className="px-5 mb-1 shrink-0">
              <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div className="h-full bg-[#eccc68]/70 rounded-full" animate={{ width: `${monthProgress * 100}%` }} transition={{ duration: 0.3 }} />
              </div>
            </div>

            {/* Road */}
            <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
              {/* SVG road perspective */}
              <svg
                viewBox="0 0 100 100" preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <linearGradient id="roadBg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#04081a" />
                    <stop offset="100%" stopColor="#0d1b35" />
                  </linearGradient>
                  <linearGradient id="horizGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                    <stop offset="30%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon points="22,0 78,0 100,100 0,100" fill="url(#roadBg)" />
                <rect x="0" y="0" width="100" height="18" fill="url(#horizGlow)" />
                <line x1="50" y1="0" x2="33" y2="100" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" strokeDasharray="4,5" />
                <line x1="50" y1="0" x2="67" y2="100" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" strokeDasharray="4,5" />
                <line x1="22" y1="0" x2="0" y2="100" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
                <line x1="78" y1="0" x2="100" y2="100" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
                <circle cx="50" cy="0" r="8" fill="rgba(59,130,246,0.25)" />
              </svg>

              {/* Items */}
              {items.map(item => <RoadItem key={item.id} item={item} />)}

              {/* Player */}
              <motion.div
                animate={{ left: `${playerX}%` }}
                transition={{ type: "spring", stiffness: 600, damping: 38 }}
                style={{ position: "absolute", bottom: "14%", transform: "translateX(-50%)", zIndex: 100 }}
              >
                <motion.div animate={playerBounce ? { y: [-6, 0] } : {}} transition={{ duration: 0.25 }}>
                  <img
                    src="/icons/fineamascotte.png"
                    alt="Finéa"
                    className="w-14 h-14 sm:w-16 sm:h-16 object-contain drop-shadow-[0_4px_16px_rgba(236,204,104,0.7)]"
                  />
                  <div className="mx-auto w-10 h-2 rounded-full bg-black/40 blur-sm -mt-1" />
                </motion.div>
              </motion.div>

              {/* Lane labels */}
              <div className="absolute bottom-[6%] left-0 right-0 flex justify-between px-4 pointer-events-none">
                {[0, 1, 2].map(l => (
                  <div key={l} style={{ width: "33.3%", textAlign: "center" }}>
                    <span className={`text-[9px] uppercase tracking-widest transition-colors ${playerLane === l ? "text-[#eccc68]" : "text-slate-600"}`}>
                      {l === 0 ? "Gauche" : l === 1 ? "Centre" : "Droite"}
                    </span>
                  </div>
                ))}
              </div>

              {/* Toast */}
              <AnimatePresence>
                {toast && (
                  <motion.div key={toast.id}
                    initial={{ opacity: 0, y: 20, scale: 0.85 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                    <div className={`${TYPE_CARD[toast.type]} border rounded-2xl px-4 py-2 flex items-center gap-2 whitespace-nowrap`}>
                      <span className="text-xl">{toast.emoji}</span>
                      <div>
                        <p className="text-white font-bold text-xs">{toast.label}</p>
                        <p className="text-white/80 text-[10px]">{toast.amount > 0 ? `+${toast.amount} €` : `${toast.amount} €`}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="shrink-0 px-4 pb-4 pt-2 grid grid-cols-3 gap-2">
              <button
                onPointerDown={() => setPlayerLane(p => Math.max(0, p - 1) as 0 | 1 | 2)}
                className="h-12 rounded-2xl bg-white/[0.07] border border-white/[0.1] flex items-center justify-center text-slate-300 font-bold text-xl active:bg-white/[0.14] transition select-none">
                ‹
              </button>
              <div className="h-12 rounded-2xl bg-white/[0.04] border border-dashed border-white/[0.08] flex items-center justify-center text-[9px] text-slate-600 uppercase tracking-wide">
                ← voie →
              </div>
              <button
                onPointerDown={() => setPlayerLane(p => Math.min(2, p + 1) as 0 | 1 | 2)}
                className="h-12 rounded-2xl bg-white/[0.07] border border-white/[0.1] flex items-center justify-center text-slate-300 font-bold text-xl active:bg-white/[0.14] transition select-none">
                ›
              </button>
            </div>
          </motion.div>
        )}

        {/* ——— RESULT ——— */}
        {screen === "result" && (() => {
          const profile = getProfile()
          return (
            <motion.div key="result"
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col px-5 py-6 w-full h-full overflow-y-auto">

              {/* Profile badge */}
              <div className="text-center mb-5">
                <div className="text-5xl mb-2">{profile.icon}</div>
                <h2 className="text-2xl font-black text-white">Profil : <span className={profile.color}>{profile.label}</span></h2>
                <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">{profile.desc}</p>
              </div>

              {/* Balance */}
              <div className="bg-white/[0.05] border border-white/[0.08] rounded-3xl p-5 mb-4 text-center">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Solde final</p>
                <p className={`text-4xl font-black ${balanceColor}`}>{balance.toLocaleString("fr-FR")} €</p>
                <p className="text-slate-500 text-xs mt-1">Départ : 400 €</p>
                <div className="mt-3 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${balance < 0 ? "bg-rose-400" : balance < 300 ? "bg-amber-400" : "bg-emerald-400"}`}
                    style={{ width: `${Math.max(3, Math.min(100, (balance / 2000) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Category breakdown */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {(Object.entries(byType) as [ItemType, Collected[]][]).map(([type, its]) => (
                  <div key={type} className="bg-white/[0.04] border border-white/[0.07] rounded-2xl px-4 py-3">
                    <p className={`text-[10px] font-bold uppercase tracking-wide mb-1 ${TYPE_COLOR[type]}`}>{TYPE_LABEL[type]}</p>
                    <p className="text-white font-bold text-sm">{its.length} collectés</p>
                    <p className={`text-[11px] mt-0.5 ${sum(its) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {sum(its) > 0 ? "+" : ""}{sum(its).toLocaleString("fr-FR")} €
                    </p>
                  </div>
                ))}
              </div>

              {/* Lessons */}
              {lessons.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-bold text-white mb-3">📖 Ce que ce mois t'a appris</p>
                  <div className="space-y-2">
                    {lessons.map((c, i) => (
                      <div key={i} className="flex items-start gap-3 bg-white/[0.04] border border-white/[0.07] rounded-2xl px-4 py-3">
                        <span className="text-xl shrink-0">{c.emoji}</span>
                        <div>
                          <p className={`text-[10px] font-semibold mb-0.5 ${TYPE_COLOR[c.type]}`}>{c.label}</p>
                          <p className="text-[11px] text-slate-300 leading-snug">{c.lesson}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Challenge question */}
              <div className="bg-[#eccc68]/10 border border-[#eccc68]/25 rounded-3xl px-5 py-4 mb-4">
                <p className="text-[#eccc68] font-bold text-sm mb-1">🧠 Challenge</p>
                <p className="text-[12px] text-slate-300 leading-snug">
                  Si tu avais collecté tous les essentiels ET tous les revenus en ignorant les plaisirs, quel solde aurais-tu eu ?
                  Compare avec ton résultat réel — c'est le coût de tes arbitrages ce mois.
                </p>
              </div>

              <div className="flex gap-3 shrink-0">
                <button onClick={startGame}
                  className="flex-1 py-3.5 rounded-2xl bg-white/[0.08] border border-white/[0.1] text-white font-semibold text-sm hover:bg-white/[0.12] transition">
                  Rejouer
                </button>
                <button onClick={() => router.push("/missions")}
                  className="flex-1 py-3.5 rounded-2xl bg-[#eccc68] text-[#060d1a] font-black text-sm hover:bg-[#f5da80] transition">
                  Retour missions
                </button>
              </div>
            </motion.div>
          )
        })()}

      </AnimatePresence>
    </div>
  )
}
