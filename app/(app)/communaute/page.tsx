"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Heart, MessageCircle, Share2, Plus, Newspaper, TrendingUp } from "lucide-react"
import { GOLD, GOLD_DIM, BG_CARD, BORDER } from "@/lib/theme"

const posts = [
  {
    id: 1, user: "Marie L.", avatar: "ML", time: "2h", badge: "Expert",
    title: "Comment j'ai economise 500 EUR en 1 mois sans me priver",
    preview: "J'ai applique la regle 50/30/20 strictement ce mois-ci. Resultat : 523 EUR d'economies ! Voici ma methode en detail...",
    likes: 42, comments: 8, tags: ["Budget", "Epargne"],
  },
  {
    id: 2, user: "Alex T.", avatar: "AT", time: "5h", badge: "Actif",
    title: "Mes astuces pour suivre son budget avec un fichier Excel",
    preview: "Je partage mon template Excel gratuit qui m'a change la vie. Il calcule automatiquement vos depenses par categorie...",
    likes: 28, comments: 15, tags: ["Excel", "Organisation"],
  },
  {
    id: 3, user: "Sophie R.", avatar: "SR", time: "1j", badge: "Debutant",
    title: "Livret A ou assurance-vie ? Votre avis ?",
    preview: "Je me pose la question depuis quelques semaines. J'ai 10 000 EUR a placer pour 5 ans. Livret A ou assurance-vie, qu'est-ce qui vaut mieux selon vous ?",
    likes: 19, comments: 34, tags: ["Question", "Placement"],
  },
  {
    id: 4, user: "Karim B.", avatar: "KB", time: "2j", badge: "Expert",
    title: "Retour d'experience : 6 mois sans depenses inutiles",
    preview: "Il y a 6 mois je me suis lance un defi : 0 depense non-essentielle. Voici ce que j'ai appris sur moi-meme et sur la gestion financiere...",
    likes: 87, comments: 22, tags: ["Defi", "Experience"],
  },
]

const badgeColors: Record<string, string> = {
  Expert: GOLD, Actif: "#4ade80", Debutant: "#60a5fa",
}

export default function Communaute() {
  const router = useRouter()
  const [likes, setLikes] = useState<Record<number, boolean>>({})
  const [tab, setTab] = useState(0)

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="px-5 pt-10 pb-0 shrink-0">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-1">
          <div>
            <h1 className="text-[26px] font-bold text-white">Communaute</h1>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>2 847 membres - 143 en ligne</p>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.push("/actualites")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: BG_CARD, border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.6)" }}>
            <Newspaper size={13} />
            Actu
          </motion.button>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4 mb-4">
          {["Tendances", "Recent", "Questions"].map((t, i) => (
            <motion.button key={t} whileTap={{ scale: 0.93 }} onClick={() => setTab(i)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{
                background: tab === i ? GOLD : BG_CARD,
                color: tab === i ? "#050A14" : "rgba(255,255,255,0.5)",
                border: `1px solid ${tab === i ? GOLD : BORDER}`,
              }}>
              {t}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Posts */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-4 flex flex-col gap-3">
        <AnimatePresence>
          {posts.map((p, i) => (
            <motion.div key={p.id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-3xl p-4"
              style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>

              {/* Author */}
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DIM})`, color: "#050A14" }}>
                  {p.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-white">{p.user}</p>
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                      style={{ background: `${badgeColors[p.badge]}22`, color: badgeColors[p.badge] }}>
                      {p.badge}
                    </span>
                  </div>
                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.32)" }}>il y a {p.time}</p>
                </div>
                <TrendingUp size={13} color="rgba(255,255,255,0.2)" />
              </div>

              {/* Content */}
              <p className="text-sm font-bold text-white mb-1.5">{p.title}</p>
              <p className="text-xs leading-relaxed mb-3"
                style={{ color: "rgba(255,255,255,0.52)" }}>{p.preview}</p>

              {/* Tags */}
              <div className="flex gap-1.5 mb-3">
                {p.tags.map(t => (
                  <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                    style={{ background: "rgba(236,204,104,0.09)", color: GOLD, border: "1px solid rgba(236,204,104,0.18)" }}>
                    #{t}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
                <motion.button whileTap={{ scale: 0.85 }}
                  onClick={() => setLikes(l => ({ ...l, [p.id]: !l[p.id] }))}
                  className="flex items-center gap-1.5">
                  <Heart size={15}
                    color={likes[p.id] ? "#f87171" : "rgba(255,255,255,0.35)"}
                    fill={likes[p.id] ? "#f87171" : "none"} />
                  <span className="text-xs" style={{ color: likes[p.id] ? "#f87171" : "rgba(255,255,255,0.38)" }}>
                    {p.likes + (likes[p.id] ? 1 : 0)}
                  </span>
                </motion.button>
                <button className="flex items-center gap-1.5">
                  <MessageCircle size={15} color="rgba(255,255,255,0.35)" />
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>{p.comments}</span>
                </button>
                <button className="ml-auto">
                  <Share2 size={15} color="rgba(255,255,255,0.28)" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        className="absolute bottom-24 right-5 rounded-full flex items-center justify-center"
        style={{
          width: 52, height: 52,
          background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DIM})`,
          boxShadow: "0 6px 24px rgba(236,204,104,0.45)",
          color: "#050A14",
        }}
      >
        <Plus size={22} />
      </motion.button>
    </div>
  )
}