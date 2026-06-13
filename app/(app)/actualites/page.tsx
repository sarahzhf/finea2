"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { GOLD } from "@/lib/theme";

interface Article {
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

const CATEGORIES = [
  { key: "all",       label: "Tout"      },
  { key: "budget",    label: "Budget"    },
  { key: "epargne",   label: "Epargne"   },
  { key: "credit",    label: "Credit"    },
  { key: "emploi",    label: "Emploi"    },
  { key: "bourse",    label: "Bourse"    },
  { key: "fiscalite", label: "Fiscalite" },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `Il y a ${days}j`;
}

function SourceBadge({ source, logo, color }: { source: string; logo: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: color + "22", color }}>
      <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white"
        style={{ background: color }}>
        {logo}
      </span>
      {source}
    </span>
  );
}

function HeroArticle({ article }: { article: Article }) {
  return (
    <motion.a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="block rounded-[22px] overflow-hidden border border-white/10 bg-black/40 relative group"
      style={{ boxShadow: `0 0 32px ${GOLD}10` }}
    >
      {article.image ? (
        <div className="w-full h-40 overflow-hidden">
          <img src={article.image} alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
        </div>
      ) : (
        <div className="w-full h-28 flex items-center justify-center text-4xl"
          style={{ background: `linear-gradient(135deg, ${GOLD}15, rgba(255,255,255,0.03))` }}>
          📰
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <SourceBadge source={article.source} logo={article.sourceLogo} color={article.sourceColor} />
          <span className="text-slate-500 text-[10px]">{timeAgo(article.publishedAt)}</span>
        </div>
        <h2 className="text-white font-bold text-sm leading-snug mb-1.5 line-clamp-3"
          style={{ transition: "color 0.2s" }}>
          {article.title}
        </h2>
        {article.summary && (
          <p className="text-slate-400 text-[11px] line-clamp-2 leading-relaxed">{article.summary}</p>
        )}
        <div className="mt-3 flex items-center gap-1 text-xs font-semibold" style={{ color: GOLD }}>
          Lire
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </motion.a>
  );
}

function ArticleCard({ article, index }: { article: Article; index: number }) {
  return (
    <motion.a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex gap-3 p-3 rounded-[16px] border border-white/[0.07] bg-black/30 group transition-all"
      style={{ borderColor: "rgba(255,255,255,0.07)" }}
    >
      {article.image ? (
        <div className="w-16 h-14 rounded-xl overflow-hidden flex-shrink-0">
          <img src={article.image} alt=""
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
        </div>
      ) : (
        <div className="w-16 h-14 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.04)" }}>
          📄
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          <SourceBadge source={article.source} logo={article.sourceLogo} color={article.sourceColor} />
          <span className="text-slate-500 text-[9px]">{timeAgo(article.publishedAt)}</span>
        </div>
        <h3 className="text-white text-xs font-semibold leading-snug line-clamp-2">
          {article.title}
        </h3>
      </div>
    </motion.a>
  );
}

function SkeletonCard() {
  return (
    <div className="flex gap-3 p-3 rounded-[16px] border border-white/[0.07] bg-black/30 animate-pulse">
      <div className="w-16 h-14 rounded-xl flex-shrink-0" style={{ background: "rgba(255,255,255,0.07)" }} />
      <div className="flex-1 space-y-2">
        <div className="h-2.5 rounded-full w-20" style={{ background: "rgba(255,255,255,0.07)" }} />
        <div className="h-3.5 rounded-full w-full" style={{ background: "rgba(255,255,255,0.07)" }} />
        <div className="h-3.5 rounded-full w-3/4" style={{ background: "rgba(255,255,255,0.07)" }} />
      </div>
    </div>
  );
}

export default function ActualitesPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("all");

  useEffect(() => {
    setFetching(true);
    setError(null);
    const url = category === "all" ? "/api/actualites" : `/api/actualites?category=${category}`;
    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setArticles(data.articles ?? []);
      })
      .catch(e => setError(e.message))
      .finally(() => setFetching(false));
  }, [category]);

  const hero = articles[0];
  const rest = articles.slice(1);

  return (
    <div className="w-full h-full flex flex-col bg-[#050A14] text-slate-50">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.back()}
            className="w-9 h-9 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0"
            style={{ color: GOLD }}>
            <ArrowLeft size={17} />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-white leading-none">Actualites</h1>
            <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>Finance & economie</p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: "#4ade80" }}>
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Live
          </div>
        </div>

        {/* Masthead */}
        <div className="text-center py-2 border-y border-white/[0.06]">
          <div className="text-[9px] tracking-[0.3em] uppercase mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </div>
          <div className="font-black text-xl tracking-tight text-white">LE FINEA</div>
          <div className="text-[9px] tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>
            L'INFORMATION FINANCIERE DES JEUNES
          </div>
        </div>

        {/* Category filter */}
        <div className="flex gap-1.5 overflow-x-auto mt-3 pb-0.5" style={{ scrollbarWidth: "none" }}>
          {CATEGORIES.map(cat => (
            <button key={cat.key} onClick={() => setCategory(cat.key)}
              className="flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all"
              style={category === cat.key
                ? { background: GOLD, color: "#050A14" }
                : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }
              }>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">

        {/* Error */}
        {error && (
          <div className="p-3 rounded-2xl text-xs text-center text-red-300"
            style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)" }}>
            Impossible de charger — {error}
          </div>
        )}

        {/* Loading skeletons */}
        {fetching && (
          <div className="space-y-3">
            <div className="rounded-[22px] overflow-hidden border border-white/[0.07] bg-black/40 animate-pulse">
              <div className="w-full h-40" style={{ background: "rgba(255,255,255,0.07)" }} />
              <div className="p-4 space-y-2">
                <div className="h-2.5 rounded-full w-28" style={{ background: "rgba(255,255,255,0.07)" }} />
                <div className="h-4 rounded-full w-full" style={{ background: "rgba(255,255,255,0.07)" }} />
                <div className="h-4 rounded-full w-4/5" style={{ background: "rgba(255,255,255,0.07)" }} />
              </div>
            </div>
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty */}
        {!fetching && !error && articles.length === 0 && (
          <div className="text-center py-12">
            <div className="text-3xl mb-2">📭</div>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>Aucun article pour cette categorie</p>
          </div>
        )}

        {/* Content */}
        {!fetching && !error && articles.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div key={category}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="space-y-3">

              {hero && <HeroArticle article={hero} />}

              {rest.length > 0 && (
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-[10px] tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>A la une</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
              )}

              <div className="space-y-2">
                {rest.map((a, i) => (
                  <ArticleCard key={a.id} article={a} index={i} />
                ))}
              </div>

              <div className="pt-3 pb-2 text-center">
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                  Sources : Capital · BFM Business · Le Monde · MoneyVox · Les Echos
                </p>
                <p className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.18)" }}>Actualise toutes les 15 minutes</p>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}