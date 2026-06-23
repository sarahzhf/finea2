"use client"

import { useState } from "react"
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion"
import { useRouter } from "next/navigation"

type AgeGroup = "junior" | "senior"
type Screen = "age-gate" | "playing" | "result"

interface Card {
  id: number
  emoji: string
  category: string
  title: string
  amount: string
  amountNum: number
  description: string
  trap?: string
  leftLabel: string
  rightLabel: string
  leftImpact: string
  rightImpact: string
  leftDelta: number
  rightDelta: number
}

interface Decision {
  card: Card
  direction: "left" | "right"
  delta: number
}

const JUNIOR_CARDS: Card[] = [
  {
    id: 1, emoji: "🍔", category: "Sorties",
    title: "Fast food avec les amis",
    amount: "-18 €", amountNum: -18,
    description: "Tous tes amis vont au McDo après les cours. Il te reste 60 € pour finir le mois — encore 2 semaines.",
    leftLabel: "Non merci", rightLabel: "J'y vais",
    leftImpact: "Tu gardes tes 18 €. Frustrant, mais tu gardes ton autonomie financière pour les 2 semaines restantes.",
    rightImpact: "Bonne soirée. Mais avec 42 € pour 2 semaines, le moindre imprévu va coincer.",
    leftDelta: 0, rightDelta: -18,
  },
  {
    id: 2, emoji: "🎮", category: "Loisirs",
    title: "Skin limité en promo -50%",
    amount: "-9,99 €", amountNum: -10,
    description: "Un skin en promo sur ton jeu préféré. Tous tes amis l'ont déjà. Mais un skin ne change pas le gameplay.",
    trap: "Les skins n'ont aucune valeur de revente. Dans 3 semaines il sera déjà oublié.",
    leftLabel: "Ignorer", rightLabel: "Acheter",
    leftImpact: "10 € économisés. Dans 3 semaines tu auras oublié ce skin.",
    rightImpact: "Tu l'as. Mais c'est déjà 'old' dans un mois. Ces 10 € sont transformés en pixels permanents.",
    leftDelta: 0, rightDelta: -10,
  },
  {
    id: 3, emoji: "🚌", category: "Transport",
    title: "Raté le bus → Uber ?",
    amount: "-7 €", amountNum: -7,
    description: "T'as raté le bus de 20 min. Uber = 7 €. Sinon 35 min à pied sous la pluie légère.",
    leftLabel: "À pied", rightLabel: "Uber",
    leftImpact: "35 min de marche. Désagréable, mais gratuit. Et parfois la bonne décision à long terme.",
    rightImpact: "Confort pour 7 €. Pas dramatique. Mais 3x/semaine = 84 €/mois qui s'évaporent.",
    leftDelta: 0, rightDelta: -7,
  },
  {
    id: 4, emoji: "🛍️", category: "Achats",
    title: "T-shirt soldé à -60%",
    amount: "-14 €", amountNum: -14,
    description: "Un tee cool soldé à 14 € (valeur 35 €). Tu en as déjà plein, mais celui-là te plaît vraiment.",
    trap: "Les promos créent un sentiment d'urgence artificiel. Ce n'est une économie que si t'en avais besoin.",
    leftLabel: "Résister", rightLabel: "Craquer",
    leftImpact: "Tu résistes. L'envie passera dans 48h. 14 € conservés pour quelque chose d'utile.",
    rightImpact: "Sympa. Mais tu n'en avais pas besoin. Cette habitude = ~168 €/an de dépenses inutiles.",
    leftDelta: 0, rightDelta: -14,
  },
  {
    id: 5, emoji: "💸", category: "Social",
    title: "Ami qui demande 20 €",
    amount: "-20 €", amountNum: -20,
    description: "Ton ami te demande 20 € 'jusqu'à vendredi'. Il t'a déjà pas remboursé 10 € le mois dernier.",
    trap: "Prêter à quelqu'un qui ne rembourse pas, c'est souvent un cadeau à contrecœur.",
    leftLabel: "Refuser", rightLabel: "Prêter",
    leftImpact: "Tu dis non poliment. Gênant, mais ça protège ton argent et la relation à long terme.",
    rightImpact: "Tu prêtes. Mais +10 € = 30 € potentiellement perdus. Et la prochaine fois, il reviendra.",
    leftDelta: 0, rightDelta: -20,
  },
  {
    id: 6, emoji: "🎵", category: "Abonnements",
    title: "Spotify Premium Student",
    amount: "-5,99 €/mois", amountNum: -6,
    description: "Spotify Premium Student à 5,99 €/mois. Tu écoutes de la musique tous les jours mais la version gratuite marche.",
    leftLabel: "Version gratuite", rightLabel: "Premium",
    leftImpact: "Quelques pubs agaçantes, mais 72 € économisés par an. À toi de voir si le confort en vaut le prix.",
    rightImpact: "5,99 €/mois = 71,88 €/an. Si tu l'utilises vraiment chaque jour, c'est justifiable — sinon, non.",
    leftDelta: 0, rightDelta: -6,
  },
  {
    id: 7, emoji: "🍱", category: "Nourriture",
    title: "Cuisiner vs livraison",
    amount: "0 € vs -12 €", amountNum: -12,
    description: "T'as faim après une longue journée. Les ingrédients pour des pâtes sont dans le frigo. Deliveroo en 25 min.",
    leftLabel: "Cuisiner", rightLabel: "Commander",
    leftImpact: "20 min de cuisine, 0 € dépensé. Et souvent ce qu'on fait soi-même est meilleur.",
    rightImpact: "Confort immédiat, 12 €. 3x/semaine = 144 €/mois juste en livraisons. Le poste qui explose le plus vite.",
    leftDelta: 0, rightDelta: -12,
  },
]

const SENIOR_CARDS: Card[] = [
  {
    id: 1, emoji: "🏦", category: "Banque",
    title: "Découvert 5 jours ou puiser l'épargne ?",
    amount: "-200 € sur le compte", amountNum: -200,
    description: "Il te reste -200 €. Ton salaire arrive dans 5 jours. Ta banque prend 8 €/mois de frais fixes. Tu as 400 € sur livret A.",
    trap: "Les agios semblent faibles (0,49 € pour 5j) mais les FRAIS FIXES de découvert peuvent coûter bien plus. Lis ton contrat.",
    leftLabel: "Puiser livret A", rightLabel: "Attendre le salaire",
    leftImpact: "Tu transfères 200 €, tu perds 0,03 € d'intérêts. Tu évites jusqu'à 8 € de frais fixes. Le livret A gagne.",
    rightImpact: "5 jours à découvert = 0,49 € d'agios + potentiellement 8 € de frais fixes. Souvent plus cher que ça n'y paraît.",
    leftDelta: 0, rightDelta: -8,
  },
  {
    id: 2, emoji: "💳", category: "Crédit",
    title: "iPhone cash ou crédit ?",
    amount: "-299 € ou 14 €/mois", amountNum: -299,
    description: "iPhone à 299 €. Payer cash (il ne reste que 80 € sur le livret après) ou crédit à 2,9% sur 24 mois = 14 €/mois.",
    trap: "Vider presque tout son matelas de sécurité pour un bien qui perd 40% de valeur en 2 ans, c'est risqué.",
    leftLabel: "Cash", rightLabel: "Crédit",
    leftImpact: "0 € d'intérêts. Mais avec 80 € de réserve, la moindre urgence te met à découvert.",
    rightImpact: "14 €/mois × 24 = 336 € total (+37 € d'intérêts). Mais ton matelas d'urgence reste intact.",
    leftDelta: -219, rightDelta: 0,
  },
  {
    id: 3, emoji: "🏠", category: "Logement",
    title: "Coloc 450 € ou studio seul 750 € ?",
    amount: "300 €/mois de différence", amountNum: -300,
    description: "Salaire 1800 €. Coloc à 450 € (super colocataires, 45 min de transport) ou studio seul à 750 € (5 min à pied).",
    trap: "45 min × 2 × 22 jours ouvrés = 33h/mois dans les transports. Combien vaut ton heure ?",
    leftLabel: "Coloc 450 €", rightLabel: "Studio 750 €",
    leftImpact: "300 € économisés/mois = 3600 €/an. Mais 33h supplémentaires/mois dans les transports.",
    rightImpact: "Loyer = 41% de ton salaire (dépasse la règle des 33%). Moins d'épargne, mais +33h libres par mois.",
    leftDelta: 300, rightDelta: 0,
  },
  {
    id: 4, emoji: "📈", category: "Épargne",
    title: "500 € : Livret A ou ETF ?",
    amount: "500 € à placer", amountNum: 0,
    description: "T'as 500 € d'épargne. Livret A à 3% (garanti) ou ETF S&P500 (~9%/an historique, mais -30% possible à court terme).",
    trap: "Pour un horizon 10+ ans, l'ETF bat statistiquement le livret A. Mais si tu as besoin de cet argent dans 2 ans, c'est autre chose.",
    leftLabel: "Livret A 3%", rightLabel: "ETF S&P500",
    leftImpact: "500 → 515 € en 1 an. Sécurisé, disponible. Mais l'inflation réelle ronge ton gain.",
    rightImpact: "Sur 10 ans : 500 € → ~1080 € en moyenne. Mais ça peut être 350 € l'an prochain. Horizon long uniquement.",
    leftDelta: 0, rightDelta: 0,
  },
  {
    id: 5, emoji: "💼", category: "Emploi",
    title: "CDI 1600 € ou CDD 1800 € ?",
    amount: "+200 €/mois de différence", amountNum: 200,
    description: "Deux offres : CDI 1600 € dans une PME stable, ou CDD 6 mois renouvelables à 1800 € dans une startup.",
    trap: "Un CDD te bloque pour un prêt bancaire, une location d'appart, et souvent pour les aides au logement.",
    leftLabel: "CDI 1600 €", rightLabel: "CDD 1800 €",
    leftImpact: "-200 €/mois, mais accès au crédit, bail facilité, sécurité si la startup coule dans 8 mois.",
    rightImpact: "+200 €/mois. Mais galère pour louer, pas de prêt possible, et dans 6 mois tu reprends la recherche.",
    leftDelta: 0, rightDelta: 200,
  },
  {
    id: 6, emoji: "🏋️", category: "Santé",
    title: "Salle de sport : mensuel ou annuel ?",
    amount: "480 € vs 299 €/an", amountNum: 0,
    description: "39,90 €/mois sans engagement ou 299 € payés d'avance pour un an. T'as commencé il y a 3 semaines.",
    trap: "75% des abonnements annuels de salle sont abandonnés avant juillet. La statistique joue contre toi.",
    leftLabel: "Mensuel 39,90 €", rightLabel: "Annuel 299 €",
    leftImpact: "480 €/an si t'y vas 12 mois. Mais résiliable à tout moment. Idéal si tu connais ta tendance à décrocher.",
    rightImpact: "299 €/an = 24,90 €/mois si tu y vas tout l'an. Super deal — mais si tu arrêtes en avril : 299 € pour 10 semaines.",
    leftDelta: 0, rightDelta: -180,
  },
  {
    id: 7, emoji: "🎓", category: "Formation",
    title: "Formation certifiante 150 €",
    amount: "-150 €", amountNum: -150,
    description: "Formation en ligne bien notée dans ton domaine. Pourrait t'aider à obtenir +200 €/mois dans 6 mois. Budget tendu.",
    trap: "150 € pour +200 €/mois = remboursé en moins d'un mois si ça marche. Rarement un mauvais investissement.",
    leftLabel: "Reporter", rightLabel: "Investir",
    leftImpact: "Tu gardes 150 € ce mois. Mais si tu reports maintenant, tu reporteras encore.",
    rightImpact: "150 € pour potentiellement +200 €/mois dans 6 mois = ROI de 1333%. Si ça marche.",
    leftDelta: 0, rightDelta: -150,
  },
  {
    id: 8, emoji: "🚗", category: "Transport",
    title: "Voiture : tout cash ou emprunt partiel ?",
    amount: "3500 € nécessaires", amountNum: -3500,
    description: "Voiture nécessaire pour le boulot. Tu as exactement 3500 € en épargne. Option : tout cash, ou emprunter 2000 € à 4% sur 24 mois.",
    trap: "Vider 100% son épargne n'est jamais neutre. La première réparation à 300 € = découvert immédiat.",
    leftLabel: "Tout cash", rightLabel: "Emprunter 2000 €",
    leftImpact: "0 € d'intérêts. Mais 0 € de réserve. La moindre réparation ou urgence = découvert direct.",
    rightImpact: "87 € d'intérêts sur 24 mois. Mais tu gardes 1500 € de matelas de sécurité. Souvent le bon compromis.",
    leftDelta: -3500, rightDelta: -2000,
  },
]

// ——— Draggable Card Component ———
function DraggableCard({ card, onSwiped, ageGroup }: {
  card: Card
  onSwiped: (dir: "left" | "right") => void
  ageGroup: AgeGroup
}) {
  const [flying, setFlying] = useState(false)
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-280, 280], [-18, 18])
  const leftOpacity = useTransform(x, [-140, -25, 0], [1, 0.3, 0])
  const rightOpacity = useTransform(x, [0, 25, 140], [0, 0.3, 1])
  const cardScale = useTransform(x, [-120, 0, 120], [0.97, 1, 0.97])

  const flyOut = (dir: "left" | "right") => {
    if (flying) return
    setFlying(true)
    animate(x, dir === "right" ? 750 : -750, {
      type: "spring", stiffness: 300, damping: 28,
    }).then(() => onSwiped(dir))
  }

  return (
    <motion.div
      className="absolute inset-0 select-none touch-none"
      style={{ x, rotate, scale: cardScale, zIndex: 30 }}
      initial={{ scale: 0.88, opacity: 0, y: 16 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      drag={flying ? false : "x"}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.4}
      whileTap={{ cursor: "grabbing" }}
      onDragEnd={(_, info) => {
        const { offset, velocity } = info
        if (offset.x > 110 || (velocity.x > 500 && offset.x > 30)) flyOut("right")
        else if (offset.x < -110 || (velocity.x < -500 && offset.x < -30)) flyOut("left")
      }}
    >
      {/* LEFT overlay */}
      <motion.div style={{ opacity: leftOpacity }}
        className="absolute inset-0 rounded-[32px] z-10 pointer-events-none border-2 border-rose-400/60 bg-rose-500/15">
        <div className="absolute top-7 left-5">
          <span className="bg-rose-500 text-white font-black text-[11px] px-3 py-1 rounded-full block"
            style={{ transform: "rotate(-22deg)" }}>✕ {card.leftLabel.toUpperCase()}</span>
        </div>
      </motion.div>

      {/* RIGHT overlay */}
      <motion.div style={{ opacity: rightOpacity }}
        className="absolute inset-0 rounded-[32px] z-10 pointer-events-none border-2 border-emerald-400/60 bg-emerald-500/15">
        <div className="absolute top-7 right-5">
          <span className="bg-emerald-500 text-white font-black text-[11px] px-3 py-1 rounded-full block"
            style={{ transform: "rotate(22deg)" }}>✓ {card.rightLabel.toUpperCase()}</span>
        </div>
      </motion.div>

      {/* Card body */}
      <div className="absolute inset-0 rounded-[32px] overflow-hidden bg-gradient-to-br from-[#0d1b35] via-[#0a1526] to-[#060d1a] border border-white/[0.13] shadow-[0_30px_80px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.07)] cursor-grab active:cursor-grabbing">
        {/* top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#eccc68]/50 to-transparent" />
        {/* decorative circles */}
        <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-white/[0.015] border border-white/[0.04]" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-white/[0.015] border border-white/[0.04]" />

        <div className="relative z-10 h-full flex flex-col p-6">
          {/* top row */}
          <div className="flex items-center justify-between mb-5">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 bg-white/[0.07] border border-white/[0.08] px-2.5 py-1 rounded-full">
              {card.category}
            </span>
            <span className="text-[42px] leading-none">{card.emoji}</span>
          </div>

          {/* amount */}
          <p className={`text-2xl font-black mb-2 ${card.amountNum < 0 ? "text-rose-400" : card.amountNum > 0 ? "text-emerald-400" : "text-[#eccc68]"}`}>
            {card.amount}
          </p>

          {/* title */}
          <h2 className="text-[17px] font-bold text-white mb-3 leading-tight">{card.title}</h2>

          {/* description */}
          <p className="text-[13px] text-slate-300 leading-relaxed flex-1">{card.description}</p>

          {/* trap (senior only) */}
          {ageGroup === "senior" && card.trap && (
            <div className="mt-4 flex items-start gap-2 bg-amber-500/10 border border-amber-400/20 rounded-2xl px-3 py-2.5">
              <span className="text-amber-400 shrink-0 text-sm mt-px">⚠️</span>
              <p className="text-[11px] text-amber-200/80 leading-snug">{card.trap}</p>
            </div>
          )}

          {/* swipe hint */}
          <div className="mt-4 flex items-center justify-between text-[10px] text-slate-600">
            <span>← {card.leftLabel}</span>
            <span>swipe</span>
            <span>{card.rightLabel} →</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ——— Main Page ———
export default function SwipeGamePage() {
  const router = useRouter()
  const [screen, setScreen] = useState<Screen>("age-gate")
  const [ageInput, setAgeInput] = useState("")
  const [ageError, setAgeError] = useState("")
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("junior")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [budget, setBudget] = useState(150)
  const [startBudget, setStartBudget] = useState(150)
  const [toast, setToast] = useState<{ text: string; dir: "left" | "right" } | null>(null)

  const cards = ageGroup === "junior" ? JUNIOR_CARDS : SENIOR_CARDS
  const currentCard = cards[currentIndex] ?? null
  const progress = cards.length > 0 ? currentIndex / cards.length : 0
  const budgetRatio = startBudget > 0 ? budget / startBudget : 1
  const budgetColor = budgetRatio > 0.8 ? "text-emerald-400" : budgetRatio > 0.5 ? "text-amber-400" : "text-rose-400"

  const parsedAge = parseInt(ageInput)

  const handleAgeSubmit = () => {
    if (isNaN(parsedAge) || parsedAge < 13) {
      setAgeError("Entre un âge valide (13 ans minimum)")
      return
    }
    const group: AgeGroup = parsedAge <= 17 ? "junior" : "senior"
    const init = parsedAge <= 17 ? 150 : 1800
    setAgeGroup(group)
    setBudget(init)
    setStartBudget(init)
    setCurrentIndex(0)
    setDecisions([])
    setAgeError("")
    setScreen("playing")
  }

  const handleSwiped = (dir: "left" | "right") => {
    if (!currentCard) return
    const impact = dir === "left" ? currentCard.leftImpact : currentCard.rightImpact
    const delta = dir === "left" ? currentCard.leftDelta : currentCard.rightDelta
    setBudget(prev => prev + delta)
    setDecisions(prev => [...prev, { card: currentCard, direction: dir, delta }])
    setToast({ text: impact, dir })
    setTimeout(() => setToast(null), 2800)
    if (currentIndex + 1 >= cards.length) {
      setTimeout(() => setScreen("result"), 450)
    } else {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const restart = () => {
    setScreen("age-gate")
    setAgeInput("")
    setAgeError("")
    setCurrentIndex(0)
    setDecisions([])
  }

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-[#020617] to-[#0b1120] text-slate-50 overflow-hidden">
      <AnimatePresence mode="wait">

        {/* ——— AGE GATE ——— */}
        {screen === "age-gate" && (
          <motion.div key="age-gate"
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
            className="flex-1 flex flex-col items-center justify-center px-6 py-10 gap-7 h-full overflow-y-auto">

            <button onClick={() => router.push("/missions")}
              className="self-start w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white transition text-xl leading-none">
              ‹
            </button>

            <div className="text-center space-y-3">
              <div className="text-6xl mb-2">🃏</div>
              <h1 className="text-4xl font-black text-white">Swipe Game</h1>
              <p className="text-slate-400 text-sm max-w-xs mx-auto leading-relaxed">
                Des dilemmes financiers réels. Swipe pour décider. Chaque choix a un coût.
              </p>
            </div>

            <div className="w-full max-w-sm space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-2 block text-center">Quel âge as-tu ?</label>
                <input
                  type="number" value={ageInput} min={13} max={80}
                  onChange={e => { setAgeInput(e.target.value); setAgeError("") }}
                  onKeyDown={e => e.key === "Enter" && handleAgeSubmit()}
                  placeholder="Ex : 19"
                  className="w-full bg-white/[0.06] border border-white/[0.1] rounded-2xl px-5 py-4 text-white text-3xl font-black text-center placeholder-white/20 focus:outline-none focus:border-[#eccc68]/50 transition"
                />
                {ageError && (
                  <p className="text-rose-400 text-xs mt-2 text-center">{ageError}</p>
                )}
              </div>

              <AnimatePresence>
                {ageInput && !isNaN(parsedAge) && parsedAge >= 13 && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className={`rounded-2xl border px-4 py-3 text-center text-sm font-medium ${
                      parsedAge <= 17
                        ? "bg-emerald-500/10 border-emerald-400/20 text-emerald-300"
                        : "bg-rose-500/10 border-rose-400/20 text-rose-300"
                    }`}>
                    {parsedAge <= 17
                      ? "💚 Mode Ado — Situations de la vie courante"
                      : parsedAge <= 26
                        ? "🔥 Mode Adulte — Dilemmes financiers complexes"
                        : "🔥 Mode Expert — Les vrais arbitrages financiers"}
                  </motion.div>
                )}
              </AnimatePresence>

              <button onClick={handleAgeSubmit}
                className="w-full py-4 rounded-2xl bg-[#eccc68] text-[#060d1a] font-black text-base shadow-[0_8px_32px_rgba(236,204,104,0.3)] hover:bg-[#f5da80] active:scale-[0.98] transition">
                Commencer →
              </button>
            </div>
          </motion.div>
        )}

        {/* ——— PLAYING ——— */}
        {screen === "playing" && (
          <motion.div key="playing"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col h-full">

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0">
              <button onClick={() => router.push("/missions")}
                className="w-9 h-9 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white transition text-lg leading-none">
                ‹
              </button>
              <div className="text-center">
                <p className="text-[9px] uppercase tracking-widest text-slate-500">Budget simulé</p>
                <p className={`text-xl font-black ${budgetColor}`}>{budget.toLocaleString("fr-FR")} €</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500">{currentIndex + 1} / {cards.length}</p>
                <p className="text-[9px] text-slate-600 mt-0.5">{ageGroup === "junior" ? "Mode Ado" : "Mode Adulte"}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="px-5 mb-1 shrink-0">
              <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div className="h-full bg-[#eccc68]/80 rounded-full"
                  animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.4 }} />
              </div>
            </div>

            {/* Card stack */}
            <div className="flex-1 flex items-center justify-center px-5 py-2">
              <div className="relative w-full max-w-sm" style={{ height: "clamp(300px, 48vh, 400px)" }}>
                {/* Background stack */}
                {[2, 1].map(offset => {
                  const idx = currentIndex + offset
                  if (idx >= cards.length) return null
                  return (
                    <div key={idx}
                      className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-[#0d1b35] to-[#060d1a] border border-white/[0.07]"
                      style={{
                        transform: `translateY(${offset * 13}px) scale(${1 - offset * 0.044})`,
                        zIndex: 20 - offset * 5,
                        opacity: 1 - offset * 0.22,
                      }}
                    />
                  )
                })}

                {/* Active card */}
                {currentCard && (
                  <DraggableCard
                    key={currentCard.id}
                    card={currentCard}
                    onSwiped={handleSwiped}
                    ageGroup={ageGroup}
                  />
                )}
              </div>
            </div>

            {/* Toast feedback */}
            <div className="px-5 pb-4 shrink-0" style={{ minHeight: 70 }}>
              <AnimatePresence mode="wait">
                {toast && (
                  <motion.div key={toast.text}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className={`w-full rounded-2xl border px-4 py-3 text-[12px] leading-snug ${
                      toast.dir === "left"
                        ? "bg-rose-500/10 border-rose-400/20 text-rose-200"
                        : "bg-emerald-500/10 border-emerald-400/20 text-emerald-200"
                    }`}>
                    <span className="mr-2 font-bold">{toast.dir === "left" ? "✕" : "✓"}</span>
                    {toast.text}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* ——— RESULT ——— */}
        {screen === "result" && (
          <motion.div key="result"
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col px-5 py-6 w-full h-full overflow-y-auto">

            <div className="text-center mb-5">
              <div className="text-5xl mb-3">
                {budgetRatio > 0.85 ? "🏆" : budgetRatio > 0.65 ? "👍" : budgetRatio > 0.45 ? "🤔" : "😬"}
              </div>
              <h2 className="text-2xl font-black text-white">Partie terminée</h2>
              <p className="text-slate-400 text-sm mt-1">{cards.length} décisions prises</p>
            </div>

            {/* Budget final */}
            <div className="bg-white/[0.05] border border-white/[0.08] rounded-3xl p-5 mb-4 text-center">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Budget final</p>
              <p className={`text-4xl font-black ${budgetColor}`}>{budget.toLocaleString("fr-FR")} €</p>
              <p className="text-slate-500 text-xs mt-1">Départ : {startBudget.toLocaleString("fr-FR")} €</p>
              <div className="mt-3 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${budgetRatio > 0.75 ? "bg-emerald-400" : budgetRatio > 0.5 ? "bg-amber-400" : "bg-rose-400"}`}
                  style={{ width: `${Math.max(4, Math.min(100, budgetRatio * 100))}%` }}
                />
              </div>
            </div>

            {/* Decisions list */}
            <div className="space-y-2 flex-1 mb-4">
              {decisions.map((d, i) => (
                <div key={i}
                  className={`flex items-start gap-3 rounded-2xl px-4 py-3 border text-xs ${
                    d.direction === "right"
                      ? "bg-emerald-500/[0.08] border-emerald-400/15"
                      : "bg-rose-500/[0.08] border-rose-400/15"
                  }`}>
                  <span className="text-xl shrink-0">{d.card.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-[11px] leading-tight">{d.card.title}</p>
                    <p className={`text-[10px] mt-0.5 ${d.direction === "right" ? "text-emerald-400" : "text-rose-400"}`}>
                      {d.direction === "right" ? d.card.rightLabel : d.card.leftLabel}
                    </p>
                  </div>
                  {d.delta !== 0 && (
                    <span className={`text-[11px] font-bold shrink-0 ${d.delta < 0 ? "text-rose-400" : "text-emerald-400"}`}>
                      {d.delta > 0 ? "+" : ""}{d.delta.toLocaleString("fr-FR")} €
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3 shrink-0">
              <button onClick={restart}
                className="flex-1 py-3.5 rounded-2xl bg-white/[0.08] border border-white/[0.1] text-white font-semibold text-sm hover:bg-white/[0.12] transition">
                Rejouer
              </button>
              <button onClick={() => router.push("/missions")}
                className="flex-1 py-3.5 rounded-2xl bg-[#eccc68] text-[#060d1a] font-black text-sm hover:bg-[#f5da80] transition">
                Retour missions
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
