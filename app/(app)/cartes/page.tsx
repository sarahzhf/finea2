"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Lock, Settings, Sliders, Eye, EyeOff, X, Check, Unlock } from "lucide-react"
import { GOLD, GOLD_DIM, BG_CARD, BORDER } from "@/lib/theme"

const cards = [
  {
    label: "Platinum",
    number: "4521",
    holder: "SARAH Z.",
    exp: "12/28",
    cvv: "392",
    limit: 5000,
    spent: 1248.50,
    bg: "linear-gradient(135deg, #0d1b3e 0%, #1a2f5e 40%, #0a1628 100%)",
    shine: "linear-gradient(135deg, rgba(96,165,250,0.18) 0%, transparent 60%)",
    accent: "#60a5fa",
    logo: "VISA",
    chip: "linear-gradient(135deg, #c8a84b, #f0d060, #a87c2a)",
  },
  {
    label: "Gold",
    number: "7893",
    holder: "SARAH Z.",
    exp: "08/27",
    cvv: "741",
    limit: 3000,
    spent: 780.00,
    bg: `linear-gradient(135deg, #1a0e00 0%, #3d2200 40%, #1a0e00 100%)`,
    shine: `linear-gradient(135deg, rgba(245,214,87,0.22) 0%, transparent 60%)`,
    accent: GOLD,
    logo: "MC",
    chip: "linear-gradient(135deg, #d4a843, #f5d070, #b8862e)",
  },
  {
    label: "Standard",
    number: "1100",
    holder: "SARAH Z.",
    exp: "03/26",
    cvv: "558",
    limit: 1500,
    spent: 320.00,
    bg: "linear-gradient(135deg, #091409 0%, #152815 40%, #091409 100%)",
    shine: "linear-gradient(135deg, rgba(74,222,128,0.18) 0%, transparent 60%)",
    accent: "#4ade80",
    logo: "VISA",
    chip: "linear-gradient(135deg, #c8a84b, #f0d060, #a87c2a)",
  },
]

function Card3D({ card, isActive, index, active, onSelect, onFlip, flipped }: {
  card: typeof cards[0]
  isActive: boolean
  index: number
  active: number
  onSelect: () => void
  onFlip: () => void
  flipped: boolean
}) {
  const offset = index - active

  return (
    <motion.div
      onClick={() => isActive ? onFlip() : onSelect()}
      animate={{
        y: offset * 16,
        scale: isActive ? 1 : 1 - Math.abs(offset) * 0.06,
        zIndex: isActive ? 20 : 20 - Math.abs(offset) * 5,
      }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className="absolute inset-x-0 mx-auto cursor-pointer"
      style={{
        height: 210,
        perspective: "1200px",
      }}
    >
      {/* Ombre portée 3D */}
      {isActive && (
        <div className="absolute inset-x-4 bottom-0 h-16 rounded-full blur-2xl pointer-events-none"
          style={{ background: `${card.accent}33`, transform: "translateY(20px) scaleY(0.4)" }} />
      )}

      {/* Container flip */}
      <motion.div
        animate={{ rotateY: isActive && flipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        style={{
          width: "100%",
          height: "100%",
          transformStyle: "preserve-3d",
          position: "relative",
        }}
      >
        {/* ── FACE AVANT ── */}
        <div
          className="absolute inset-0 rounded-3xl overflow-hidden"
          style={{
            background: card.bg,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            border: `1px solid ${isActive ? card.accent + "44" : "rgba(255,255,255,0.07)"}`,
            boxShadow: isActive
              ? `0 24px 64px rgba(0,0,0,0.75), 0 0 0 1px ${card.accent}22, inset 0 1px 0 rgba(255,255,255,0.12)`
              : `0 8px 24px rgba(0,0,0,0.5)`,
          }}
        >
          {/* Shine overlay */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: card.shine }} />

          {/* Texture holographique */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{ background: "repeating-linear-gradient(45deg, white 0px, white 1px, transparent 1px, transparent 8px)" }} />

          {/* Reflet haut */}
          <div className="absolute top-0 inset-x-0 h-1/3 rounded-t-3xl pointer-events-none"
            style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.09) 0%, transparent 100%)" }} />

          <div className="p-5 h-full flex flex-col justify-between">
            {/* Top row */}
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[9px] font-black tracking-[4px] mb-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>FINÉA BANK</p>
                <p className="text-sm font-bold tracking-wider" style={{ color: card.accent }}>{card.label}</p>
              </div>
              {/* Logo réseau */}
              {card.logo === "VISA" ? (
                <p className="text-lg font-black italic" style={{ color: "rgba(255,255,255,0.9)", fontFamily: "Georgia, serif" }}>VISA</p>
              ) : (
                <div className="flex">
                  <div className="w-7 h-7 rounded-full opacity-90" style={{ background: "#EB001B" }} />
                  <div className="w-7 h-7 rounded-full -ml-3 opacity-80" style={{ background: "#F79E1B" }} />
                </div>
              )}
            </div>

            {/* Chip + NFC */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-7 rounded-md relative overflow-hidden"
                style={{ background: card.chip, border: "1px solid rgba(255,255,255,0.25)", boxShadow: "inset 0 1px 2px rgba(255,255,255,0.3)" }}>
                <div className="absolute inset-x-0 top-1/2 h-px bg-black/20" />
                <div className="absolute inset-y-0 left-1/3 w-px bg-black/15" />
                <div className="absolute inset-y-0 right-1/3 w-px bg-black/15" />
              </div>
              {/* NFC symbol */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" opacity={0.5}>
                <path d="M6 8.4C6 8.4 7.5 6 12 6C16.5 6 18 8.4 18 8.4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M8.5 11C8.5 11 9.5 9.5 12 9.5C14.5 9.5 15.5 11 15.5 11" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="12" cy="14" r="1.5" fill="white"/>
              </svg>
            </div>

            {/* Numéro */}
            <p className="text-[15px] font-mono text-white tracking-[3px] font-semibold">
              •••• •••• •••• {card.number}
            </p>

            {/* Bottom row */}
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[8px] tracking-[2px] mb-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>TITULAIRE</p>
                <p className="text-xs font-bold text-white tracking-wider">{card.holder}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] tracking-[2px] mb-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>EXPIRE</p>
                <p className="text-xs font-bold text-white">{card.exp}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── FACE ARRIÈRE ── */}
        <div
          className="absolute inset-0 rounded-3xl overflow-hidden"
          style={{
            background: card.bg,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            border: `1px solid ${card.accent}44`,
            boxShadow: `0 24px 64px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.12)`,
          }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ background: card.shine }} />

          {/* Bande magnétique */}
          <div className="mt-6 h-10 -mx-0" style={{ background: "rgba(0,0,0,0.75)" }} />

          <div className="px-5 pt-4 space-y-4">
            {/* Signature + CVV */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-8 rounded-md flex items-center px-2"
                style={{ background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 4px)" }}>
                <p className="text-xs italic text-white/40">{card.holder}</p>
              </div>
              <div className="px-4 py-2 rounded-md text-center"
                style={{ background: "rgba(255,255,255,0.12)", border: `1px solid ${card.accent}44` }}>
                <p className="text-[8px] text-white/40 uppercase tracking-wider mb-0.5">CVV</p>
                <p className="text-sm font-mono font-bold text-white">{card.cvv}</p>
              </div>
            </div>

            {/* Numéro complet masqué */}
            <p className="text-[11px] font-mono text-white/40 tracking-[3px] text-center">
              •••• •••• •••• {card.number}
            </p>

            <p className="text-[9px] text-center leading-relaxed" style={{ color: "rgba(255,255,255,0.28)" }}>
              Ce numéro est confidentiel.{"\n"}Ne le communiquez à personne.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Modal Bloquer ──
function ModalBloquer({ card, onClose }: { card: typeof cards[0]; onClose: () => void }) {
  const [blocked, setBlocked] = useState(false)
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="w-full rounded-t-3xl p-6" style={{ background: "#0d1929", border: `1px solid ${BORDER}` }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-white">{blocked ? "Carte débloquée" : "Bloquer la carte"}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)" }}>
            <X size={14} color="rgba(255,255,255,0.5)" />
          </button>
        </div>
        {!blocked ? (
          <>
            <div className="rounded-2xl p-4 mb-4 flex items-center gap-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <Lock size={18} color="#f87171" />
              <div>
                <p className="text-sm font-semibold text-white">Carte •••• {card.number}</p>
                <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>Tous les paiements seront refusés</p>
              </div>
            </div>
            <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.4)" }}>
              Tu peux débloquer ta carte à tout moment depuis cette même page.
            </p>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setBlocked(true)}
              className="w-full py-3.5 rounded-2xl font-bold text-sm" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
              Bloquer la carte
            </motion.button>
          </>
        ) : (
          <div className="flex flex-col items-center py-4 gap-3">
            <div className="text-4xl">🔓</div>
            <p className="text-sm font-semibold text-white">Carte •••• {card.number} débloquée</p>
            <motion.button whileTap={{ scale: 0.97 }} onClick={onClose}
              className="w-full py-3.5 rounded-2xl font-bold text-sm" style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DIM})`, color: "#050A14" }}>
              Fermer
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ── Modal Limites ──
function ModalLimites({ card, onClose }: { card: typeof cards[0]; onClose: () => void }) {
  const [paiement, setPaiement]   = useState(1000)
  const [retrait, setRetrait]     = useState(500)
  const [internet, setInternet]   = useState(true)
  const [saved, setSaved]         = useState(false)
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="w-full rounded-t-3xl p-6" style={{ background: "#0d1929", border: `1px solid ${BORDER}` }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-white">Limites de paiement</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)" }}>
            <X size={14} color="rgba(255,255,255,0.5)" />
          </button>
        </div>
        <div className="space-y-5 mb-5">
          {[
            { label: "Plafond paiement / jour", val: paiement, set: setPaiement, min: 100, max: 5000, step: 100 },
            { label: "Plafond retrait / jour",  val: retrait,  set: setRetrait,  min: 50,  max: 1000, step: 50  },
          ].map(({ label, val, set, min, max, step }) => (
            <div key={label}>
              <div className="flex justify-between text-xs mb-1.5">
                <span style={{ color: "rgba(255,255,255,0.5)" }}>{label}</span>
                <span className="font-bold" style={{ color: GOLD }}>{val.toLocaleString("fr-FR")} €</span>
              </div>
              <input type="range" min={min} max={max} step={step} value={val} onChange={e => set(+e.target.value)}
                className="w-full h-1.5 rounded-full appearance-none" style={{ accentColor: GOLD, background: "rgba(255,255,255,0.1)" }} />
            </div>
          ))}
          <div className="flex items-center justify-between py-3 rounded-2xl px-4" style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>
            <div>
              <p className="text-xs font-semibold text-white">Paiements en ligne</p>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.38)" }}>Autoriser les achats sur internet</p>
            </div>
            <button onClick={() => setInternet(v => !v)}
              className="w-11 h-6 rounded-full relative" style={{ background: internet ? GOLD : "rgba(255,255,255,0.15)" }}>
              <motion.div animate={{ x: internet ? 20 : 2 }} className="absolute top-1 w-4 h-4 rounded-full"
                style={{ background: internet ? "#050A14" : "rgba(255,255,255,0.6)" }} transition={{ type: "spring", stiffness: 400, damping: 25 }} />
            </button>
          </div>
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setSaved(true); setTimeout(onClose, 1200) }}
          className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
          style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DIM})`, color: "#050A14" }}>
          {saved ? <><Check size={15} /> Enregistré !</> : "Enregistrer les limites"}
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

// ── Modal Paramètres ──
function ModalParams({ card, onClose }: { card: typeof cards[0]; onClose: () => void }) {
  const [nfc, setNfc]       = useState(true)
  const [abroad, setAbroad] = useState(true)
  const [notif, setNotif]   = useState(true)
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="w-full rounded-t-3xl p-6" style={{ background: "#0d1929", border: `1px solid ${BORDER}` }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-white">Paramètres carte</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)" }}>
            <X size={14} color="rgba(255,255,255,0.5)" />
          </button>
        </div>
        <div className="rounded-2xl overflow-hidden mb-5" style={{ border: `1px solid ${BORDER}` }}>
          {[
            { label: "Paiement sans contact (NFC)", sub: "Apple Pay, Google Pay...", val: nfc, set: setNfc },
            { label: "Utilisation à l'étranger",   sub: "Hors zone euro",           val: abroad, set: setAbroad },
            { label: "Notifications paiements",    sub: "Alerte à chaque achat",    val: notif, set: setNotif },
          ].map(({ label, sub, val, set }, i, arr) => (
            <div key={label} className="flex items-center justify-between px-4 py-3.5"
              style={{ background: "rgba(255,255,255,0.025)", borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : "none" }}>
              <div>
                <p className="text-xs font-semibold text-white">{label}</p>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.38)" }}>{sub}</p>
              </div>
              <button onClick={() => set((v: boolean) => !v)}
                className="w-11 h-6 rounded-full relative shrink-0" style={{ background: val ? GOLD : "rgba(255,255,255,0.15)" }}>
                <motion.div animate={{ x: val ? 20 : 2 }} className="absolute top-1 w-4 h-4 rounded-full"
                  style={{ background: val ? "#050A14" : "rgba(255,255,255,0.6)" }} transition={{ type: "spring", stiffness: 400, damping: 25 }} />
              </button>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <button className="w-full py-3 rounded-2xl text-sm font-semibold text-red-400 flex items-center justify-center gap-2"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <Lock size={14} /> Signaler carte perdue / volée
          </button>
          <button className="w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: BG_CARD, border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.6)" }}>
            Commander une nouvelle carte
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function Cartes() {
  const router = useRouter()
  const [active, setActive]       = useState(0)
  const [flipped, setFlipped]     = useState(false)
  const [cvvVisible, setCvvVisible] = useState(false)
  const [modal, setModal]         = useState<"bloquer" | "limites" | "params" | null>(null)

  const card = cards[active]

  function selectCard(i: number) {
    setActive(i)
    setFlipped(false)
    setCvvVisible(false)
    setModal(null)
  }

  return (
    <div className="w-full h-full overflow-y-auto px-5 pt-10 pb-6">
      <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.back()}
        className="flex items-center gap-2 mb-6" style={{ color: GOLD }}
        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
        <ArrowLeft size={18} />
        <span className="text-sm font-semibold">Retour</span>
      </motion.button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-[26px] font-bold text-white mb-0.5">Mes Cartes</h1>
        <p className="text-xs mb-6" style={{ color: "rgba(255,255,255,0.35)" }}>
          Appuyer sur la carte active pour la retourner
        </p>
      </motion.div>

      {/* Zone cartes 3D */}
      <div className="relative mb-6" style={{ height: 250, perspective: "1200px" }}>
        {cards.map((c, i) => (
          <Card3D
            key={i}
            card={c}
            isActive={i === active}
            index={i}
            active={active}
            flipped={flipped}
            onSelect={() => selectCard(i)}
            onFlip={() => setFlipped(f => !f)}
          />
        ))}
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mb-5">
        {cards.map((_, i) => (
          <motion.button key={i} onClick={() => selectCard(i)}
            animate={{ width: i === active ? 24 : 8 }}
            className="h-1.5 rounded-full"
            style={{ background: i === active ? GOLD : "rgba(255,255,255,0.18)" }} />
        ))}
      </div>

      {/* Dépenses */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-2xl p-4 mb-3"
        style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.42)" }}>Dépenses ce mois</p>
          <p className="text-xs font-semibold" style={{ color: card.accent }}>
            {Math.round((card.spent / card.limit) * 100)}% du plafond
          </p>
        </div>
        <p className="text-2xl font-bold text-white mb-2">
          {card.spent.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
          <span className="text-sm text-white/30"> / {card.limit.toLocaleString()} €</span>
        </p>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <motion.div
            key={active}
            initial={{ width: 0 }}
            animate={{ width: `${(card.spent / card.limit) * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${card.accent}, ${card.accent}88)` }}
          />
        </div>
      </motion.div>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { icon: <Lock size={16} />,     label: "Bloquer",    action: () => setModal("bloquer") },
          { icon: <Sliders size={16} />,  label: "Limites",    action: () => setModal("limites") },
          { icon: <Settings size={16} />, label: "Paramètres", action: () => setModal("params")  },
        ].map((a) => (
          <motion.button key={a.label} whileTap={{ scale: 0.93 }} onClick={a.action}
            className="rounded-2xl py-3 flex flex-col items-center gap-1.5 text-xs font-medium"
            style={{ background: BG_CARD, border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.6)" }}>
            {a.icon}
            {a.label}
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {modal === "bloquer"  && <ModalBloquer  card={card} onClose={() => setModal(null)} />}
        {modal === "limites"  && <ModalLimites  card={card} onClose={() => setModal(null)} />}
        {modal === "params"   && <ModalParams   card={card} onClose={() => setModal(null)} />}
      </AnimatePresence>
    </div>
  )
}
