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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { receiptData } = body;

    if (!receiptData) {
      return NextResponse.json({ error: "Donnees du ticket manquantes" }, { status: 400 });
    }

    const db = getDb();

    const docRef = await addDoc(collection(db, "scanned_transactions"), {
      merchant:  receiptData.merchant  || "Inconnu",
      amount:    receiptData.total ? parseFloat(receiptData.total) : 0,
      date:      receiptData.date      || null,
      currency:  receiptData.currency  || "EUR",
      items:     receiptData.items     || [],
      rawText:   receiptData.rawText   || "",
      category:  "Alimentation",
      type:      "out",
      createdAt: serverTimestamp(),
      scannedAt: new Date().toISOString(),
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