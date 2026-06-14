import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getDb() {
  const config = {
    apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  const app = !getApps().length ? initializeApp(config) : getApp();
  return getFirestore(app);
}

// Convertit "JJ/MM/AAAA" → "AAAA-MM-JJ" (format attendu par le dashboard)
function normalizeDate(raw?: string | null): string {
  const today = new Date().toISOString().split("T")[0];
  if (!raw) return today;
  const m = String(raw).trim().match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (m) {
    const y = m[3].length === 2 ? "20" + m[3] : m[3];
    return `${y}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  }
  const iso = new Date(raw);
  return isNaN(iso.getTime()) ? today : iso.toISOString().split("T")[0];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { receiptData, userId } = body;

    if (!receiptData) {
      return NextResponse.json({ error: "Donnees du ticket manquantes" }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: "Utilisateur non authentifie" }, { status: 401 });
    }

    const db = getDb();

    const total = receiptData.total ? parseFloat(String(receiptData.total).replace(",", ".")) : 0;

    // On enregistre dans la MÊME collection que l'import Excel pour
    // que la transaction apparaisse dans le dashboard.
    const docRef = await addDoc(collection(db, "transactions"), {
      userId,
      label:     receiptData.merchant || "Ticket scanné",
      amount:    -Math.abs(total),            // dépense → montant négatif
      date:      normalizeDate(receiptData.date),
      category:  "Alimentation",
      type:      "out",
      source:    "scan",
      currency:  receiptData.currency || "EUR",
      items:     receiptData.items   || [],
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({
      success:   true,
      receiptId: docRef.id,
      message:   "Transaction importee dans votre compte",
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Scanner save error:", msg);
    return NextResponse.json({ error: "Erreur sauvegarde", details: msg }, { status: 500 });
  }
}
