"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  X, LogOut, ChevronRight, User, Bell, Shield, CreditCard,
  Globe, Moon, HelpCircle, FileText, Star, Gift, Smartphone,
  Eye, EyeOff, Copy, Check, Settings, TrendingUp, Wallet,
  Lock, Key, Fingerprint, Languages, Palette, Volume2, Wifi,
  MessageCircle, BookOpen, AlertTriangle, Info
} from "lucide-react"
import { signOut, updateProfile } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { useAuth } from "@/components/AuthProvider"
import { GOLD, GOLD_DIM, BG_CARD, BORDER } from "@/lib/theme"

interface ProfileMenuProps {
  open: boolean
  onClose: () => void
  accountName?: string
  accountNumber?: string
  solde?: number | null
}

type Screen = "main" | "personal" | "security" | "notifications" | "appearance" | "help" | "legal"

const PLAN_COLOR = `linear-gradient(135deg, ${GOLD}, #C49A00)`

export default function ProfileMenu({ open, onClose, accountName, accountNumber, solde }: ProfileMenuProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [screen, setScreen] = useState<Screen>("main")
  const [ibanVisible, setIbanVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  // Toggles notifications
  const [notifs, setNotifs] = useState({
    transactions: true,
    budget: true,
    conseils: false,
    promo: false,
  })

  // Toggles appearance
  const [darkMode, setDarkMode] = useState(true)
  const [haptics, setHaptics]   = useState(true)
  const [sounds, setSounds]     = useState(false)

  // Nom modifiable (init depuis Firebase, éditable par l'utilisateur)
  const [nameValue, setNameValue]   = useState("")
  const [editingName, setEditingName] = useState(false)
  const [draftName, setDraftName]   = useState("")
  const [savingName, setSavingName] = useState(false)

  const displayName = (nameValue || user?.displayName || user?.email?.split("@")[0] || "Utilisateur").replace(/[._-]+/g, " ").replace(/\s+/g, " ").trim()
  const email       = user?.email || ""
  const initials    = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)

  async function saveName() {
    const clean = draftName.trim()
    if (!clean || !auth.currentUser) { setEditingName(false); return }
    setSavingName(true)
    try {
      await updateProfile(auth.currentUser, { displayName: clean })
      await setDoc(doc(db, "users", auth.currentUser.uid), { name: clean }, { merge: true })
      setNameValue(clean)
      setEditingName(false)
    } catch (e) {
      console.error("Erreur sauvegarde nom:", e)
    } finally {
      setSavingName(false)
    }
  }

  const fakeIban = "FR76 3000 4000 0300 0000 0000 123"

  function copyIban() {
    navigator.clipboard.writeText(fakeIban.replace(/\s/g, ""))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleLogout() {
    await signOut(auth)
    onClose()
    router.replace("/login")
  }

  function navigate(route: string) {
    onClose()
    router.push(route)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            className="absolute inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer slide from left */}
          <motion.div
            className="absolute inset-y-0 left-0 z-50 flex flex-col"
            style={{ width: "88%", background: "#080F1E", borderRight: `1px solid ${BORDER}` }}
            initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            <AnimatePresence mode="wait">

              {/* ──────────── MAIN ──────────── */}
              {screen === "main" && (
                <motion.div key="main" className="flex flex-col h-full overflow-y-auto"
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>

                  {/* Header profil */}
                  <div className="px-5 pt-12 pb-5 shrink-0"
                    style={{ background: "linear-gradient(180deg, #0d1e3a 0%, #080F1E 100%)" }}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black shrink-0"
                        style={{ background: PLAN_COLOR, color: "#050A14" }}>
                        {initials}
                      </div>
                      <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center mt-1"
                        style={{ background: "rgba(255,255,255,0.08)" }}>
                        <X size={15} color="rgba(255,255,255,0.6)" />
                      </button>
                    </div>
                    <p className="text-white font-bold text-lg leading-tight">{displayName}</p>
                    <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>{email}</p>

                    {/* Badge plan */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4"
                      style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}44` }}>
                      <Star size={11} color={GOLD} fill={GOLD} />
                      <span className="text-[11px] font-bold" style={{ color: GOLD }}>Finéa Premium</span>
                    </div>

                    {/* Compte bancaire */}
                    <div className="rounded-2xl p-3.5" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}` }}>
                      <p className="text-[10px] mb-1 font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>
                        {accountName || "Compte courant"}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-mono text-white">
                          {ibanVisible ? fakeIban : "FR76 •••• •••• •••• •••• ••••"}
                        </p>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setIbanVisible(v => !v)}>
                            {ibanVisible ? <EyeOff size={13} color="rgba(255,255,255,0.35)" /> : <Eye size={13} color="rgba(255,255,255,0.35)" />}
                          </button>
                          <button onClick={copyIban}>
                            {copied ? <Check size={13} color={GOLD} /> : <Copy size={13} color="rgba(255,255,255,0.35)" />}
                          </button>
                        </div>
                      </div>
                      {solde != null && (
                        <p className="text-lg font-bold mt-1.5" style={{ color: GOLD }}>
                          {solde.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Sections */}
                  <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2">

                    {/* MON COMPTE */}
                    <SectionLabel label="MON COMPTE" />
                    <MenuGroup>
                      <MenuItem icon={<User size={16} />}   label="Informations personnelles" sub="Nom, email, téléphone"   onPress={() => setScreen("personal")} />
                      <MenuItem icon={<Shield size={16} />} label="Sécurité & confidentialité" sub="PIN, biométrie, 2FA"     onPress={() => setScreen("security")} />
                      <MenuItem icon={<CreditCard size={16} />} label="Mes cartes"             sub="Gérer, bloquer, limites" onPress={() => navigate("/cartes")} />
                      <MenuItem icon={<Wallet size={16} />} label="Épargne"                    sub="Livrets, objectifs"      onPress={() => navigate("/epargne")} />
                    </MenuGroup>

                    {/* FINANCES */}
                    <SectionLabel label="FINANCES" />
                    <MenuGroup>
                      <MenuItem icon={<TrendingUp size={16} />} label="Statistiques"      sub="Analyse de tes dépenses"  onPress={() => navigate("/statistiques")} />
                      <MenuItem icon={<FileText size={16} />}   label="Relevés & exports" sub="PDF, Excel, CSV"           onPress={() => {}} badge="Bientôt" />
                      <MenuItem icon={<Globe size={16} />}      label="Convertisseur"     sub="Taux en temps réel"        onPress={() => navigate("/plus")} />
                    </MenuGroup>

                    {/* PRÉFÉRENCES */}
                    <SectionLabel label="PRÉFÉRENCES" />
                    <MenuGroup>
                      <MenuItem icon={<Bell size={16} />}    label="Notifications"  sub="Alertes, rappels"    onPress={() => setScreen("notifications")} />
                      <MenuItem icon={<Palette size={16} />} label="Apparence"      sub="Thème, affichage"    onPress={() => setScreen("appearance")} />
                      <MenuItem icon={<Languages size={16} />} label="Langue"       sub="Français"            onPress={() => {}} badge="FR" nochevron />
                    </MenuGroup>

                    {/* AIDE & SUPPORT */}
                    <SectionLabel label="AIDE & SUPPORT" />
                    <MenuGroup>
                      <MenuItem icon={<MessageCircle size={16} />} label="Contacter le support" sub="Chat, email"           onPress={() => navigate("/coach")} />
                      <MenuItem icon={<BookOpen size={16} />}      label="Centre d'aide"         sub="FAQ, tutoriels"        onPress={() => setScreen("help")} />
                      <MenuItem icon={<Gift size={16} />}          label="Parrainage"             sub="Inviter des amis"      onPress={() => {}} badge="50 €" />
                      <MenuItem icon={<Info size={16} />}          label="Mentions légales"       sub="CGU, confidentialité"  onPress={() => setScreen("legal")} />
                    </MenuGroup>

                    {/* Déconnexion */}
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl mt-2 transition-all active:scale-[0.98]"
                      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ background: "rgba(239,68,68,0.15)" }}>
                        <LogOut size={15} color="#f87171" />
                      </div>
                      <span className="text-sm font-semibold text-red-400">Se déconnecter</span>
                    </button>

                    <p className="text-center text-[10px] mt-3 pb-2" style={{ color: "rgba(255,255,255,0.2)" }}>
                      Finéa v2.0 · Made with 💛
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ──────────── PERSONAL ──────────── */}
              {screen === "personal" && (
                <motion.div key="personal" className="flex flex-col h-full overflow-y-auto"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <SubHeader title="Informations personnelles" onBack={() => setScreen("main")} onClose={onClose} />
                  <div className="px-4 py-4 space-y-3">
                    {/* Nom modifiable */}
                    <div className="rounded-2xl px-4 py-3" style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>Prénom & Nom</p>
                        {!editingName && (
                          <button onClick={() => { setDraftName(displayName); setEditingName(true) }}
                            className="text-[11px] font-semibold" style={{ color: GOLD }}>
                            Modifier
                          </button>
                        )}
                      </div>
                      {editingName ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input autoFocus value={draftName} onChange={e => setDraftName(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") saveName() }}
                            placeholder="Ton nom complet"
                            className="flex-1 rounded-xl px-3 py-2 text-sm text-white outline-none"
                            style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${GOLD}44` }} />
                          <button onClick={saveName} disabled={savingName || !draftName.trim()}
                            className="px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-40"
                            style={{ background: GOLD, color: "#050A14" }}>
                            {savingName ? "..." : "OK"}
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-white">{displayName}</p>
                      )}
                    </div>
                    <InfoCard label="Email"           value={email} />
                    <InfoCard label="Téléphone"       value="+33 6 •• •• •• ••" masked />
                    <InfoCard label="Date de naissance" value="•• / •• / ••••" masked />
                    <InfoCard label="Adresse"         value="Paris, France" />

                    <div className="rounded-2xl p-4 mt-2"
                      style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}30` }}>
                      <div className="flex items-center gap-2 mb-1">
                        <Check size={14} color={GOLD} />
                        <p className="text-xs font-bold" style={{ color: GOLD }}>Identité vérifiée</p>
                      </div>
                      <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                        Ton identité a été vérifiée avec succès.
                      </p>
                    </div>

                    <ActionButton label="Modifier mon nom" icon={<Settings size={14} />}
                      onClick={() => { setDraftName(displayName); setEditingName(true) }} />
                    <ActionButton label="Changer mon mot de passe"  icon={<Lock size={14} />} />
                  </div>
                </motion.div>
              )}

              {/* ──────────── SECURITY ──────────── */}
              {screen === "security" && (
                <motion.div key="security" className="flex flex-col h-full overflow-y-auto"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <SubHeader title="Sécurité & confidentialité" onBack={() => setScreen("main")} onClose={onClose} />
                  <div className="px-4 py-4 space-y-3">

                    <SectionLabel label="CONNEXION" />
                    <MenuGroup>
                      <ToggleItem icon={<Fingerprint size={15} />} label="Face ID / Empreinte"  sub="Connexion biométrique"  on={true}  />
                      <ToggleItem icon={<Lock size={15} />}        label="Code PIN"              sub="4 chiffres à la connexion" on={true}  />
                      <ToggleItem icon={<Shield size={15} />}      label="Double authentification" sub="SMS ou application"   on={false} />
                    </MenuGroup>

                    <SectionLabel label="VIE PRIVÉE" />
                    <MenuGroup>
                      <ToggleItem icon={<Eye size={15} />}     label="Masquer les montants"  sub="À l'ouverture de l'app"  on={false} />
                      <ToggleItem icon={<Wifi size={15} />}    label="Connexion sécurisée"   sub="TLS 1.3 activé"          on={true} noedit />
                    </MenuGroup>

                    <SectionLabel label="APPAREILS" />
                    <MenuGroup>
                      <MenuItem icon={<Smartphone size={15} />} label="Cet appareil"  sub="iPhone · Actif maintenant" onPress={() => {}} nochevron />
                    </MenuGroup>

                    <ActionButton label="Signaler un problème" icon={<AlertTriangle size={14} />} danger />
                    <ActionButton label="Supprimer mon compte" icon={<X size={14} />} danger />
                  </div>
                </motion.div>
              )}

              {/* ──────────── NOTIFICATIONS ──────────── */}
              {screen === "notifications" && (
                <motion.div key="notifs" className="flex flex-col h-full overflow-y-auto"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <SubHeader title="Notifications" onBack={() => setScreen("main")} onClose={onClose} />
                  <div className="px-4 py-4 space-y-3">
                    <SectionLabel label="ALERTES" />
                    <MenuGroup>
                      <ToggleItem icon={<CreditCard size={15} />} label="Transactions"       sub="Chaque paiement effectué"         on={notifs.transactions} onToggle={() => setNotifs(n => ({ ...n, transactions: !n.transactions }))} />
                      <ToggleItem icon={<TrendingUp size={15} />} label="Budget dépassé"     sub="Quand tu dépasses une catégorie"  on={notifs.budget}       onToggle={() => setNotifs(n => ({ ...n, budget: !n.budget }))} />
                      <ToggleItem icon={<Star size={15} />}       label="Conseils Finéa"     sub="Astuces personnalisées"           on={notifs.conseils}     onToggle={() => setNotifs(n => ({ ...n, conseils: !n.conseils }))} />
                      <ToggleItem icon={<Gift size={15} />}       label="Offres & actualités" sub="Nouveautés de l'application"    on={notifs.promo}        onToggle={() => setNotifs(n => ({ ...n, promo: !n.promo }))} />
                    </MenuGroup>
                  </div>
                </motion.div>
              )}

              {/* ──────────── APPEARANCE ──────────── */}
              {screen === "appearance" && (
                <motion.div key="appearance" className="flex flex-col h-full overflow-y-auto"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <SubHeader title="Apparence" onBack={() => setScreen("main")} onClose={onClose} />
                  <div className="px-4 py-4 space-y-3">
                    <SectionLabel label="THÈME" />
                    <MenuGroup>
                      <ToggleItem icon={<Moon size={15} />}      label="Mode sombre"   sub="Recommandé pour économiser la batterie" on={darkMode} onToggle={() => setDarkMode(v => !v)} />
                    </MenuGroup>
                    <SectionLabel label="RETOURS" />
                    <MenuGroup>
                      <ToggleItem icon={<Smartphone size={15} />} label="Vibrations"  sub="Retour haptique"         on={haptics} onToggle={() => setHaptics(v => !v)} />
                      <ToggleItem icon={<Volume2 size={15} />}    label="Sons"        sub="Confirmation de paiement" on={sounds}  onToggle={() => setSounds(v => !v)} />
                    </MenuGroup>

                    <SectionLabel label="DEVISE PAR DÉFAUT" />
                    <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
                      {[
                        { code: "EUR", symbol: "€", name: "Euro" },
                        { code: "USD", symbol: "$", name: "Dollar américain" },
                        { code: "GBP", symbol: "£", name: "Livre sterling" },
                      ].map((c, i) => (
                        <button key={c.code}
                          className="w-full flex items-center justify-between px-4 py-3"
                          style={{ background: i === 0 ? `${GOLD}12` : "rgba(255,255,255,0.03)", borderTop: i > 0 ? `1px solid ${BORDER}` : "none" }}>
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{c.symbol}</span>
                            <div className="text-left">
                              <p className="text-xs font-semibold text-white">{c.code}</p>
                              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{c.name}</p>
                            </div>
                          </div>
                          {i === 0 && <Check size={14} color={GOLD} />}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ──────────── HELP ──────────── */}
              {screen === "help" && (
                <motion.div key="help" className="flex flex-col h-full overflow-y-auto"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <SubHeader title="Centre d'aide" onBack={() => setScreen("main")} onClose={onClose} />
                  <div className="px-4 py-4 space-y-2">
                    {[
                      { q: "Comment importer mon relevé ?",       a: "Va dans l'onglet + puis appuie sur Importer un fichier Excel." },
                      { q: "Comment fonctionne Finéa Coach ?",    a: "Finéa utilise l'IA GPT-4 avec accès à tes données pour répondre à tes questions financières." },
                      { q: "Mes données sont-elles sécurisées ?", a: "Oui, toutes tes données sont chiffrées et stockées sur Firebase avec accès privé." },
                      { q: "Comment créer un objectif d'épargne ?", a: "Va dans Épargne → onglet Objectifs → Nouvel objectif." },
                      { q: "Comment contacter le support ?",      a: "Via Finéa Coach ou par email à support@finea.app" },
                    ].map((item, i) => (
                      <div key={i} className="rounded-2xl p-4" style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>
                        <p className="text-xs font-semibold text-white mb-1.5">{item.q}</p>
                        <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{item.a}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ──────────── LEGAL ──────────── */}
              {screen === "legal" && (
                <motion.div key="legal" className="flex flex-col h-full overflow-y-auto"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <SubHeader title="Mentions légales" onBack={() => setScreen("main")} onClose={onClose} />
                  <div className="px-4 py-4 space-y-3">
                    <MenuGroup>
                      <MenuItem icon={<FileText size={15} />} label="Conditions d'utilisation"   sub="CGU · Version 2.0"     onPress={() => {}} />
                      <MenuItem icon={<Shield size={15} />}   label="Politique de confidentialité" sub="RGPD · Données"      onPress={() => {}} />
                      <MenuItem icon={<Info size={15} />}     label="Licences open source"        sub="Bibliothèques tierces" onPress={() => {}} />
                    </MenuGroup>
                    <div className="rounded-2xl p-4" style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>
                      <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                        Finéa est une application de gestion financière personnelle. Les données présentées sont à titre informatif uniquement et ne constituent pas un conseil financier professionnel.
                      </p>
                      <p className="text-[10px] mt-2" style={{ color: "rgba(255,255,255,0.25)" }}>
                        © 2025 Finéa · Tous droits réservés
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── Sous-composants ──

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="text-[10px] font-black tracking-[2px] px-1 pt-2 pb-1" style={{ color: "rgba(255,255,255,0.25)" }}>
      {label}
    </p>
  )
}

function MenuGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
      {children}
    </div>
  )
}

function MenuItem({ icon, label, sub, onPress, badge, nochevron }: {
  icon: React.ReactNode; label: string; sub?: string; onPress: () => void; badge?: string; nochevron?: boolean
}) {
  return (
    <button onClick={onPress}
      className="w-full flex items-center gap-3 px-4 py-3.5 transition-all active:bg-white/5"
      style={{ borderBottom: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.025)" }}
    >
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "rgba(255,255,255,0.07)" }}>
        <span style={{ color: GOLD }}>{icon}</span>
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className="text-xs font-semibold text-white truncate">{label}</p>
        {sub && <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.38)" }}>{sub}</p>}
      </div>
      {badge && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
          style={{ background: `${GOLD}22`, color: GOLD }}>{badge}</span>
      )}
      {!nochevron && <ChevronRight size={14} color="rgba(255,255,255,0.25)" className="shrink-0" />}
    </button>
  )
}

function ToggleItem({ icon, label, sub, on, onToggle, noedit }: {
  icon: React.ReactNode; label: string; sub?: string; on: boolean; onToggle?: () => void; noedit?: boolean
}) {
  return (
    <div className="w-full flex items-center gap-3 px-4 py-3.5"
      style={{ borderBottom: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.025)" }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "rgba(255,255,255,0.07)" }}>
        <span style={{ color: GOLD }}>{icon}</span>
      </div>
      <div className="flex-1 text-left">
        <p className="text-xs font-semibold text-white">{label}</p>
        {sub && <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.38)" }}>{sub}</p>}
      </div>
      {!noedit && (
        <button onClick={onToggle}
          className="w-11 h-6 rounded-full relative shrink-0 transition-all"
          style={{ background: on ? GOLD : "rgba(255,255,255,0.15)" }}>
          <motion.div animate={{ x: on ? 20 : 2 }}
            className="absolute top-1 w-4 h-4 rounded-full"
            style={{ background: on ? "#050A14" : "rgba(255,255,255,0.6)" }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }} />
        </button>
      )}
    </div>
  )
}

function InfoCard({ label, value, masked }: { label: string; value: string; masked?: boolean }) {
  return (
    <div className="rounded-2xl px-4 py-3" style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>
      <p className="text-[10px] font-semibold mb-0.5 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>{label}</p>
      <p className="text-sm text-white">{value}</p>
    </div>
  )
}

function ActionButton({ label, icon, danger, onClick }: { label: string; icon: React.ReactNode; danger?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all active:scale-[0.98]"
      style={{
        background: danger ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${danger ? "rgba(239,68,68,0.2)" : BORDER}`,
      }}>
      <span style={{ color: danger ? "#f87171" : GOLD }}>{icon}</span>
      <span className="text-sm font-medium" style={{ color: danger ? "#f87171" : "rgba(255,255,255,0.7)" }}>{label}</span>
    </button>
  )
}

function SubHeader({ title, onBack, onClose }: { title: string; onBack: () => void; onClose: () => void }) {
  return (
    <div className="flex items-center gap-3 px-5 pt-12 pb-4 shrink-0"
      style={{ borderBottom: `1px solid ${BORDER}` }}>
      <button onClick={onBack} className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: "rgba(255,255,255,0.08)" }}>
        <ChevronRight size={16} color="rgba(255,255,255,0.6)" style={{ transform: "rotate(180deg)" }} />
      </button>
      <p className="flex-1 text-base font-bold text-white">{title}</p>
      <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: "rgba(255,255,255,0.08)" }}>
        <X size={14} color="rgba(255,255,255,0.6)" />
      </button>
    </div>
  )
}
