import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ReceiptData {
  merchant?: string;
  date?: string;
  total?: string;
  currency?: string;
  items: Array<{ description: string; quantity?: string; price?: string }>;
  rawText: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      return NextResponse.json({ error: "Aucune image fournie" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY manquante dans .env.local" }, { status: 500 });
    }

    const bytes = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(bytes).toString("base64");
    const mimeType = imageFile.type?.startsWith("image/") ? imageFile.type : "image/jpeg";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Analyse ce ticket de caisse et extrait les informations au format JSON :

{
  "merchant": "nom du commercant",
  "date": "date au format JJ/MM/AAAA",
  "total": "montant total (nombre seul sans symbole)",
  "currency": "EUR",
  "items": [
    { "description": "nom article", "quantity": "quantite si visible", "price": "prix si visible" }
  ]
}

Instructions :
- Si une information est absente, mets null
- Pour le total : nombre uniquement (ex: "45.50")
- Liste tous les articles visibles
- Reponds UNIQUEMENT avec le JSON, sans markdown ni texte autour`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType } },
    ]);

    const content = result.response.text();
    if (!content) throw new Error("Pas de reponse de Gemini");

    let receiptData: ReceiptData;
    try {
      const clean = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(clean);
      receiptData = {
        merchant: parsed.merchant || undefined,
        date: parsed.date || undefined,
        total: parsed.total || undefined,
        currency: parsed.currency || "EUR",
        items: parsed.items || [],
        rawText: content,
      };
    } catch {
      receiptData = { items: [], rawText: content };
    }

    return NextResponse.json({ success: true, data: receiptData });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("API_KEY_INVALID") || msg.includes("API key not valid")) {
      return NextResponse.json({ error: "Cle API Gemini invalide", details: msg }, { status: 401 });
    }
    if (msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
      return NextResponse.json({ error: "Quota Gemini atteint", details: msg }, { status: 429 });
    }
    if (msg.includes("PERMISSION_DENIED") || msg.includes("has not been used")) {
      return NextResponse.json({ error: "API Gemini non activee", details: "Activer Generative Language API sur Google Cloud Console" }, { status: 403 });
    }
    return NextResponse.json({ error: "Erreur analyse image", details: msg }, { status: 500 });
  }
}