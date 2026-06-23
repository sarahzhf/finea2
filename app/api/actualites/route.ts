import { NextResponse } from "next/server";
import Parser from "rss-parser";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const parser = new Parser({
  customFields: {
    item: ["media:content", "media:thumbnail", "enclosure"],
  },
});

const FEEDS = [
  { name: "Capital",         url: "https://www.capital.fr/rss",                                     color: "#e63946", logo: "C" },
  { name: "BFM Business",    url: "https://bfmbusiness.bfmtv.com/rss/info/rss_bfm_business_une.xml", color: "#e63946", logo: "B" },
  { name: "Le Monde Argent", url: "https://www.lemonde.fr/argent/rss_full.xml",                      color: "#1d3557", logo: "M" },
  { name: "MoneyVox",        url: "https://www.moneyvox.fr/actu/rss.php",                            color: "#2a9d8f", logo: "V" },
  { name: "Les Echos",       url: "https://syndication.lesechos.fr/rss/rss_une.xml",                 color: "#0077b6", logo: "E" },
];

const CATEGORIES: Record<string, string[]> = {
  budget:    ["budget", "depenses", "depense", "charges", "facture", "loyer", "consommation", "pouvoir d'achat"],
  epargne:   ["epargne", "livret", "placement", "investissement", "retraite", "patrimoine", "PEA", "assurance-vie"],
  credit:    ["credit", "pret", "emprunt", "taux", "immobilier", "banque", "endettement", "hypotheque"],
  emploi:    ["emploi", "salaire", "chomage", "recrutement", "CDI", "CDD", "travail", "revenus", "alternance"],
  bourse:    ["bourse", "actions", "CAC", "marche", "ETF", "fonds", "dividende", "indice"],
  fiscalite: ["impot", "fiscal", "taxe", "TVA", "declaration", "fisc", "prelevement"],
};

function detectCategory(title: string, summary: string): string {
  const text = `${title} ${summary}`.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORIES)) {
    if (keywords.some(k => text.includes(k))) return cat;
  }
  return "general";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractImage(item: any): string | null {
  if (item["media:content"]?.$.url) return item["media:content"].$.url;
  if (item["media:thumbnail"]?.$.url) return item["media:thumbnail"].$.url;
  if (item.enclosure?.url && item.enclosure.type?.startsWith("image/")) return item.enclosure.url;
  const match = item.content?.match(/<img[^>]+src="([^"]+)"/);
  if (match) return match[1];
  return null;
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  sourceColor: string;
  sourceLogo: string;
  category: string;
  publishedAt: string;
  image: string | null;
}

let cache: { articles: Article[]; ts: number } | null = null;
const CACHE_TTL = 15 * 60 * 1000;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    if (!cache || Date.now() - cache.ts > CACHE_TTL) {
      const results = await Promise.allSettled(
        FEEDS.map(feed =>
          parser.parseURL(feed.url).then(parsed =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            parsed.items.slice(0, 15).map((item: any): Article => ({
              id: `${feed.name}-${item.guid ?? item.link ?? item.title}`,
              title: item.title?.trim() ?? "",
              summary: item.contentSnippet?.slice(0, 200) ?? item.summary?.slice(0, 200) ?? "",
              url: item.link ?? "",
              source: feed.name,
              sourceColor: feed.color,
              sourceLogo: feed.logo,
              category: detectCategory(item.title ?? "", item.contentSnippet ?? ""),
              publishedAt: item.pubDate ?? item.isoDate ?? new Date().toISOString(),
              image: extractImage(item),
            }))
          )
        )
      );

      const articles: Article[] = [];
      for (const r of results) {
        if (r.status === "fulfilled") articles.push(...r.value);
      }

      articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      cache = { articles, ts: Date.now() };
    }

    const articles = category && category !== "all"
      ? cache.articles.filter(a => a.category === category)
      : cache.articles;

    return NextResponse.json({ articles: articles.slice(0, 60) });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erreur";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}