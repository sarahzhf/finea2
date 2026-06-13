import PhoneShell from "@/components/phone-shell"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <PhoneShell>
      {children}
    </PhoneShell>
  )
}
