"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Eye, EyeOff, Lock, Mail, ArrowRight } from "lucide-react"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useAuth } from "@/components/AuthProvider"
import { GOLD, GOLD_DIM } from "@/lib/theme"

export default function LoginPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [email, setEmail]             = useState("")
  const [password, setPassword]       = useState("")
  const [showPwd, setShowPwd]         = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  // Déjà connecté → dashboard directement
  useEffect(() => {
    if (!authLoading && user) router.replace("/dashboard")
  }, [user, authLoading])

  // Pendant la vérification Firebase, on attend silencieusement
  if (authLoading) return (
    <div className="w-full h-full flex items-center justify-center bg-[#050A14]">
      <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${GOLD} transparent transparent transparent` }} />
    </div>
  )

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.replace("/dashboard")
    } catch (err: any) {
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        setError("Email ou mot de passe incorrect.")
      } else {
        setError("Une erreur est survenue. Réessaie.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#050A14] overflow-y-auto">
      {/* Fond avec glow */}
      <div className="absolute top-0 left-0 w-full h-64 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% -20%, ${GOLD}18 0%, transparent 70%)` }} />

      <div className="flex-1 flex flex-col px-6 pt-16 pb-10">

        {/* Logo + titre */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DIM})` }}>
            <span className="text-2xl font-black text-[#050A14]">F</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">FINÉA</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            Ton coach financier personnel
          </p>
        </motion.div>

        {/* Carte formulaire */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-3xl p-6"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>

          <h2 className="text-xl font-bold text-white mb-1">Bon retour ! 👋</h2>
          <p className="text-xs mb-6" style={{ color: "rgba(255,255,255,0.38)" }}>
            Connecte-toi pour accéder à ton espace
          </p>

          {error && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              className="mb-4 px-3 py-2.5 rounded-xl text-xs flex items-center gap-2"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}>
              ⚠️ {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(255,255,255,0.5)" }}>
                Email
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.3)" }} />
                <input
                  type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="exemple@email.com"
                  className="w-full rounded-xl py-3 pl-10 pr-4 text-sm text-white outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                  onFocus={e => e.currentTarget.style.borderColor = GOLD + "66"}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(255,255,255,0.5)" }}>
                Mot de passe
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.3)" }} />
                <input
                  type={showPwd ? "text" : "password"} required value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl py-3 pl-10 pr-10 text-sm text-white outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                  onFocus={e => e.currentTarget.style.borderColor = GOLD + "66"}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: "rgba(255,255,255,0.3)" }}>
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <button type="button" className="text-[11px] mt-1.5 ml-0.5"
                style={{ color: GOLD + "bb" }}>
                Mot de passe oublié ?
              </button>
            </div>

            {/* Bouton */}
            <motion.button type="submit" disabled={loading || !email || !password}
              whileTap={{ scale: 0.97 }}
              className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-50 transition"
              style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DIM})`, color: "#050A14" }}>
              {loading
                ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                : <><span>Se connecter</span><ArrowRight size={16} /></>
              }
            </motion.button>
          </form>
        </motion.div>

        {/* Lien inscription */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-center text-xs mt-6" style={{ color: "rgba(255,255,255,0.38)" }}>
          Pas encore de compte ?{" "}
          <button onClick={() => router.push("/signup")}
            className="font-bold" style={{ color: GOLD }}>
            Créer un compte
          </button>
        </motion.p>

      </div>
    </div>
  )
}
