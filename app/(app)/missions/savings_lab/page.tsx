"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

type BucketKey = "safety" | "midTerm" | "longTerm" | "fun";
type Phase = "intro" | "allocate" | "event" | "result";

const BUCKETS: { key: BucketKey; label: string; icon: string; color: string; bg: string; hint: string }[] = [
  { key: "safety",   label: "Coussin de sécurité", icon: "🛡️", color: "#38bdf8", bg: "rgba(56,189,248,0.07)",  hint: "Imprévus & filet de sécurité" },
  { key: "midTerm",  label: "Projets 1–3 ans",     icon: "🎯", color: "#a78bfa", bg: "rgba(167,139,250,0.07)", hint: "Voyage, formation, achat..." },
  { key: "longTerm", label: "Long terme",           icon: "📈", color: "#fbbf24", bg: "rgba(251,191,36,0.07)",  hint: "Investissement & retraite" },
  { key: "fun",      label: "Plaisir du mois",      icon: "✨", color: "#f472b6", bg: "rgba(244,114,182,0.07)", hint: "Vie sociale, envies, sorties" },
];

interface Scenario {
  id: number;
  title: string;
  tag: string;
  body: string;
  total: number;
  ideal: Record<BucketKey, number>;
  shock: {
    emoji: string;
    title: string;
    body: string;
    cost: number;
    target: BucketKey;
  };
}

const SCENARIOS: Scenario[] = [
  {
    id: 1,
    title: "CDD 6 mois",
    tag: "Scénario précaire",
    body: "Tu viens d'être embauché en CDD pour 6 mois. Tu veux partir en Asie d'ici 10 mois. Ton épargne est quasi-nulle. Tu peux mettre 300 € de côté ce mois.",
    total: 300,
    ideal: { safety: 160, midTerm: 80, longTerm: 20, fun: 40 },
    shock: {
      emoji: "🚗",
      title: "Crevaison sur l'autoroute",
      body: "Mauvaise journée : pneu crevé sur la voie rapide. Dépannage + remplacement = 80 € cash prélevés sur ton coussin de sécurité.",
      cost: 80,
      target: "safety",
    },
  },
  {
    id: 2,
    title: "CDI + crédit conso",
    tag: "Scénario sous pression",
    body: "Tu es en CDI stable mais tu rembourses 400 €/mois d'un crédit à 18 %. Il reste 18 mensualités. Ce mois tu dégages 300 € à placer.",
    total: 300,
    ideal: { safety: 100, midTerm: 130, longTerm: 50, fun: 20 },
    shock: {
      emoji: "💳",
      title: "Offre de remboursement anticipé",
      body: "Ta banque propose de solder le crédit maintenant : pénalité de 60 €, mais tu économises 340 € d'intérêts sur la durée. L'argent vient de tes projets.",
      cost: 60,
      target: "midTerm",
    },
  },
  {
    id: 3,
    title: "Alternance M1",
    tag: "Premiers revenus",
    body: "Tu es en alternance, 1 150 € net. Loyer + charges = 780 €. Avec de la discipline, tu peux mettre 250 € de côté ce mois.",
    total: 250,
    ideal: { safety: 110, midTerm: 60, longTerm: 50, fun: 30 },
    shock: {
      emoji: "🎉",
      title: "Week-end cohésion d'équipe",
      body: "Ton équipe organise un week-end sortie à 50 €. Pas obligatoire, mais c'est ton réseau. Prélevé sur ton enveloppe plaisir.",
      cost: 50,
      target: "fun",
    },
  },
];

const ZERO: Record<BucketKey, number> = { safety: 0, midTerm: 0, longTerm: 0, fun: 0 };

function calcScore(amounts: Record<BucketKey, number>, ideal: Record<BucketKey, number>, total: number): number {
  const totalDev = (["safety", "midTerm", "longTerm", "fun"] as BucketKey[]).reduce(
    (s, k) => s + Math.abs(amounts[k] - ideal[k]),
    0,
  );
  return Math.max(0, Math.min(100, Math.round(100 - (totalDev / total) * 100)));
}

function getAdjustedIdeal(s: Scenario): Record<BucketKey, number> {
  const ideal = { ...s.ideal };
  const reduction = Math.min(ideal[s.shock.target], s.shock.cost);
  ideal[s.shock.target] -= reduction;
  const redistKey: BucketKey = s.shock.target === "safety" ? "midTerm" : "safety";
  ideal[redistKey] += reduction;
  return ideal;
}

function getProfile(amounts: Record<BucketKey, number>, total: number) {
  const s = amounts.safety / total;
  const f = amounts.fun / total;
  const l = amounts.longTerm / total;
  const m = amounts.midTerm / total;
  if (s > 0.5)  return { label: "Profil Forteresse", emoji: "🛡️", desc: "Tu sécurises beaucoup. Rassurant, mais attention à ne pas trop immobiliser au détriment de tes objectifs." };
  if (f > 0.3)  return { label: "Profil YOLO",       emoji: "✨", desc: "Tu vis fort le présent ! Assure-toi juste que ton futur toi sera aussi content que toi maintenant." };
  if (l > 0.2)  return { label: "Profil Investisseur", emoji: "📈", desc: "Tu penses long terme. C'est rare et précieux. Garde juste assez de marge pour le court terme." };
  if (m > 0.35) return { label: "Profil Projectif",  emoji: "🎯", desc: "Tu avances concrètement sur tes objectifs à moyen terme. Ton plan est solide." };
  return         { label: "Profil Équilibré",         emoji: "⚖️", desc: "Tu jonglages bien entre sécurité, projets et vie quotidienne — un équilibre sain et difficile à tenir." };
}

function getMascotLine(score: number): string {
  if (score >= 80) return "Franchement bien joué. Ta répartition est très cohérente avec le contexte de ce scénario.";
  if (score >= 60) return "Pas mal ! Quelques ajustements et tu serais au top. Regarde les écarts avec ma proposition.";
  if (score >= 40) return "Il y a des angles à retravailler. Regarde surtout où tu t'éloignes le plus de ma suggestion.";
  return "On est assez loin de l'optimal pour ce scénario. Pas de souci — c'est fait pour apprendre. Essaie de nouveau !";
}

function scoreColor(s: number) {
  return s >= 70 ? "#4ade80" : s >= 45 ? "#fbbf24" : "#f87171";
}

function AllocationBar({ amounts, total }: { amounts: Record<BucketKey, number>; total: number }) {
  return (
    <div className="h-1.5 rounded-full overflow-hidden flex flex-nowrap bg-white/5">
      {BUCKETS.map(b => {
        const pct = (amounts[b.key] / total) * 100;
        return (
          <motion.div
            key={b.key}
            className="h-full shrink-0"
            style={{ backgroundColor: b.color }}
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
          />
        );
      })}
    </div>
  );
}

function BucketRow({
  meta, amount, total, remaining, onChange,
}: {
  meta: typeof BUCKETS[0]; amount: number; total: number; remaining: number; onChange: (v: number) => void;
}) {
  const pct = total > 0 ? (amount / total) * 100 : 0;
  return (
    <motion.div layout className="rounded-2xl p-3 space-y-2 border border-white/[0.07]" style={{ backgroundColor: meta.bg }}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base leading-none">{meta.icon}</span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-100 leading-tight">{meta.label}</p>
            <p className="text-[9px] text-slate-500 leading-tight mt-0.5">{meta.hint}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <motion.button whileTap={{ scale: 0.8 }} onClick={() => onChange(Math.max(0, amount - 10))} disabled={amount < 10}
            className="w-7 h-7 rounded-full bg-black/50 border border-white/10 text-slate-300 text-sm font-bold flex items-center justify-center disabled:opacity-25 transition">
            −
          </motion.button>
          <motion.span key={amount} initial={{ scale: 1.2, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="text-sm font-bold text-slate-50 w-12 text-center tabular-nums">
            {amount} €
          </motion.span>
          <motion.button whileTap={{ scale: 0.8 }} onClick={() => onChange(amount + 10)} disabled={remaining < 10}
            className="w-7 h-7 rounded-full bg-black/50 border border-white/10 text-slate-300 text-sm font-bold flex items-center justify-center disabled:opacity-25 transition">
            +
          </motion.button>
        </div>
      </div>
      <div className="h-1 rounded-full bg-black/40 overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ backgroundColor: meta.color }}
          animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 260, damping: 30 }} />
      </div>
    </motion.div>
  );
}

export default function SavingsLabPage() {
  const router = useRouter();
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");
  const [amounts, setAmounts] = useState<Record<BucketKey, number>>({ ...ZERO });
  const [isPostShock, setIsPostShock] = useState(false);
  const [scores, setScores] = useState<number[]>([]);

  const scenario = SCENARIOS[scenarioIdx];
  const total = scenario.total;
  const allocated = amounts.safety + amounts.midTerm + amounts.longTerm + amounts.fun;
  const remaining = total - allocated;

  const handleChange = (key: BucketKey, value: number) => {
    setAmounts(prev => ({ ...prev, [key]: value }));
  };

  const handleValidate = () => {
    if (remaining !== 0) return;
    if (isPostShock) {
      const adjIdeal = getAdjustedIdeal(scenario);
      setScores(prev => [...prev, calcScore(amounts, adjIdeal, total)]);
      setPhase("result");
    } else {
      setPhase("event");
    }
  };

  const handleAbsorbShock = () => {
    const { cost, target } = scenario.shock;
    setAmounts(prev => ({ ...prev, [target]: Math.max(0, prev[target] - cost) }));
    setIsPostShock(true);
    setPhase("allocate");
  };

  const handleNextScenario = () => {
    const next = (scenarioIdx + 1) % SCENARIOS.length;
    setScenarioIdx(next);
    setAmounts({ ...ZERO });
    setIsPostShock(false);
    setPhase("intro");
  };

  const handleReplay = () => {
    setAmounts({ ...ZERO });
    setIsPostShock(false);
    setPhase("intro");
  };

  const lastScore = scores[scores.length - 1] ?? 0;
  const profile = phase === "result" ? getProfile(amounts, total) : null;

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-[#020617] via-[#020617] to-[#0b1120] text-slate-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0">
        <div>
          <p className="text-[9px] uppercase tracking-[0.22em] text-slate-500">
            Scénario {scenarioIdx + 1} / {SCENARIOS.length}
          </p>
          <h1 className="text-[15px] font-bold text-slate-50 mt-0.5 tracking-tight">Savings Lab</h1>
        </div>
        <div className="flex items-center gap-2">
          {scores.map((s, i) => (
            <motion.div key={i} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="rounded-full px-2 py-0.5 text-[9px] font-bold border"
              style={{ color: scoreColor(s), backgroundColor: `${scoreColor(s)}18`, borderColor: `${scoreColor(s)}40` }}>
              S{i + 1} · {s}
            </motion.div>
          ))}
          <button onClick={() => router.push("/missions")}
            className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] text-slate-300 hover:bg-white/10 transition">
            ‹ Hub
          </button>
        </div>
      </div>

      {/* Phase content */}
      <div className="flex-1 overflow-y-auto px-5 pb-5 pt-1 min-h-0">
        <AnimatePresence mode="wait">

          {/* INTRO */}
          {phase === "intro" && (
            <motion.div key="intro" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.35 }} className="flex flex-col gap-3">
              <div className="rounded-3xl bg-black/50 border border-white/10 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-400/20 flex items-center justify-center text-xl shrink-0">
                    🧪
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.18em] text-emerald-400 font-medium">{scenario.tag}</p>
                    <h2 className="text-sm font-bold text-slate-50 mt-0.5">{scenario.title}</h2>
                  </div>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">{scenario.body}</p>
                <div className="rounded-xl bg-white/5 border border-white/[0.08] px-3 py-2 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">À répartir ce mois</span>
                  <span className="text-sm font-bold text-emerald-400">{total} €</span>
                </div>
              </div>

              <div className="rounded-2xl bg-black/30 border border-white/[0.06] px-4 py-3 space-y-2">
                <p className="text-[10px] font-semibold text-slate-400">Tes 4 enveloppes</p>
                {BUCKETS.map((b, i) => (
                  <motion.div key={b.key} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }} className="flex items-center gap-2">
                    <span className="text-sm w-5 text-center">{b.icon}</span>
                    <span className="text-[10px] font-medium text-slate-200">{b.label}</span>
                    <span className="text-[9px] text-slate-500 truncate">{b.hint}</span>
                  </motion.div>
                ))}
              </div>

              <div className="rounded-2xl bg-amber-500/10 border border-amber-400/20 px-3 py-2 flex items-center gap-2">
                <span className="text-lg shrink-0">⚡</span>
                <p className="text-[10px] text-amber-300 leading-snug">
                  Un événement imprévu surviendra en cours de partie. Ton plan devra s'adapter.
                </p>
              </div>

              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setPhase("allocate")}
                className="w-full rounded-full bg-emerald-500 text-white text-[12px] font-bold py-3 mt-1 shadow-[0_0_28px_rgba(34,197,94,0.35)] hover:bg-emerald-400 transition">
                Lancer le labo →
              </motion.button>
            </motion.div>
          )}

          {/* ALLOCATE / REALLOCATE */}
          {phase === "allocate" && (
            <motion.div key={isPostShock ? "reallocate" : "allocate"}
              initial={{ opacity: 0, x: isPostShock ? -24 : 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }} className="flex flex-col gap-2">
              {isPostShock && (
                <motion.div initial={{ opacity: 0, scale: 0.95, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="rounded-2xl bg-rose-500/10 border border-rose-400/20 px-3 py-2 flex items-center gap-2">
                  <span className="text-lg shrink-0">{scenario.shock.emoji}</span>
                  <p className="text-[10px] text-rose-300 leading-snug">
                    <span className="font-semibold">{scenario.shock.cost} € prélevés</span> sur «{" "}
                    {BUCKETS.find(b => b.key === scenario.shock.target)?.label} ». Redistribue pour équilibrer.
                  </p>
                </motion.div>
              )}

              <div className="rounded-2xl bg-black/50 border border-white/[0.08] px-4 py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider">Budget total</p>
                  <p className="text-sm font-bold text-slate-50">{total} €</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider">À placer</p>
                  <motion.p key={remaining} initial={{ scale: 1.15 }} animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400 }}
                    className={`text-sm font-bold tabular-nums ${remaining === 0 ? "text-emerald-400" : remaining > 0 ? "text-sky-300" : "text-rose-400"}`}>
                    {remaining === 0 ? "Parfait ✓" : remaining > 0 ? `+${remaining} €` : `${remaining} €`}
                  </motion.p>
                </div>
              </div>

              <AllocationBar amounts={amounts} total={total} />

              <div className="space-y-2">
                {BUCKETS.map(b => (
                  <BucketRow key={b.key} meta={b} amount={amounts[b.key]} total={total} remaining={remaining}
                    onChange={v => handleChange(b.key, v)} />
                ))}
              </div>

              <motion.button whileTap={{ scale: 0.97 }} onClick={handleValidate} disabled={remaining !== 0}
                className="w-full rounded-full bg-white text-slate-900 text-[12px] font-bold py-3 mt-1 disabled:opacity-25 shadow-sm hover:bg-slate-100 transition">
                {remaining === 0
                  ? isPostShock ? "Voir mes résultats →" : "Valider ma répartition →"
                  : remaining > 0 ? `Encore ${remaining} € à placer` : `Dépassement de ${Math.abs(remaining)} €`}
              </motion.button>

              <button onClick={() => { const ref = isPostShock ? getAdjustedIdeal(scenario) : scenario.ideal; setAmounts({ ...ref }); }}
                className="w-full rounded-full bg-white/[0.04] border border-white/10 text-[10px] text-slate-400 py-2 hover:bg-white/[0.08] transition">
                Voir la suggestion Finéa
              </button>
            </motion.div>
          )}

          {/* EVENT */}
          {phase === "event" && (
            <motion.div key="event" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-4 justify-center py-6">
              <div className="relative rounded-3xl border border-rose-400/30 bg-rose-500/[0.08] p-5 space-y-4 overflow-hidden">
                <div className="pointer-events-none absolute -inset-4 bg-rose-500/10 blur-2xl rounded-full" />
                <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 280 }} className="text-6xl text-center">
                  {scenario.shock.emoji}
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28 }} className="space-y-2 text-center">
                  <p className="text-[9px] uppercase tracking-[0.22em] text-rose-400 font-semibold">Événement imprévu</p>
                  <h3 className="text-base font-bold text-slate-50">{scenario.shock.title}</h3>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{scenario.shock.body}</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.44 }} className="rounded-2xl bg-black/50 border border-white/10 px-4 py-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Impact financier</span>
                    <span className="text-sm font-bold text-rose-400">−{scenario.shock.cost} €</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Enveloppe touchée</span>
                    <span className="text-[11px] font-semibold text-slate-200 flex items-center gap-1">
                      {BUCKETS.find(b => b.key === scenario.shock.target)?.icon}
                      {BUCKETS.find(b => b.key === scenario.shock.target)?.label}
                    </span>
                  </div>
                </motion.div>
              </div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
                className="rounded-2xl bg-black/30 border border-white/[0.06] px-4 py-3">
                <p className="text-[10px] text-slate-400 leading-snug">
                  Ton plan vient d'être bousculé. Tu vas devoir réajuster ta répartition en tenant compte de cet imprévu.
                </p>
              </motion.div>

              <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }} whileTap={{ scale: 0.97 }} onClick={handleAbsorbShock}
                className="w-full rounded-full bg-rose-500 text-white text-[12px] font-bold py-3 shadow-[0_0_28px_rgba(239,68,68,0.3)] hover:bg-rose-400 transition">
                Absorber et réajuster →
              </motion.button>
            </motion.div>
          )}

          {/* RESULT */}
          {phase === "result" && profile && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="flex flex-col gap-3">
              <div className="rounded-3xl bg-black/50 border border-white/10 p-4 text-center space-y-2">
                <p className="text-[9px] uppercase tracking-[0.22em] text-slate-500">Résultat de ce scénario</p>
                <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.08, type: "spring", stiffness: 240 }}
                  className="text-6xl font-black tabular-nums leading-none" style={{ color: scoreColor(lastScore) }}>
                  {lastScore}
                </motion.div>
                <p className="text-[9px] text-slate-500">/ 100</p>
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
                  <p className="text-sm font-bold text-slate-100">{profile.emoji} {profile.label}</p>
                  <p className="text-[10px] text-slate-400 mt-1 leading-snug">{profile.desc}</p>
                </motion.div>
              </div>

              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="rounded-2xl bg-black/40 border border-white/[0.08] p-3 space-y-2.5">
                <p className="text-[10px] font-semibold text-slate-300">Ta répartition vs Finéa</p>
                {BUCKETS.map((b, i) => {
                  const adjIdeal = getAdjustedIdeal(scenario);
                  const userAmt = amounts[b.key];
                  const idealAmt = adjIdeal[b.key];
                  const diff = userAmt - idealAmt;
                  return (
                    <motion.div key={b.key} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + i * 0.07 }} className="flex items-center gap-2">
                      <span className="text-base w-5 text-center shrink-0">{b.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-[9px] mb-1">
                          <span className="text-slate-400 truncate">{b.label}</span>
                          <span className="font-semibold tabular-nums shrink-0 ml-1"
                            style={{ color: diff === 0 ? "#4ade80" : Math.abs(diff) <= 20 ? "#fbbf24" : "#f87171" }}>
                            {userAmt} €{diff !== 0 && ` (${diff > 0 ? "+" : ""}${diff})`}
                          </span>
                        </div>
                        <div className="relative h-1.5 rounded-full bg-black/40 overflow-hidden">
                          <div className="absolute h-full rounded-full bg-white/15"
                            style={{ width: `${(idealAmt / total) * 100}%` }} />
                          <motion.div className="absolute h-full rounded-full" style={{ backgroundColor: b.color }}
                            initial={{ width: 0 }} animate={{ width: `${(userAmt / total) * 100}%` }}
                            transition={{ delay: 0.4 + i * 0.07, type: "spring", stiffness: 200 }} />
                        </div>
                        <p className="text-[8px] text-slate-600 mt-0.5">Finéa : {idealAmt} €</p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
                className="rounded-2xl bg-black/30 border border-white/[0.07] px-4 py-3 flex gap-3 items-start">
                <img src="/icons/fineamascotte.png" alt="Finéa" className="w-8 h-8 rounded-full object-cover shrink-0" />
                <p className="text-[10px] text-slate-300 leading-relaxed">{getMascotLine(lastScore)}</p>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }}
                className="flex gap-2">
                <motion.button whileTap={{ scale: 0.96 }} onClick={handleReplay}
                  className="flex-1 rounded-full bg-white/[0.04] border border-white/10 text-[11px] text-slate-300 py-2.5 hover:bg-white/[0.08] transition">
                  Rejouer
                </motion.button>
                <motion.button whileTap={{ scale: 0.96 }} onClick={handleNextScenario}
                  className="flex-1 rounded-full bg-emerald-500 text-white text-[11px] font-bold py-2.5 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:bg-emerald-400 transition">
                  Scénario suivant →
                </motion.button>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
