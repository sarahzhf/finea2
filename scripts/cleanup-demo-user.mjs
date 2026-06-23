// Script one-shot : supprime tous les documents userId == "demo-user"
// Exécute : node scripts/cleanup-demo-user.mjs

import { initializeApp } from "firebase/app"
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore"
import { readFileSync } from "fs"

// Charge les variables d'env depuis .env.local
try {
  const env = readFileSync(".env.local", "utf-8")
  env.split("\n").forEach(line => {
    const [key, ...rest] = line.split("=")
    if (key && rest.length) process.env[key.trim()] = rest.join("=").trim()
  })
} catch {}

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db  = getFirestore(app)

const COLLECTIONS_BY_FIELD = [
  "transactions",
  "savings_accounts",
  "savings_transactions",
  "savings_entries",
  "savings_goals_v2",
]

const ACCOUNT_META_DOC = "demo-user" // document ID direct

async function cleanup() {
  let total = 0

  // Supprime account_meta/demo-user (doc direct)
  try {
    await deleteDoc(doc(db, "account_meta", ACCOUNT_META_DOC))
    console.log("✅ account_meta/demo-user supprimé")
    total++
  } catch (e) {
    console.log("⚠️  account_meta/demo-user introuvable ou déjà supprimé")
  }

  // Supprime tous les docs où userId == "demo-user"
  for (const col of COLLECTIONS_BY_FIELD) {
    try {
      const q    = query(collection(db, col), where("userId", "==", "demo-user"))
      const snap = await getDocs(q)
      if (snap.empty) {
        console.log(`— ${col} : rien à supprimer`)
        continue
      }
      await Promise.all(snap.docs.map(d => deleteDoc(doc(db, col, d.id))))
      console.log(`✅ ${col} : ${snap.size} document(s) supprimé(s)`)
      total += snap.size
    } catch (e) {
      console.error(`❌ Erreur sur ${col} :`, e.message)
    }
  }

  console.log(`\n🎉 Terminé — ${total} document(s) supprimé(s) au total`)
  process.exit(0)
}

cleanup()
