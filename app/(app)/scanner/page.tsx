"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Zap, Image as ImageIcon, CheckCircle2, UploadCloud } from "lucide-react"
import { GOLD, GOLD_DIM, GREEN } from "@/lib/theme"

interface ReceiptItem { description: string; quantity?: string; price?: string }
interface ReceiptData {
  merchant?: string
  date?: string
  total?: string
  currency?: string
  items: ReceiptItem[]
  rawText: string
}

type ScanState = "idle" | "scanning" | "done" | "error"

export default function Scanner() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [scanState, setScanState] = useState<ScanState>("idle")
  const [scanY, setScanY] = useState(0)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  function startScanLine() {
    let dir = 1
    let pos = 0
    const interval = setInterval(() => {
      pos += dir * 2.5
      if (pos >= 100) dir = -1
      if (pos <= 0) dir = 1
      setScanY(pos)
    }, 16)
    return interval
  }

  async function handleFile(file: File) {
    if (!file) return
    setErrorMsg(null)
    setReceiptData(null)
    setSavedOk(false)
    setScanState("scanning")

    // Show image preview
    const reader = new FileReader()
    reader.onload = () => setSelectedImage(reader.result as string)
    reader.readAsDataURL(file)

    // Animate scan line while analyzing
    const interval = startScanLine()

    try {
      const formData = new FormData()
      formData.append("image", file)
      const res = await fetch("/api/ocr", { method: "POST", body: formData })
      const json = await res.json()

      clearInterval(interval)

      if (!res.ok) {
        throw new Error(json.details ? `${json.error} - ${json.details}` : json.error || "Erreur analyse")
      }

      setReceiptData(json.data)
      setScanState("done")
    } catch (e: unknown) {
      clearInterval(interval)
      setErrorMsg(e instanceof Error ? e.message : "Erreur inconnue")
      setScanState("error")
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // Reset input so same file can be re-selected
    e.target.value = ""
  }

  async function saveTransaction() {
    if (!receiptData) return
    setIsSaving(true)
    try {
      const res = await fetch("/api/scanner/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptData }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Erreur sauvegarde")
      setSavedOk(true)
      setTimeout(() => router.push("/dashboard"), 2000)
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Erreur sauvegarde")
    } finally {
      setIsSaving(false)
    }
  }

  function resetScan() {
    setScanState("idle")
    setReceiptData(null)
    setErrorMsg(null)
    setSavedOk(false)
    setSelectedImage(null)
    setScanY(0)
  }

  const isDone = scanState === "done"
  const isScanning = scanState === "scanning"
  const isError = scanState === "error"

  return (
    <div className="w-full h-full flex flex-col relative" style={{ background: "#050A14" }}>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInput}
      />

      {/* Camera / preview area */}
      <div className="relative flex-1 overflow-hidden"
        style={{ background: isDone ? "#071510" : isError ? "#180a0a" : "#070d14" }}>

        {/* Image preview (when analyzing or done) */}
        {selectedImage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <img src={selectedImage} alt="Ticket"
              className="max-w-full max-h-full object-contain"
              style={{ opacity: isDone ? 0.7 : 0.55 }} />
          </div>
        )}

        {/* Grain noise overlay */}
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "200px 200px",
          }} />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-10 pb-5 z-10"
          style={{ background: "linear-gradient(to bottom, rgba(5,10,20,0.9), transparent)" }}>
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => router.back()}>
            <ArrowLeft size={24} color="white" />
          </motion.button>
          <p className="text-white font-semibold text-sm">Scanner un ticket</p>
          <motion.button whileTap={{ scale: 0.88 }}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.1)" }}>
            <Zap size={16} color="white" />
          </motion.button>
        </div>

        {/* Viewfinder — grand cadre couvrant toute l'image */}
        <div className="absolute inset-0 flex items-center justify-center px-5 pt-24 pb-24">
          <div className="relative w-full h-full" style={{ maxWidth: 420 }}>

            {/* Dark corners overlay */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ boxShadow: "0 0 0 1000px rgba(0,0,0,0.45)", borderRadius: 18 }} />

            {/* Corner brackets */}
            {[
              { pos: "top-0 left-0",    border: "border-t-2 border-l-2 rounded-tl-2xl" },
              { pos: "top-0 right-0",   border: "border-t-2 border-r-2 rounded-tr-2xl" },
              { pos: "bottom-0 left-0", border: "border-b-2 border-l-2 rounded-bl-2xl" },
              { pos: "bottom-0 right-0",border: "border-b-2 border-r-2 rounded-br-2xl" },
            ].map((c, i) => (
              <motion.div key={i}
                animate={isDone ? { borderColor: GREEN } : isError ? { borderColor: "#f87171" } : { borderColor: "white" }}
                className={`absolute w-12 h-12 ${c.pos} ${c.border}`} />
            ))}

            {/* Scan line */}
            <AnimatePresence>
              {isScanning && (
                <div className="absolute inset-x-0 pointer-events-none"
                  style={{ top: `${scanY}%`, height: 2 }}>
                  <div className="h-full w-full"
                    style={{ background: `linear-gradient(90deg, transparent, ${GOLD} 20%, white 50%, ${GOLD} 80%, transparent)`, opacity: 0.9 }} />
                  <div className="h-4 w-full -mt-1"
                    style={{ background: `linear-gradient(180deg, transparent, ${GOLD}33, transparent)` }} />
                </div>
              )}
            </AnimatePresence>

            {/* Done check */}
            <AnimatePresence>
              {isDone && (
                <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(74,222,128,0.2)", border: `2px solid ${GREEN}` }}>
                    <CheckCircle2 size={28} color={GREEN} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error X */}
            <AnimatePresence>
              {isError && (
                <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(248,113,113,0.2)", border: "2px solid #f87171" }}>
                    <span className="text-2xl">✕</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Status hint */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center">
          <motion.div animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }}
            className="px-4 py-2 rounded-full"
            style={{ background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <p className="text-xs text-white/70">
              {scanState === "idle"     && "Importez une photo de ticket de caisse"}
              {scanState === "scanning" && "Analyse IA en cours..."}
              {scanState === "done"     && "Ticket analyse avec succes"}
              {scanState === "error"    && (errorMsg ?? "Erreur lors de l'analyse")}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="px-5 py-5 flex items-center justify-between shrink-0"
        style={{ background: "#050A14", borderTop: "1px solid rgba(255,255,255,0.07)" }}>

        {/* Gallery picker */}
        <motion.button whileTap={{ scale: 0.88 }}
          onClick={() => fileInputRef.current?.click()}
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}>
          <ImageIcon size={20} color="rgba(255,255,255,0.6)" />
        </motion.button>

        {/* Main shutter / upload */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (scanState === "idle" || scanState === "error") {
              fileInputRef.current?.click()
            } else if (scanState === "done") {
              resetScan()
            }
          }}
          disabled={isScanning}
          className="w-20 h-20 rounded-full flex items-center justify-center relative"
          style={{
            background: isDone
              ? `linear-gradient(135deg, ${GREEN}, #22c55e)`
              : isError
              ? "linear-gradient(135deg, #ef4444, #dc2626)"
              : `linear-gradient(135deg, ${GOLD}, ${GOLD_DIM})`,
            boxShadow: isDone
              ? "0 0 30px rgba(74,222,128,0.45)"
              : isError
              ? "0 0 30px rgba(239,68,68,0.35)"
              : `0 0 30px rgba(236,204,104,0.45)`,
          }}
        >
          {isScanning
            ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <div className="w-7 h-7 rounded-full border-2 border-transparent" style={{ borderTopColor: "#050A14" }} />
              </motion.div>
            : isDone
            ? <CheckCircle2 size={28} color="white" />
            : isError
            ? <span className="text-white text-2xl font-bold">↺</span>
            : <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#050A14" strokeWidth="2" strokeLinecap="round">
                <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
                <line x1="3" y1="12" x2="21" y2="12" />
              </svg>
          }
        </motion.button>

        {/* Upload from files */}
        <motion.button whileTap={{ scale: 0.88 }}
          onClick={() => fileInputRef.current?.click()}
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}>
          <UploadCloud size={20} color="rgba(255,255,255,0.6)" />
        </motion.button>
      </div>

      {/* Result drawer — slides up from bottom */}
      <AnimatePresence>
        {isDone && receiptData && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="absolute bottom-0 left-0 right-0 rounded-t-3xl px-5 pt-5 pb-8"
            style={{
              background: "#0d1a2a",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 -20px 60px rgba(0,0,0,0.8)",
              maxHeight: "60%",
              overflowY: "auto",
            }}
          >
            {/* Drag handle */}
            <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "rgba(255,255,255,0.15)" }} />

            {/* Header row */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-white font-bold text-base">{receiptData.merchant || "Commercant inconnu"}</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{receiptData.date || "Date inconnue"}</p>
              </div>
              <p className="text-xl font-bold" style={{ color: GOLD }}>
                {receiptData.total ? `${receiptData.total} EUR` : "--"}
              </p>
            </div>

            {/* Items list */}
            {receiptData.items.length > 0 && (
              <div className="flex flex-col gap-0 mb-4">
                {receiptData.items.map((item, i) => (
                  <div key={i} className="flex justify-between py-1.5"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                      {item.description}{item.quantity ? ` x${item.quantity}` : ""}
                    </span>
                    {item.price && (
                      <span className="text-xs font-semibold text-white">{item.price} EUR</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Success banner */}
            <AnimatePresence>
              {savedOk && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  className="mb-3 p-3 rounded-2xl text-xs font-semibold text-center"
                  style={{ background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)", color: GREEN }}>
                  Transaction importee dans votre compte ! Redirection...
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            {errorMsg && (
              <div className="mb-3 p-3 rounded-2xl text-xs text-center text-red-300"
                style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)" }}>
                {errorMsg}
              </div>
            )}

            {/* Actions */}
            {!savedOk && (
              <div className="flex gap-3">
                <motion.button whileTap={{ scale: 0.96 }} onClick={resetScan}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  Nouveau scan
                </motion.button>
                <motion.button whileTap={{ scale: 0.96 }} onClick={saveTransaction} disabled={isSaving}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DIM})`, color: "#050A14" }}>
                  {isSaving
                    ? <span className="flex items-center justify-center gap-2">
                        <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                          className="inline-block w-4 h-4 border-2 border-[#050A14] border-t-transparent rounded-full" />
                        Sauvegarde...
                      </span>
                    : "Importer dans mon compte"}
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}