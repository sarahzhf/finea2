"use client"
import { useRouter, usePathname } from "next/navigation"
import { motion } from "framer-motion"
import FineaOrb from "./finea-orb"
import { GOLD, GOLD_DIM, BG_CARD, BORDER } from "@/lib/theme"
import { ScanLine, Brain } from "lucide-react"

const routes = [
  { path: "/dashboard", label: "Accueil" },
  { path: "/scanner", label: "Scanner" },
  { path: "/coach", label: "Finéa" },
  { path: "/cerveau", label: "Savoirs" },
  { path: "/communaute", label: "Social" },
]

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/")
  const isCoach = isActive("/coach")

  return (
    <nav
      className="absolute bottom-0 left-0 right-0 flex items-end justify-around px-3 pb-6 pt-3 z-50"
      style={{
        background: "linear-gradient(to top, rgba(5,10,20,0.98) 65%, transparent)",
        height: 90,
      }}
    >
      {/* F — Accueil */}
      <NavBtn active={isActive("/dashboard")} label="Accueil" onClick={() => router.push("/dashboard")}>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-[17px]"
          style={{
            background: isActive("/dashboard") ? GOLD : BG_CARD,
            color: isActive("/dashboard") ? "#050A14" : GOLD,
            border: `1px solid ${isActive("/dashboard") ? GOLD : BORDER}`,
          }}
        >
          F
        </div>
      </NavBtn>

      {/* Scanner */}
      <NavBtn active={isActive("/scanner")} label="Scanner" onClick={() => router.push("/scanner")}>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: isActive("/scanner") ? GOLD : BG_CARD,
            border: `1px solid ${isActive("/scanner") ? GOLD : BORDER}`,
          }}
        >
          <ScanLine size={18} color={isActive("/scanner") ? "#050A14" : GOLD} strokeWidth={2} />
        </div>
      </NavBtn>

      {/* Orb central Finéa */}
      <motion.button
        onClick={() => router.push("/coach")}
        className="flex flex-col items-center"
        style={{ marginTop: -36 }}
        whileTap={{ scale: 0.9 }}
      >
        <FineaOrb size={72} active={isCoach} />
        <span
          className="text-[9px] mt-1 font-bold tracking-wide"
          style={{ color: isCoach ? GOLD : "rgba(255,255,255,0.45)" }}
        >
          Finéa
        </span>
      </motion.button>

      {/* Cerveau */}
      <NavBtn active={isActive("/cerveau")} label="Savoirs" onClick={() => router.push("/cerveau")}>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: isActive("/cerveau") ? GOLD : BG_CARD,
            border: `1px solid ${isActive("/cerveau") ? GOLD : BORDER}`,
          }}
        >
          <Brain size={18} color={isActive("/cerveau") ? "#050A14" : GOLD} strokeWidth={1.8} />
        </div>
      </NavBtn>

      {/* Social + */}
      <NavBtn
        active={isActive("/communaute") || isActive("/actualites")}
        label="Social"
        onClick={() => router.push("/communaute")}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg"
          style={{
            background: isActive("/communaute") || isActive("/actualites") ? GOLD : BG_CARD,
            color: isActive("/communaute") || isActive("/actualites") ? "#050A14" : GOLD,
            border: `1px solid ${isActive("/communaute") || isActive("/actualites") ? GOLD : BORDER}`,
          }}
        >
          +
        </div>
      </NavBtn>
    </nav>
  )
}

function NavBtn({
  children, label, active, onClick,
}: {
  children: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      onClick={onClick}
      className="flex flex-col items-center gap-1"
    >
      {children}
      <span className="text-[9px] font-medium"
        style={{ color: active ? GOLD : "rgba(255,255,255,0.3)" }}>
        {label}
      </span>
    </motion.button>
  )
}
