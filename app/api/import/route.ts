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

// ─── Date : serial Excel → YYYY-MM-DD ───────────────────────────────────────
// Formule standard : serial 1 = 1900-01-01, avec bug Excel (60 = fausse année bissextile)
function excelSerial(serial: number): string {
  // 25569 = jours entre 1900-01-01 et 1970-01-01 (en tenant compte du bug Excel)
  const ms = (serial - 25569) * 86400 * 1000
  const d = new Date(ms)
  if (isNaN(d.getTime())) return today()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`
}

function today() { return new Date().toISOString().split("T")[0] }

function parseDate(raw: unknown): string {
  if (raw === "" || raw == null) return today()
  if (typeof raw === "number") return excelSerial(raw)
  const s = String(raw).trim()
  // DD/MM/YYYY ou DD-MM-YYYY
  const m = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/)
  if (m) {
    const y = m[3].length === 2 ? "20"+m[3] : m[3]
    return `${y}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`
  }
  const iso = new Date(s)
  if (!isNaN(iso.getTime())) return iso.toISOString().split("T")[0]
  return today()
}

function parseAmount(raw: unknown): number | null {
  if (raw === "" || raw == null) return null
  if (typeof raw === "number") return raw
  const n = parseFloat(String(raw).replace(/\s/g,"").replace(",",".").replace(/[€$]/g,""))
  return isNaN(n) ? null : n
}

// ─── Nettoyage libellé CA ────────────────────────────────────────────────────
function cleanCALabel(raw: string): string {
  // Le libellé CA = "TYPE\nDescription ligne2\nRéfs techniques\n..."
  const lines = raw.split("\n").map(l => l.replace(/\s{2,}/g," ").trim()).filter(Boolean)
  if (lines.length === 0) return "Transaction"

  // Ligne 0 = type brut (PAIEMENT PAR CARTE, PRELEVEMENT, VIREMENT EN VOTRE FAVEUR...)
  // Ligne 1 = description utile
  const desc = lines.length > 1 ? lines[1] : lines[0]

  let clean = desc
    // Supprimer numéro de carte "X1748 " en début
    .replace(/^X\d{3,5}\s+/i, "")
    // Supprimer date de fin " 27/05" ou " 27/05/26"
    .replace(/\s+\d{2}\/\d{2}(\/\d{2,4})?\s*$/, "")
    // Supprimer codes alphanumériques longs (refs bancaires) >= 8 chars
    .replace(/\s+[A-Z0-9\/]{8,}/g, "")
    // Supprimer numéros purs longs >= 8 chiffres
    .replace(/\s*\d{8,}/g, "")
    // Supprimer le slash résiduel et ce qui suit
    .replace(/\s*\/.*$/, "")
    // Nettoyer séquences d'espaces et ponctuation en fin
    .replace(/[,;:\s]+$/, "")
    .replace(/\s{2,}/g, " ")
    .trim()

  // Fallback : utiliser le type si la description est vide
  if (!clean || clean.length < 2) {
    clean = lines[0]
      .replace(/^(PAIEMENT PAR CARTE|PRELEVEMENT|VIREMENT)/i, "")
      .trim() || "Transaction"
  }

  return clean
}

// ─── Catégorie ───────────────────────────────────────────────────────────────
function detectCategory(label: string, rawType: string): string {
  const s = (label + " " + rawType).toLowerCase()
  if (/uber.?eats|deliveroo|just.?eat|resto|restaurant|brasserie|bistro|mcdo|burger|pizza|sushi|kebab|coffee|naad|cantine|monoprix.+traiteur/.test(s)) return "Restaurants"
  if (/netflix|spotify|deezer|canal\+?|disney|prime video|apple.tv|hulu|linkedin|adobe|microsoft 365|abonne/.test(s)) return "Abonnements"
  if (/carrefour|leclerc|lidl|aldi|intermarche|monoprix|casino|franprix|picard|auchan|biocoop|spar|superette|supermarche/.test(s)) return "Alimentation"
  if (/sncf|ratp|navigo|imagine.?r|transilien|bus |metro|tram|blabla|taxi|uber(?!.*eats)|parking|stationnement|essence|total.?energ|bp |esso|shell/.test(s)) return "Transport"
  if (/edf|engie|electr|gaz |eau |loyer|charges|syndic|assurance|mutuelle|maif|allianz|axa|luko|habitation|internet|sfr|orange|free|bouygues/.test(s)) return "Logement"
  if (/salaire|virement.*(faveur|recu)|prime|bonus|remboursement|henner|cpam|ameli|caf |pole.?emploi|france.?travail/.test(s)) return "Revenus"
  if (/pharmacie|medecin|docteur|hopital|dentiste|opticien|sante|ordonnance|labo|kine/.test(s)) return "Santé"
  if (/zara|h&m|primark|nike|adidas|vinted|shein|asos|mango|uniqlo|decathlon|kiabi|foot.?locker/.test(s)) return "Shopping"
  if (/amazon|fnac|darty|boulanger|cdiscount|ebay|paypal|google|apple\.com/.test(s)) return "Shopping"
  if (/impot|taxe|amende|fisc|tresor|dgfip|douane/.test(s)) return "Impôts"
  if (/virement|prelevement/.test(s)) return "Virements"
  return "Autre"
}

// ─── Détection format CA ─────────────────────────────────────────────────────
function detectCAFormat(rows: Record<string, unknown>[]): boolean {
  // Cherche une ligne contenant "Date" ET un mot avec "libell" ET un mot avec "bit"
  for (const row of rows.slice(0, 8)) {
    const vals = Object.values(row).map(v => String(v).toLowerCase().replace(/[éèêëàâäùûüîïôöç]/g, c => ({é:"e",è:"e",ê:"e",ë:"e",à:"a",â:"a",ä:"a",ù:"u",û:"u",ü:"u",î:"i",ï:"i",ô:"o",ö:"o",ç:"c"}[c]||c)))
    const hasDate    = vals.some(v => v.trim() === "date")
    const hasLibelle = vals.some(v => v.includes("libelle") || v.includes("libelle"))
    const hasDebit   = vals.some(v => v.includes("debit") || v.includes("debit"))
    if (hasDate && hasLibelle && hasDebit) return true
  }
  return false
}

// ─── Parser Crédit Agricole ──────────────────────────────────────────────────
function parseCA(rows: Record<string, unknown>[]) {
  // Lignes de métadonnées
  const accountName   = String(Object.values(rows[0] ?? {})[0] ?? "").trim()
  const accountNumber = String(Object.values(rows[1] ?? {})[0] ?? "").replace(/compte de d.p.t n[°o]/i,"").trim()

  // Solde ligne 2 : trouver la valeur avec "€" ou nombre décimal
  let solde: number | null = null
  for (const v of Object.values(rows[2] ?? {})) {
    const s = String(v)
    const m = s.match(/([\d\s]+[,\.]\d{2})/)
    if (m) { solde = parseFloat(m[1].replace(/\s/g,"").replace(",",".")); break }
  }

  // Ligne 4 = vrais en-têtes → trouver les colonnes par leur valeur
  const headerRow = rows[4] ?? {}
  let dateKey = "", labelKey = "", debitKey = "", creditKey = ""

  for (const [k, v] of Object.entries(headerRow)) {
    const norm = String(v).toLowerCase().replace(/[éèêëàâùûîïôç]/g, c => ({é:"e",è:"e",ê:"e",ë:"e",à:"a",â:"a",ù:"u",û:"u",î:"i",ï:"i",ô:"o",ç:"c"}[c]||c)).trim()
    if (norm === "date")                        dateKey   = k
    else if (norm.startsWith("libelle"))        labelKey  = k
    else if (norm.includes("debit"))            debitKey  = k
    else if (norm.includes("credit"))           creditKey = k
  }

  // Fallback positionnel si la détection échoue
  if (!dateKey) {
    const keys = Object.keys(headerRow)
    dateKey   = keys[0] ?? ""
    labelKey  = keys[1] ?? ""
    debitKey  = keys[2] ?? ""
    creditKey = keys[3] ?? ""
  }

  const transactions: Record<string, unknown>[] = []

  for (let i = 5; i < rows.length; i++) {
    const row = rows[i]
    const rawDate   = row[dateKey]
    const rawLabel  = String(row[labelKey] ?? "").trim()
    const rawDebit  = row[debitKey]
    const rawCredit = row[creditKey]

    // Ignorer les lignes vides
    if (!rawLabel || (!rawDate && !rawDebit && !rawCredit)) continue
    // Ignorer les lignes récapitulatives / sous-totaux
    if (/total|solde|sous-total/i.test(rawLabel)) continue

    const date   = parseDate(rawDate)
    const debit  = parseAmount(rawDebit)
    const credit = parseAmount(rawCredit)

    let amount: number
    let type: "in" | "out"

    if (credit !== null && credit > 0) {
      amount = credit; type = "in"
    } else if (debit !== null && debit > 0) {
      amount = -debit; type = "out"
    } else continue

    const label   = cleanCALabel(rawLabel)
    const rawType = rawLabel.split("\n")[0].trim()

    transactions.push({
      userId:   DEMO_USER,
      label,
      amount,
      date,
      category: detectCategory(label, rawType),
      type,
      source:   "import-ca",
      createdAt: serverTimestamp(),
    })
  }

  return { transactions, accountName, accountNumber, solde }
}

// ─── Parser générique ────────────────────────────────────────────────────────
function parseGeneric(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  if (!rows.length) return []
  const headers = Object.keys(rows[0])

  function findKey(candidates: string[]): string | null {
    for (const h of headers)
      if (candidates.some(c => h.toLowerCase().replace(/[éèêëàâùûîïôç]/g, x => ({é:"e",è:"e",ê:"e",ë:"e",à:"a",â:"a",ù:"u",û:"u",î:"i",ï:"i",ô:"o",ç:"c"}[x]||x)).includes(c))) return h
    return null
  }

  const dateKey   = findKey(["date","jour"])
  const labelKey  = findKey(["libelle","libelle","label","description","intitule","operation","motif"])
  const debitKey  = findKey(["debit","debit","sortie","depense"])
  const creditKey = findKey(["credit","credit","entree","entree","recette"])
  const amountKey = findKey(["montant","amount","valeur"])

  return rows.flatMap(row => {
    const rawLabel = String(labelKey ? row[labelKey] ?? "" : Object.values(row).find(v => typeof v === "string" && String(v).length > 3) ?? "").trim()
    if (!rawLabel) return []
    const date  = parseDate(dateKey ? row[dateKey] : "")
    const debit  = parseAmount(debitKey  ? row[debitKey]  : null)
    const credit = parseAmount(creditKey ? row[creditKey] : null)
    let amount: number | null = null
    if (credit !== null && credit > 0) amount = credit
    else if (debit !== null && debit > 0) amount = -debit
    else if (amountKey) amount = parseAmount(row[amountKey])
    if (!amount) return []
    const label = rawLabel.split("\n")[0].replace(/\s{2,}/g," ").trim()
    return [{ userId: DEMO_USER, label, amount, date, category: detectCategory(label, ""), type: amount > 0 ? "in" : "out", source: "import", createdAt: serverTimestamp() }]
  })
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
    const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: "" })

    if (!rows.length) return NextResponse.json({ error: "Fichier vide ou non reconnu" }, { status: 400 })

    let transactions: Record<string, unknown>[]
    let meta: Record<string, unknown> = {}

    if (detectCAFormat(rows)) {
      const parsed = parseCA(rows)
      transactions = parsed.transactions
      meta = { accountName: parsed.accountName, accountNumber: parsed.accountNumber, solde: parsed.solde }
    } else {
      transactions = parseGeneric(rows)
    }

    if (!transactions.length)
      return NextResponse.json({ error: "Aucune transaction détectée. Vérifiez le format du fichier." }, { status: 400 })

    await Promise.all(transactions.map(t => addDoc(collection(db, "transactions"), t)))

    // Sauvegarder les métadonnées du compte (solde réel, nom, numéro)
    if (meta.solde != null) {
      await setDoc(doc(db, "account_meta", DEMO_USER), {
        userId:        DEMO_USER,
        solde:         meta.solde,
        accountName:   meta.accountName  ?? "",
        accountNumber: meta.accountNumber ?? "",
        updatedAt:     serverTimestamp(),
      }, { merge: true })
    }

    return NextResponse.json({ success: true, count: transactions.length, ...meta })
  } catch (e: any) {
    console.error("Import error:", e)
    return NextResponse.json({ error: e.message ?? "Erreur import" }, { status: 500 })
  }
}
