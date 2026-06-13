"use client"
import PhoneShell from "@/components/phone-shell"
import Navbar from "@/components/navbar"
import { motion, AnimatePresence } from "framer-motion"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAuth } from "@/components/AuthProvider"

const NO_NAV_PATHS = ["/scanner", "/missions/swipe", "/missions/bill_rush", "/missions/savings_lab"]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const { user, loading } = useAuth()
  const noNav = NO_NAV_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"))

  useEffect(() => {
    if (!loading && !user) router.replace("/login")
  }, [user, loading])

  // Écran de chargement pendant la vérification auth
  if (loading || !user) {
    return (
      <PhoneShell>
        <div className="w-full h-full flex items-center justify-center bg-[#050A14]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#F5D657] border-t-transparent animate-spin" />
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Chargement...</p>
          </div>
        </div>
      </PhoneShell>
    )
  }

  return (
    <PhoneShell>
      <div className="relative w-full h-full flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="flex-1 min-h-0 overflow-hidden relative"
          >
            {/* Padding bottom pour ne pas cacher le contenu sous la navbar */}
            <div className={`w-full h-full ${!noNav ? "pb-[90px]" : ""}`} style={{ boxSizing: "border-box" }}>
              {children}
            </div>
          </motion.div>
        </AnimatePresence>
        {!noNav && <Navbar />}
      </div>
    </PhoneShell>
  )
}
