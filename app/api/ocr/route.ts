import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

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

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY manquante dans .env.local" }, { status: 500 });
    }

    const bytes = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(bytes).toString("base64");
    const mimeType = imageFile.type?.startsWith("image/") ? imageFile.type : "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

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

    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
          ],
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Pas de reponse de l'IA");

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
    if (msg.includes("Incorrect API key") || msg.includes("invalid_api_key")) {
      return NextResponse.json({ error: "Cle API OpenAI invalide", details: msg }, { status: 401 });
    }
    if (msg.includes("rate_limit") || msg.includes("quota") || msg.includes("insufficient_quota")) {
      return NextResponse.json({ error: "Quota OpenAI atteint", details: msg }, { status: 429 });
    }
    return NextResponse.json({ error: "Erreur analyse image", details: msg }, { status: 500 });
  }
}
