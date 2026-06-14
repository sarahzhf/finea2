"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, Lock, Mail, Check, ArrowRight, ArrowLeft } from "lucide-react"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { GOLD, GOLD_DIM } from "@/lib/theme"
import { User as UserIcon } from "lucide-react"

const REASONS = [
  { id: "budget",   label: "Gérer mon budget",        icon: "💰" },
  { id: "savings",  label: "Épargner pour un projet",  icon: "🐷" },
  { id: "debts",    label: "Rembourser mes dettes",    icon: "📉" },
  { id: "invest",   label: "Investir mon argent",      icon: "📈" },
  { id: "learning", label: "Apprendre la finance",     icon: "🧠" },
  { id: "scanner",  label: "Scanner mes factures",     icon: "📄" },
]

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep]                   = useState(1)
  const [name, setName]                   = useState("")
  const [email, setEmail]                 = useState("")
  const [password, setPassword]           = useState("")
  const [showPwd, setShowPwd]             = useState(false)
  const [selected, setSelected]           = useState<string[]>([])
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState<string | null>(null)

  const isSecure = password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)

  function toggleReason(id: string) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      const cleanName = name.trim()
      if (cleanName) {
        await updateProfile(cred.user, { displayName: cleanName })
      }
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        email: cred.user.email,
        name: cleanName,
        createdAt: new Date(),
        onboardingReasons: selected,
      })
      router.replace("/dashboard")
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("Cet email est déjà utilisé.")
      } else {
        setError(err.message || "Une erreur est survenue.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#050A14] overflow-y-auto">
      <div className="absolute top-0 left-0 w-full h-64 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% -20%, ${GOLD}18 0%, transparent 70%)` }} />

      <div className="flex-1 flex flex-col px-6 pt-14 pb-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8">
          <button onClick={() => step === 2 ? setStep(1) : router.push("/login")}
            className="flex items-center gap-1.5 text-sm"
            style={{ color: "rgba(255,255,255,0.5)" }}>
            <ArrowLeft size={16} />
            {step === 2 ? "Retour" : "Connexion"}
          </button>
          <span className="text-xs font-bold" style={{ color: GOLD + "88" }}>{step} / 2</span>
        </motion.div>

        {/* Titre */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <h1 className="text-2xl font-black text-white">
            {step === 1 ? "Créer un compte" : "Personalise ton expérience"}
          </h1>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.38)" }}>
            {step === 1 ? "Commence ton voyage financier avec Finéa" : "Qu'est-ce qui t'amène sur Finéa ?"}
          </p>
          {/* Barre de progression */}
          <div className="mt-4 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <motion.div className="h-full rounded-full"
              animate={{ width: step === 1 ? "50%" : "100%" }}
              style={{ background: `linear-gradient(90deg, ${GOLD}, ${GOLD_DIM})` }} />
          </div>
        </motion.div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mb-4 px-3 py-2.5 rounded-xl text-xs flex items-center gap-2"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}>
            ⚠️ {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-4">

              {/* Nom */}
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(255,255,255,0.5)" }}>Nom complet</label>
                <div className="relative">
                  <UserIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.3)" }} />
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Ex : Sarah Zahaf"
                    className="w-full rounded-xl py-3 pl-10 pr-4 text-sm text-white outline-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(255,255,255,0.5)" }}>Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.3)" }} />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="exemple@email.com"
                    className="w-full rounded-xl py-3 pl-10 pr-4 text-sm text-white outline-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(255,255,255,0.5)" }}>Mot de passe</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.3)" }} />
                  <input type={showPwd ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 8 car., 1 majuscule, 1 chiffre"
                    className="w-full rounded-xl py-3 pl-10 pr-10 text-sm text-white outline-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {/* Indicateurs force */}
                <div className="flex gap-1.5 mt-2">
                  {[password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password)].map((ok, i) => (
                    <div key={i} className="h-1 flex-1 rounded-full transition-all"
                      style={{ background: ok ? GOLD : "rgba(255,255,255,0.1)" }} />
                  ))}
                </div>
                <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                  8+ caractères · Majuscule · Chiffre
                </p>
              </div>

              <motion.button whileTap={{ scale: 0.97 }}
                disabled={!name.trim() || !email || !isSecure}
                onClick={() => setStep(2)}
                className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-40"
                style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DIM})`, color: "#050A14" }}>
                Continuer <ArrowRight size={16} />
              </motion.button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-4">

              <div className="grid grid-cols-2 gap-2.5">
                {REASONS.map(r => {
                  const on = selected.includes(r.id)
                  return (
                    <motion.button key={r.id} whileTap={{ scale: 0.95 }}
                      onClick={() => toggleReason(r.id)}
                      className="rounded-2xl p-3.5 text-left relative transition-all"
                      style={{
                        background: on ? `${GOLD}18` : "rgba(255,255,255,0.04)",
                        border: `1px solid ${on ? GOLD + "66" : "rgba(255,255,255,0.08)"}`,
                      }}>
                      <span className="text-xl mb-1.5 block">{r.icon}</span>
                      <span className="text-xs font-semibold" style={{ color: on ? "white" : "rgba(255,255,255,0.55)" }}>
                        {r.label}
                      </span>
                      {on && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ background: GOLD }}>
                          <Check size={10} color="#050A14" strokeWidth={3} />
                        </div>
                      )}
                    </motion.button>
                  )
                })}
              </div>

              <motion.button whileTap={{ scale: 0.97 }}
                disabled={selected.length === 0 || loading}
                onClick={handleSubmit}
                className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-40"
                style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DIM})`, color: "#050A14" }}>
                {loading
                  ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  : "Créer mon compte 🚀"
                }
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-xs mt-6" style={{ color: "rgba(255,255,255,0.38)" }}>
          Déjà un compte ?{" "}
          <button onClick={() => router.push("/login")} className="font-bold" style={{ color: GOLD }}>
            Se connecter
          </button>
        </p>
      </div>
    </div>
  )
}
