"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { GOLD } from "@/lib/theme"

const GOLD_COLOR = GOLD // #eccc68

const categories: Record<string, { titre: string; description: string }[]> = {
  "💰 Budget & Épargne": [
    { titre: "Établissez un budget mensuel", description: "Identifiez précisément vos revenus et charges pour une vision claire de votre situation financière." },
    { titre: "Adoptez la méthode 50/30/20", description: "Allouez 50% aux besoins essentiels, 30% aux envies et 20% à l'épargne." },
    { titre: "Automatisez votre épargne", description: "Programmez un virement automatique vers votre compte épargne le jour de votre salaire." },
    { titre: "Établissez un budget plaisir hebdomadaire", description: "Allouez-vous un montant fixe pour vos envies (ex: 20€/semaine)." },
    { titre: "Pratiquez la micro-épargne quotidienne", description: "Épargnez 1€ par jour automatiquement. 365€ par an sans effort." },
    { titre: "Renégociez vos contrats annuellement", description: "Internet, téléphonie, assurances… Un appel peut réduire vos factures de 15 à 30%." },
    { titre: "Renseignez-vous sur les aides disponibles", description: "Bourses, aides au logement, dispositifs locaux… Consultez les sites officiels." },
    { titre: "Négociez vos pénalités bancaires", description: "Un appel à votre conseiller avec menace de départ obtient souvent l'annulation des frais." },
  ],
  "🛒 Shopping malin": [
    { titre: "Appliquez la règle des 24 heures", description: "Différez vos achats non essentiels d'une journée pour évaluer objectivement leur nécessité." },
    { titre: "Optez pour le marché de l'occasion", description: "Économies substantielles sur des produits en parfait état." },
    { titre: "Planifiez vos achats alimentaires", description: "Une liste précise avant chaque course réduit les dépenses superflues de 20 à 30%." },
    { titre: "Méfiez-vous du prix psychologique", description: "Arrondissez mentalement : 9,99€ = 10€. Évaluez le coût réel." },
    { titre: "Résistez à l'effet de rareté artificielle", description: "\"Dernière pièce\"... 90% du temps, c'est faux. Vérifiez le lendemain." },
    { titre: "Déjouez le biais de gratuité", description: "\"Livraison gratuite dès 50€\" vous pousse à dépenser 50€ pour économiser 5€ de livraison." },
    { titre: "Anticipez vos achats événementiels", description: "Achetez cadeaux d'anniversaire et de Noël plusieurs mois à l'avance." },
  ],
  "🏠 Logement & Énergie": [
    { titre: "Utilisez les plateformes anti-gaspillage", description: "Produits invendus à prix réduits : économies personnelles et démarche responsable." },
    { titre: "Évitez les courses à jeun", description: "Faire vos achats en état de satiété réduit les achats impulsifs de 30%." },
    { titre: "Optimisez votre consommation électrique", description: "Débranchez les multiprises la nuit. Réduction de 10 à 15% de votre facture." },
    { titre: "Réparez avant de remplacer", description: "Prolonger la durée de vie coûte généralement 70% moins cher que le remplacement." },
  ],
  "🚗 Transport": [
    { titre: "Anticipez vos réservations de transport", description: "Les tarifs augmentent à l'approche de la date. Réserver à l'avance garantit les meilleurs prix." },
    { titre: "Privilégiez transports en commun ou covoiturage", description: "Souvent plus économiques que l'usage quotidien d'un véhicule personnel." },
    { titre: "Évitez les applications de livraison de repas", description: "Ces services ajoutent des frais et augmentent les prix de 20 à 30% vs restaurant." },
  ],
  "🧠 Psychologie": [
    { titre: "Différenciez besoins et envies", description: "Référez-vous à la pyramide de Maslow : un besoin concerne votre survie, une envie est superflue." },
    { titre: "Pratiquez le challenge zéro dépense", description: "Une semaine par mois sans achat non-essentiel. Recalibrez vos besoins réels." },
    { titre: "Vérifiez systématiquement vos tickets de caisse", description: "Si un article est moins cher en rayon qu'en caisse, la loi oblige à honorer le prix le plus bas." },
    { titre: "Évitez le shopping sans objectif", description: "Ne flânez jamais en magasin sans liste. Le shopping récréatif triple les dépenses non planifiées." },
    { titre: "Vendez ce que vous n'utilisez plus", description: "Désencombrer génère des revenus complémentaires. Les objets dormants ont une valeur marchande." },
  ],
  "📱 Digital": [
    { titre: "Révisez régulièrement vos abonnements", description: "Revue trimestrielle et résiliation des services sous-utilisés." },
    { titre: "Désactivez les notifications commerciales", description: "Ces alertes sont conçues pour stimuler l'achat impulsif." },
    { titre: "Mutualisez vos abonnements", description: "Partagez légalement vos souscriptions avec votre foyer." },
    { titre: "Utilisez les applications de cashback", description: "Remboursement d'un pourcentage sur vos achats habituels. Épargne passive." },
    { titre: "Supprimez les paiements en un clic", description: "Cette étape supplémentaire suffit souvent à stopper l'achat impulsif." },
  ],
}

const pieges = [
  { titre: "Urgence artificielle", description: "\"Plus que 2 en stock !\" - Souvent faux, ignorez-le." },
  { titre: "Pression sociale", description: "\"127 personnes regardent\" - Chiffres manipulés." },
  { titre: "Notifications addictives", description: "Désactivez toutes les notifs shopping !" },
  { titre: "Fausses promos", description: "\"-70% première commande\" = vous dépensez quand même." },
]

export default function ConseilsPage() {
  const router = useRouter()
  const [openCategory, setOpenCategory] = useState<string | null>(null)
  const [activeCalculator, setActiveCalculator] = useState<"economies" | "depenses" | "objectif">("economies")
  const [montantJour, setMontantJour] = useState("1")
  const [montantSemaine, setMontantSemaine] = useState("5")
  const [nomDepense, setNomDepense] = useState("Café quotidien")
  const [montantDepense, setMontantDepense] = useState("3.5")
  const [frequenceDepense, setFrequenceDepense] = useState<"jour" | "semaine" | "mois">("jour")
  const [objectifMontant, setObjectifMontant] = useState("1000")
  const [economieJour, setEconomieJour] = useState("10")

  const pJour = parseFloat(montantJour) || 0
  const pSemaine = parseFloat(montantSemaine) || 0
  const pDepense = parseFloat(montantDepense) || 0
  const parJour = frequenceDepense === "jour" ? pDepense : frequenceDepense === "semaine" ? pDepense / 7 : pDepense / 30
  const pObjectif = parseFloat(objectifMontant) || 0
  const pEcoJour = parseFloat(economieJour) || 0

  const inputClass = `w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[${GOLD_COLOR}]/40 transition`

  return (
    <div className="w-full h-full flex flex-col bg-[#050A14] text-slate-50">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-3 border-b border-white/[0.06] shrink-0">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.back()}
          className="w-9 h-9 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0"
          style={{ color: GOLD_COLOR }}>
          <ArrowLeft size={17} />
        </motion.button>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Cerveau</p>
          <h1 className="text-base font-bold text-white">💡 Conseils</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4 pb-6">

        {/* Categories accordion */}
        <div className="rounded-2xl bg-white/[0.04] border border-white/[0.07] p-4">
          <h2 className="text-sm font-bold mb-3" style={{ color: GOLD_COLOR }}>Catégories de conseils</h2>
          <div className="space-y-2">
            {Object.entries(categories).map(([cat, conseils]) => (
              <div key={cat}>
                <button
                  onClick={() => setOpenCategory(openCategory === cat ? null : cat)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition"
                  style={{
                    background: openCategory === cat ? `${GOLD_COLOR}15` : "rgba(255,255,255,0.04)",
                    color: openCategory === cat ? GOLD_COLOR : "rgba(255,255,255,0.6)",
                    border: `1px solid ${openCategory === cat ? GOLD_COLOR + "30" : "rgba(255,255,255,0.07)"}`,
                  }}>
                  <span>{cat} ({conseils.length})</span>
                  <span>{openCategory === cat ? "▲" : "▼"}</span>
                </button>
                <AnimatePresence>
                  {openCategory === cat && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}
                      className="overflow-hidden">
                      <div className="mt-2 space-y-2 pl-2">
                        {conseils.map((c, i) => (
                          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                            <h3 className="text-xs font-semibold mb-1" style={{ color: GOLD_COLOR }}>{c.titre}</h3>
                            <p className="text-[11px] leading-relaxed" style={{ color: `${GOLD_COLOR}99` }}>{c.description}</p>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Traps */}
        <div className="rounded-2xl bg-white/[0.04] border border-white/[0.07] p-4">
          <h2 className="text-sm font-bold mb-3" style={{ color: GOLD_COLOR }}>Reconnaître les pièges</h2>
          <div className="grid grid-cols-2 gap-2">
            {pieges.map((p, i) => (
              <div key={i} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                <h3 className="text-[11px] font-semibold mb-1" style={{ color: GOLD_COLOR }}>{p.titre}</h3>
                <p className="text-[10px] leading-snug" style={{ color: `${GOLD_COLOR}80` }}>{p.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Calculators */}
        <div className="rounded-2xl bg-white/[0.04] border border-white/[0.07] p-4">
          <h2 className="text-sm font-bold mb-3" style={{ color: GOLD_COLOR }}>Calculateurs</h2>

          {/* Tabs */}
          <div className="flex gap-1.5 mb-4">
            {(["economies", "depenses", "objectif"] as const).map(t => (
              <button key={t} onClick={() => setActiveCalculator(t)}
                className="flex-1 py-2 px-2 rounded-xl text-[10px] font-semibold transition"
                style={{
                  background: activeCalculator === t ? GOLD_COLOR : "rgba(255,255,255,0.06)",
                  color: activeCalculator === t ? "#050A14" : `${GOLD_COLOR}99`,
                }}>
                {t === "economies" ? "Économies" : t === "depenses" ? "Dépenses" : "Objectif"}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeCalculator === "economies" && (
              <motion.div key="eco" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }} className="space-y-3">
                <div>
                  <label className="text-[11px] mb-1.5 block" style={{ color: `${GOLD_COLOR}99` }}>Si j'économise par jour :</label>
                  <input type="number" value={montantJour} onChange={e => setMontantJour(e.target.value)}
                    className={inputClass} style={{ color: GOLD_COLOR }} placeholder="1" />
                </div>
                <div className="space-y-2 bg-white/[0.04] rounded-xl p-3">
                  {[["1 semaine", (pJour * 7).toFixed(2)], ["1 mois", (pJour * 30).toFixed(2)], ["1 an", (pJour * 365).toFixed(2)]].map(([label, val]) => (
                    <div key={label} className="flex justify-between text-xs">
                      <span style={{ color: `${GOLD_COLOR}80` }}>{label} :</span>
                      <span className="font-bold" style={{ color: GOLD_COLOR }}>{val} €</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-[10px] pt-2 border-t border-white/[0.06]">
                    <span style={{ color: `${GOLD_COLOR}60` }}>Avec Livret A (3%) :</span>
                    <span className="font-semibold text-emerald-400">{(pJour * 365 * 1.03).toFixed(2)} €</span>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] mb-1.5 block" style={{ color: `${GOLD_COLOR}99` }}>Ou par semaine :</label>
                  <input type="number" value={montantSemaine} onChange={e => setMontantSemaine(e.target.value)}
                    className={inputClass} style={{ color: GOLD_COLOR }} placeholder="5" />
                </div>
                <div className="space-y-2 bg-white/[0.04] rounded-xl p-3">
                  {[["1 mois", (pSemaine * 4).toFixed(2)], ["1 an", (pSemaine * 52).toFixed(2)]].map(([label, val]) => (
                    <div key={label} className="flex justify-between text-xs">
                      <span style={{ color: `${GOLD_COLOR}80` }}>{label} :</span>
                      <span className="font-bold" style={{ color: GOLD_COLOR }}>{val} €</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeCalculator === "depenses" && (
              <motion.div key="dep" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }} className="space-y-3">
                <div>
                  <label className="text-[11px] mb-1.5 block" style={{ color: `${GOLD_COLOR}99` }}>Nom de la dépense :</label>
                  <input type="text" value={nomDepense} onChange={e => setNomDepense(e.target.value)}
                    className={inputClass} style={{ color: GOLD_COLOR }} placeholder="Café, Netflix..." />
                </div>
                <div>
                  <label className="text-[11px] mb-1.5 block" style={{ color: `${GOLD_COLOR}99` }}>Montant (€) :</label>
                  <input type="number" value={montantDepense} onChange={e => setMontantDepense(e.target.value)}
                    className={inputClass} style={{ color: GOLD_COLOR }} placeholder="3.50" />
                </div>
                <div>
                  <label className="text-[11px] mb-1.5 block" style={{ color: `${GOLD_COLOR}99` }}>Fréquence :</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["jour","semaine","mois"] as const).map(f => (
                      <button key={f} onClick={() => setFrequenceDepense(f)}
                        className="py-2 rounded-xl text-[10px] font-semibold transition"
                        style={{
                          background: frequenceDepense === f ? GOLD_COLOR : "rgba(255,255,255,0.06)",
                          color: frequenceDepense === f ? "#050A14" : `${GOLD_COLOR}99`,
                        }}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2 bg-white/[0.04] rounded-xl p-3">
                  <p className="text-xs font-semibold mb-1" style={{ color: GOLD_COLOR }}>Coût de : {nomDepense}</p>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: `${GOLD_COLOR}80` }}>Par mois :</span>
                    <span className="font-bold text-orange-400">{(parJour * 30).toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: `${GOLD_COLOR}80` }}>Par an :</span>
                    <span className="font-bold text-red-400 text-base">{(parJour * 365).toFixed(2)} €</span>
                  </div>
                  <p className="text-[10px] pt-2 border-t border-white/[0.06]" style={{ color: `${GOLD_COLOR}60` }}>
                    En supprimant cette dépense, vous économisez {(parJour * 365).toFixed(2)} €/an !
                  </p>
                </div>
              </motion.div>
            )}

            {activeCalculator === "objectif" && (
              <motion.div key="obj" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }} className="space-y-3">
                <div>
                  <label className="text-[11px] mb-1.5 block" style={{ color: `${GOLD_COLOR}99` }}>Mon objectif (€) :</label>
                  <input type="number" value={objectifMontant} onChange={e => setObjectifMontant(e.target.value)}
                    className={inputClass} style={{ color: GOLD_COLOR }} placeholder="1000" />
                </div>
                <div>
                  <label className="text-[11px] mb-1.5 block" style={{ color: `${GOLD_COLOR}99` }}>J'économise par jour (€) :</label>
                  <input type="number" value={economieJour} onChange={e => setEconomieJour(e.target.value)}
                    className={inputClass} style={{ color: GOLD_COLOR }} placeholder="10" />
                </div>
                {pEcoJour > 0 && (
                  <div className="space-y-2 bg-white/[0.04] rounded-xl p-3">
                    <div className="text-center pb-2 border-b border-white/[0.06]">
                      <p className="text-[10px] mb-1" style={{ color: `${GOLD_COLOR}80` }}>Vous atteindrez votre objectif dans :</p>
                      <p className="font-bold text-3xl" style={{ color: GOLD_COLOR }}>{Math.ceil(pObjectif / pEcoJour)} jours</p>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: `${GOLD_COLOR}80` }}>Soit :</span>
                      <span className="font-semibold" style={{ color: GOLD_COLOR }}>{Math.ceil(Math.ceil(pObjectif / pEcoJour) / 7)} semaines</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: `${GOLD_COLOR}80` }}>Ou :</span>
                      <span className="font-semibold" style={{ color: GOLD_COLOR }}>{(Math.ceil(pObjectif / pEcoJour) / 30).toFixed(1)} mois</span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  )
}
