"use client"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, FileSpreadsheet, WifiOff, CheckCircle, AlertCircle, X, Trash2 } from "lucide-react"
import { GOLD, BG_CARD, BORDER } from "@/lib/theme"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore"

const DEMO_USER = "demo-user"
type Status = "idle" | "uploading" | "done" | "error"

export default function Ajouter() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [status, setStatus]   = useState<Status>("idle")
  const [count, setCount]       = useState(0)
  const [errMsg, setErrMsg]     = useState("")
  const [fileName, setFileName] = useState("")
  const [progress, setProgress] = useState(0)
  const [accountName, setAccountName]     = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [solde, setSolde]                 = useState<number | null>(null)
  const [cleaning, setCleaning]           = useState(false)
  const [cleanDone, setCleanDone]         = useState(false)
  const [confirmClean, setConfirmClean]   = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setStatus("uploading")
    setProgress(0)
    setErrMsg("")

    // Animate progress bar
    const interval = setInterval(() => setProgress(p => Math.min(p + 8, 88)), 120)

    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/import", { method: "POST", body: form })
      clearInterval(interval)
      setProgress(100)
      const data = await res.json()
      if (!res.ok || !data.success) {
        setErrMsg(data.error ?? "Erreur inconnue")
        setStatus("error")
      } else {
        setCount(data.count)
        if (data.accountName)   setAccountName(data.accountName)
        if (data.accountNumber) setAccountNumber(data.accountNumber)
        if (data.solde != null) setSolde(data.solde)
        setStatus("done")
        window.dispatchEvent(new Event("transactions-updated"))
      }
    } catch (err: any) {
      clearInterval(interval)
      setErrMsg(err.message ?? "Erreur réseau")
      setStatus("error")
    }
    // Reset input so same file can be re-imported
    if (fileRef.current) fileRef.current.value = ""
  }

  function reset() {
    setStatus("idle")
    setFileName("")
    setProgress(0)
    setErrMsg("")
    setAccountName("")
    setAccountNumber("")
    setSolde(null)
  }

  async function cleanTransactions() {
    setCleaning(true)
    setCleanDone(false)
    try {
      const q = query(collection(db, "transactions"), where("userId", "==", DEMO_USER))
      const snap = await getDocs(q)
      await Promise.all(snap.docs.map(d => deleteDoc(doc(db, "transactions", d.id))))
      setCleanDone(true)
      setConfirmClean(false)
      reset()
      window.dispatchEvent(new Event("transactions-updated"))
      setTimeout(() => setCleanDone(false), 3000)
    } catch (e) {
      console.error(e)
    } finally {
      setCleaning(false)
    }
  }

  const isUploading = status === "uploading"
  const isDone      = status === "done"
  const isError     = status === "error"

  return (
    <div className="w-full h-full overflow-y-auto px-5 pt-10 pb-6">

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFile}
      />

      {/* Back */}
      <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.back()}
        className="flex items-center gap-2 mb-7" style={{ color: GOLD }}
        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
        <ArrowLeft size={18} />
        <span className="text-sm font-semibold">Retour</span>
      </motion.button>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <h1 className="text-[26px] font-bold text-white mb-1">Ajouter des données</h1>
        <p className="text-sm mb-7" style={{ color: "rgba(255,255,255,0.38)" }}>
          Importez votre relevé bancaire pour analyser vos finances
        </p>
      </motion.div>

      {/* Excel tile */}
      <motion.button
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        whileTap={status === "idle" ? { scale: 0.97 } : {}}
        onClick={() => status === "idle" && fileRef.current?.click()}
        disabled={isUploading}
        className="w-full rounded-3xl p-5 flex items-start gap-4 text-left mb-4 relative overflow-hidden"
        style={{
          background: isDone
            ? "linear-gradient(135deg, rgba(74,222,128,0.12), rgba(74,222,128,0.04))"
            : isError
            ? "linear-gradient(135deg, rgba(248,113,113,0.12), rgba(248,113,113,0.04))"
            : `linear-gradient(135deg, rgba(236,204,104,0.14), rgba(236,204,104,0.04))`,
          border: `1.5px solid ${isDone ? "rgba(74,222,128,0.4)" : isError ? "rgba(248,113,113,0.4)" : "rgba(236,204,104,0.38)"}`,
          boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
        }}
      >
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
          style={{
            background: isDone ? "rgba(74,222,128,0.15)" : isError ? "rgba(248,113,113,0.15)" : "rgba(236,204,104,0.14)",
            border: `1px solid ${isDone ? "rgba(74,222,128,0.3)" : isError ? "rgba(248,113,113,0.3)" : "rgba(236,204,104,0.28)"}`,
          }}>
          {isDone
            ? <CheckCircle size={26} color="#4ade80" />
            : isError
            ? <AlertCircle size={26} color="#f87171" />
            : <FileSpreadsheet size={26} color={GOLD} />}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-base text-white mb-1">
            {isDone ? "Import réussi ✓" : isError ? "Erreur d'import" : "Téléverser un relevé bancaire"}
          </p>
          <p className="text-xs mb-2 truncate" style={{ color: "rgba(255,255,255,0.45)" }}>
            {isDone
              ? `${count} transaction${count > 1 ? "s" : ""} importée${count > 1 ? "s" : ""} depuis ${fileName}`
              : isError
              ? errMsg
              : fileName
              ? fileName
              : "Formats acceptés : .xlsx · .csv · .xls"}
          </p>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: isDone ? "#4ade80" : isError ? "#f87171" : "#4ade80" }} />
            <span className="text-xs font-semibold" style={{ color: isDone ? "#4ade80" : isError ? "#f87171" : "#4ade80" }}>
              {isUploading ? "Analyse en cours…" : isDone ? "Données intégrées" : isError ? "Réessayer" : "Disponible"}
            </span>
          </div>
        </div>

        {/* Reset button */}
        {(isDone || isError) && (
          <button onClick={e => { e.stopPropagation(); reset() }}
            className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <X size={14} color="rgba(255,255,255,0.5)" />
          </button>
        )}

        {/* Progress bar */}
        <AnimatePresence>
          {isUploading && (
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              exit={{ opacity: 0 }}
              transition={{ ease: "easeInOut" }}
              className="absolute bottom-0 left-0 h-0.5 rounded-full"
              style={{ background: GOLD }}
            />
          )}
          {isDone && (
            <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }}
              className="absolute bottom-0 left-0 h-0.5 rounded-full bg-[#4ade80]"
              transition={{ duration: 0.4 }} />
          )}
        </AnimatePresence>
      </motion.button>

      {/* Récap compte + bouton dashboard */}
      <AnimatePresence>
        {isDone && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4 space-y-3">
            {/* Infos compte */}
            {(accountName || solde !== null) && (
              <div className="rounded-2xl p-4" style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">🏦</span>
                  <p className="text-sm font-bold text-white">{accountName || "Compte importé"}</p>
                </div>
                {accountNumber && <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Compte n° {accountNumber}</p>}
                {solde !== null && (
                  <p className="text-lg font-bold" style={{ color: "#4ade80" }}>
                    Solde : {solde.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                  </p>
                )}
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {count} transaction{count > 1 ? "s" : ""} importée{count > 1 ? "s" : ""}
                </p>
              </div>
            )}
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push("/dashboard")}
              className="w-full rounded-2xl py-3 text-sm font-bold"
              style={{ background: GOLD, color: "#050A14" }}>
              Voir sur le tableau de bord →
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bouton reset données */}
      <AnimatePresence mode="wait">
        {!confirmClean ? (
          <motion.button key="trigger" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            whileTap={{ scale: 0.97 }} onClick={() => setConfirmClean(true)}
            className="w-full rounded-2xl p-4 flex items-center gap-3 mb-4 text-left"
            style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.18)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.2)" }}>
              {cleanDone
                ? <CheckCircle size={20} color="#4ade80" />
                : <Trash2 size={20} color="#f87171" />}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: cleanDone ? "#4ade80" : "#f87171" }}>
                {cleanDone ? "Données supprimées ✓" : "Réinitialiser les données"}
              </p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                Supprimer toutes les transactions importées
              </p>
            </div>
          </motion.button>
        ) : (
          <motion.div key="confirm" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="w-full rounded-2xl p-4 mb-4"
            style={{ background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.3)" }}>
            <p className="text-sm font-bold text-white mb-1">Supprimer toutes les transactions ?</p>
            <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.45)" }}>
              Cette action est irréversible.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmClean(false)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold"
                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                Annuler
              </button>
              <button onClick={cleanTransactions} disabled={cleaning}
                className="flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                style={{ background: "#f87171", color: "white" }}>
                {cleaning
                  ? <><motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                      className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent" />Suppression…</>
                  : <><Trash2 size={13} />Confirmer</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connect tile (disabled) */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="w-full rounded-3xl p-5 flex items-start gap-4 relative overflow-hidden mb-5"
        style={{ background: "rgba(255,255,255,0.025)", border: "1.5px solid rgba(255,255,255,0.07)", opacity: 0.55 }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
          <WifiOff size={24} color="rgba(255,255,255,0.3)" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-base mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>Connexion directe</p>
          <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.28)" }}>Open Banking — connexion à votre banque</p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl"
            style={{ background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.18)" }}>
            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span className="text-[11px] text-red-400 font-medium">Momentanément indisponible</span>
          </div>
        </div>
      </motion.div>

      {/* Info */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
        className="rounded-2xl p-4 flex items-start gap-3"
        style={{ background: "rgba(236,204,104,0.05)", border: "1px solid rgba(236,204,104,0.13)" }}>
        <span className="text-base mt-0.5">🔐</span>
        <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.42)" }}>
          Vos données financières sont chiffrées et traitées localement.
          Elles ne sont jamais partagées avec des tiers.
        </p>
      </motion.div>
    </div>
  )
}
