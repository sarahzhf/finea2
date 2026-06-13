export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { initializeApp, getApps, getApp } from "firebase/app"
import { getFirestore, collection, addDoc, doc, setDoc, serverTimestamp } from "firebase/firestore"

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}
const fireApp = !getApps().length ? initializeApp(firebaseConfig) : getApp()
const db = getFirestore(fireApp)
const DEMO_USER = "demo-user"

// ─── Date serial Excel → YYYY-MM-DD ─────────────────────────────────────────
function excelSerial(serial: number): string {
  const ms = (serial - 25569) * 86400 * 1000
  const d = new Date(ms)
  if (isNaN(d.getTime())) return new Date().toISOString().split("T")[0]
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`
}

function parseDate(raw: unknown): string {
  if (raw === "" || raw == null) return new Date().toISOString().split("T")[0]
  if (typeof raw === "number") return excelSerial(raw)
  const s = String(raw).trim()
  const m = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/)
  if (m) { const y = m[3].length === 2 ? "20"+m[3] : m[3]; return `${y}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}` }
  const iso = new Date(s)
  if (!isNaN(iso.getTime())) return iso.toISOString().split("T")[0]
  return new Date().toISOString().split("T")[0]
}

function parseAmount(raw: unknown): number | null {
  if (raw === "" || raw == null) return null
  if (typeof raw === "number") return raw
  const n = parseFloat(String(raw).replace(/\s/g,"").replace(",",".").replace(/[€$]/g,""))
  return isNaN(n) ? null : n
}

// Taux connus selon le type de livret
function detectRate(name: string): number {
  const n = name.toLowerCase()
  if (n.includes("livret a"))   return 3.0
  if (n.includes("ldds") || n.includes("ldd")) return 3.0
  if (n.includes("lep"))        return 4.0
  if (n.includes("cel"))        return 2.0
  if (n.includes("pea"))        return 0
  if (n.includes("assurance"))  return 2.5
  return 0
}

// Plafond légal connu
function detectCeiling(name: string): number | null {
  const n = name.toLowerCase()
  if (n.includes("livret a"))   return 22950
  if (n.includes("ldds") || n.includes("ldd")) return 12000
  if (n.includes("lep"))        return 10000
  return null
}

// ─── Parser Livret CA ────────────────────────────────────────────────────────
// Format identique au relevé courant CA :
//   row[0] : date téléchargement
//   row[1] : vide
//   row[2] : nom titulaire
//   row[3] : "Livret A carte n° XXXX"
//   row[4] : vide
//   row[5] : ["", "Solde au ...", " 13 000,27 €", ""]
//   row[6] : vide
//   row[7] : date range
//   row[8] : headers ["Date","Libellé","Débit euros","Crédit euros"]
//   row[9+]: transactions
function parseSavingsCA(rows: unknown[][]) {
  // Titulaire
  const holder = String(rows[2]?.[0] ?? "").trim()

  // Nom du compte + numéro
  const accountRaw = String(rows[3]?.[0] ?? "").trim()
  // "Livret A carte n° 36121929419" → name="Livret A", accountNumber="36121929419"
  const accountMatch = accountRaw.match(/^(.+?)\s+(?:carte|n°|numéro)?\s*n[°o]?\s*(\d+)/i)
  const accountName   = accountMatch ? accountMatch[1].trim() : accountRaw
  const accountNumber = accountMatch ? accountMatch[2] : ""

  // Solde
  let solde: number | null = null
  for (const v of (rows[5] ?? [])) {
    const s = String(v)
    const m = s.match(/([\d\s]+[,\.]\d{2})/)
    if (m) { solde = parseFloat(m[1].replace(/\s/g,"").replace(",",".")); break }
  }

  // Headers à la ligne 8 (index 8)
  const headerRow = rows[8] as unknown[]
  let dateKey = -1, labelKey = -1, debitKey = -1, creditKey = -1
  headerRow?.forEach((h, i) => {
    const norm = String(h).toLowerCase().replace(/[éèêëàâùûîïôç]/g, c =>
      ({é:"e",è:"e",ê:"e",ë:"e",à:"a",â:"a",ù:"u",û:"u",î:"i",ï:"i",ô:"o",ç:"c"}[c]||c)).trim()
    if (norm === "date")              dateKey  = i
    else if (norm.startsWith("libelle")) labelKey = i
    else if (norm.includes("debit"))  debitKey = i
    else if (norm.includes("credit")) creditKey = i
  })
  // Fallback positionnel
  if (dateKey < 0)  dateKey  = 0
  if (labelKey < 0) labelKey = 1
  if (debitKey < 0) debitKey = 2
  if (creditKey < 0) creditKey = 3

  const transactions = []
  for (let i = 9; i < rows.length; i++) {
    const row = rows[i] as unknown[]
    if (!row || row.every(v => v === "" || v == null)) continue
    const rawDate   = row[dateKey]
    const rawLabel  = String(row[labelKey] ?? "").trim()
    const rawDebit  = row[debitKey]
    const rawCredit = row[creditKey]
    if (!rawLabel && !rawDate) continue

    const date   = parseDate(rawDate)
    const debit  = parseAmount(rawDebit)
    const credit = parseAmount(rawCredit)

    let amount: number, type: "in" | "out"
    if (credit !== null && credit > 0)     { amount = credit; type = "in"  }
    else if (debit !== null && debit > 0)  { amount = -debit; type = "out" }
    else continue

    // Nettoyage libellé
    const lines = rawLabel.split("\n").map((l: string) => l.replace(/\s{2,}/g," ").trim()).filter(Boolean)
    const label  = (lines.length > 1 ? lines[1] : lines[0])
      .replace(/^(DE|POUR)\s+/i, "")
      .replace(/\s{2,}/g," ")
      .trim() || lines[0] || "Mouvement"

    transactions.push({ date, label, amount, type })
  }

  return { accountName, accountNumber, holder, solde, transactions }
}

// ─── Handler ─────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get("file") as File | null
    if (!file) return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 })

    const buf = Buffer.from(await file.arrayBuffer())
    const wb  = XLSX.read(buf, { type: "buffer" })
    const ws  = wb.Sheets[wb.SheetNames[0]]
    // header:1 → tableau de tableaux
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { defval: "", header: 1 })

    if (!rows.length) return NextResponse.json({ error: "Fichier vide" }, { status: 400 })

    const parsed = parseSavingsCA(rows)
    if (!parsed.accountName) return NextResponse.json({ error: "Format non reconnu" }, { status: 400 })

    const rate    = detectRate(parsed.accountName)
    const ceiling = detectCeiling(parsed.accountName)
    const accountId = `${DEMO_USER}-${parsed.accountNumber || parsed.accountName.replace(/\s+/g,"-").toLowerCase()}`

    // Upsert du compte dans savings_accounts
    await setDoc(doc(db, "savings_accounts", accountId), {
      userId:        DEMO_USER,
      accountId,
      name:          parsed.accountName,
      accountNumber: parsed.accountNumber,
      holder:        parsed.holder,
      balance:       parsed.solde ?? 0,
      interestRate:  rate,
      ceiling,
      updatedAt:     serverTimestamp(),
    }, { merge: true })

    // Ajouter les transactions dans savings_transactions
    await Promise.all(parsed.transactions.map(t =>
      addDoc(collection(db, "savings_transactions"), {
        userId:    DEMO_USER,
        accountId,
        accountName: parsed.accountName,
        label:     t.label,
        amount:    t.amount,
        date:      t.date,
        type:      t.type,
        createdAt: serverTimestamp(),
      })
    ))

    return NextResponse.json({
      success: true,
      accountName:   parsed.accountName,
      accountNumber: parsed.accountNumber,
      solde:         parsed.solde,
      count:         parsed.transactions.length,
    })
  } catch (e: any) {
    console.error("Import savings error:", e)
    return NextResponse.json({ error: e.message ?? "Erreur import" }, { status: 500 })
  }
}
