import type { ReactNode } from "react"
import "./globals.css"
import { AuthProvider } from "@/components/AuthProvider"

export const metadata = {
  title: "Finéa",
  description: "Coach financier personnel intelligent",
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, padding: 0, overflow: "hidden" }}>
          <AuthProvider>{children}</AuthProvider>
        </body>
    </html>
  )
}
