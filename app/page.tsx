import { redirect } from "next/navigation"

// Par défaut redirige vers login — le (app)/layout vérifie l'auth et redirige vers /dashboard si connecté
export default function Root() {
  redirect("/login")
}
