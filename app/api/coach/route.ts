import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { initializeApp, getApps, getApp } from "firebase/app"
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"

export async function POST(req: NextRequest) {
  try {
    const { messages, userId } = await req.json()

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY manquante" }, { status: 500 })
    }
    if (!userId) {
      return NextResponse.json({ error: "Utilisateur non authentifié" }, { status: 401 })
    }

    const financialContext = await getUserFinancialContext(userId)

    const systemPrompt = `Tu es Finéa, une coach financière IA bienveillante, claire et directe. Tu aides exclusivement avec les finances personnelles : budget, dépenses, épargne, optimisation.

STYLE DE RÉPONSE (important) :
- Va droit au but : 2 à 5 phrases courtes maximum, en français, en tutoyant chaleureusement.
- Structure quand c'est utile : un constat, puis 1 à 3 conseils concrets et chiffrés (avec des puces "•").
- Termine par une mini-question ou une action simple ("Tu veux qu'on regarde X ?").
- Pas d'intro longue, pas de disclaimer. Réponses complètes, jamais coupées au milieu.

RÈGLES :
- Tu réponds UNIQUEMENT aux sujets finances perso (budget, épargne, dépenses, revenus, crédit).
- Hors sujet → "Je ne suis pas là pour ça 😊 Pose-moi plutôt une question sur ton budget ou ton épargne !"
- Base-toi sur les vraies données ci-dessous. N'invente JAMAIS de chiffres absents des données.
- Quand tu repères des dépenses optimisables, cite la catégorie et le montant réel.

${financialContext}`

    // Construire l'historique OpenAI — on ne garde que les derniers échanges
    // pour réduire la latence (réponses plus rapides).
    const recent = messages.slice(-7)
    const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...recent.map((m: { role: string; text: string }) => ({
        role: (m.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
        content: m.text,
      })),
    ]

    const openai = new OpenAI({ apiKey })

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: openaiMessages,
      temperature: 0.6,
      max_tokens: 320,
    })

    const text = completion.choices[0]?.message?.content ?? "Désolée, je n'ai pas pu générer une réponse."

    return NextResponse.json({ text })

  } catch (err: any) {
    console.error("Coach API error:", err?.message ?? err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ── Firebase Client SDK côté serveur ──
const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}
const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp()
const db = getFirestore(firebaseApp)

async function getUserFinancialContext(userId: string): Promise<string> {
  try {
    const metaSnap = await getDoc(doc(db, "account_meta", userId))
    const meta = metaSnap.exists() ? metaSnap.data() : null

    const txSnap = await getDocs(
      query(collection(db, "transactions"), where("userId", "==", userId))
    )
    const transactions = txSnap.docs
      .map(d => d.data())
      .sort((a, b) => {
        const da = a.date?.toDate ? a.date.toDate() : new Date(a.date)
        const db2 = b.date?.toDate ? b.date.toDate() : new Date(b.date)
        return db2.getTime() - da.getTime()
      })
      .slice(0, 80)

    const savSnap = await getDocs(
      query(collection(db, "savings_accounts"), where("userId", "==", userId))
    )
    const savings = savSnap.docs.map(d => d.data())

    const byMonth: Record<string, { revenus: number; depenses: number }> = {}
    const catSums: Record<string, number> = {}

    for (const tx of transactions) {
      const d = tx.date?.toDate ? tx.date.toDate() : new Date(tx.date)
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      if (!byMonth[mKey]) byMonth[mKey] = { revenus: 0, depenses: 0 }
      if (tx.amount > 0) byMonth[mKey].revenus += tx.amount
      else byMonth[mKey].depenses += Math.abs(tx.amount)

      if (tx.amount < 0) {
        const cat = tx.category || "Autre"
        catSums[cat] = (catSums[cat] || 0) + Math.abs(tx.amount)
      }
    }

    const months = Object.keys(byMonth).sort().reverse()
    const latestMonth = months[0]
    const latestData  = latestMonth ? byMonth[latestMonth] : null

    const topCats = Object.entries(catSums)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([cat, sum]) => `  • ${cat} : ${sum.toFixed(2)} €`)
      .join("\n")

    const topTxLines = transactions
      .filter(tx => tx.amount < 0)
      .sort((a, b) => a.amount - b.amount)
      .slice(0, 10)
      .map(tx => {
        const d = tx.date?.toDate ? tx.date.toDate() : new Date(tx.date)
        return `  • ${tx.label || tx.description || "?"} : -${Math.abs(tx.amount).toFixed(2)} € (${d.toLocaleDateString("fr-FR")}, cat: ${tx.category || "?"})`
      })
      .join("\n")

    const monthSummary = months.slice(0, 6).map(m => {
      const md = byMonth[m]
      return `  • ${m} — Revenus: ${md.revenus.toFixed(2)} €, Dépenses: ${md.depenses.toFixed(2)} €, Net: ${(md.revenus - md.depenses).toFixed(2)} €`
    }).join("\n")

    const savSummary = savings.length
      ? savings.map(s => `  • ${s.accountName || s.name} : ${s.balance?.toFixed(2)} € / plafond ${s.ceiling ?? "N/A"} €`).join("\n")
      : "  Aucun compte épargne importé."

    return `
=== DONNÉES FINANCIÈRES DE SARAH Z. ===
SOLDE BANCAIRE : ${meta?.solde != null ? meta.solde.toFixed(2) + " €" : "Non disponible"}
Compte : ${meta?.accountName || ""} ${meta?.accountNumber || ""}

DERNIER MOIS (${latestMonth || "N/A"}) :
  Revenus   : ${latestData?.revenus.toFixed(2) ?? "0"} €
  Dépenses  : ${latestData?.depenses.toFixed(2) ?? "0"} €
  Net       : ${((latestData?.revenus ?? 0) - (latestData?.depenses ?? 0)).toFixed(2)} €

HISTORIQUE 6 MOIS :
${monthSummary || "  Pas de données"}

DÉPENSES PAR CATÉGORIE (toutes périodes) :
${topCats || "  Pas de données"}

TOP 10 DÉPENSES INDIVIDUELLES :
${topTxLines || "  Pas de données"}

ÉPARGNE :
${savSummary}
=== FIN ===`.trim()

  } catch (e: any) {
    console.error("Firebase context error:", e?.message)
    return "Données financières non disponibles. Réponds de ton mieux avec des conseils généraux."
  }
}
