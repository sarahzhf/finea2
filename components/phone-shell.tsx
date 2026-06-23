"use client"
import { GOLD } from "@/lib/theme"

export default function PhoneShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* ── Mobile : plein écran ── */}
      <div
        className="sm:hidden w-screen h-screen overflow-hidden"
        style={{ background: "#050A14" }}
      >
        {children}
      </div>

      {/* ── Desktop : cadre téléphone centré ── */}
      <div
        className="hidden sm:flex items-center justify-center min-h-screen"
        style={{ background: "radial-gradient(ellipse at 50% 30%, #0d1b2e 0%, #050a14 60%, #000000 100%)" }}
      >
        <div className="relative">
          <div
            className="absolute -inset-1 rounded-[48px] opacity-30 blur-xl"
            style={{ background: `linear-gradient(135deg, ${GOLD}44, transparent 60%, ${GOLD}22)` }}
          />
          <div
            className="relative overflow-hidden rounded-[44px]"
            style={{
              width: 390,
              height: 844,
              background: "#050A14",
              border: `1px solid rgba(236,204,104,0.18)`,
              boxShadow: `
                0 0 0 1px rgba(0,0,0,0.8),
                0 40px 80px rgba(0,0,0,0.9),
                inset 0 1px 0 rgba(255,255,255,0.07)
              `,
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </>
  )
}
