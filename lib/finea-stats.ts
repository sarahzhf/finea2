// Moteur de stats par utilisateur pour Finéa.
// Lit les données Firestore propres à chaque utilisateur (transactions,
// épargne, objectifs) et en dérive des agrégats, un score de suivi et la
// progression des défis — pour que le dashboard, le score et les défis
// affichent les MÊMES valeurs, personnalisées par compte.

import { db } from "@/lib/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"

// ── Types ──────────────────────────────────────────────────────────────────
export interface UserAggregates {
  income: number            // total des entrées (type "in") sur la fenêtre
  expenses: number          // total des sorties (type "out", valeur absolue)
  savingsRate: number       // 0..1  (income - expenses) / income
  totalSaved: number        // somme des mises de côté (savings_entries)
  entriesThisMonth: number  // nombre de mises de côté ce mois-ci
  goalsCount: number
  goalsAvgProgress: number  // 0..1 progression moyenne des objectifs
  maxGoalProgress: number   // 0..1 meilleure progression d'objectif
  txCount: number           // nombre de transactions importées
  accountsTotal: number     // solde cumulé des comptes d'épargne
}

export interface ScoreResult {
  score: number             // 0..100
  label: string
  breakdown: { label: string; points: number; max: number; hint: string }[]
  insights: string[]
}

export interface ChallengeState {
  id: string
  title: string
  description: string
  emoji: string
  reward: number            // points de récompense
  progress: number          // 0..1
  current: number
  target: number
  unit: string
  completed: boolean
}

export interface UserStats {
  aggregates: UserAggregates
  score: ScoreResult
  challenges: ChallengeState[]
  completedChallenges: number
}

const EMPTY_AGG: UserAggregates = {
  income: 0, expenses: 0, savingsRate: 0, totalSaved: 0, entriesThisMonth: 0,
  goalsCount: 0, goalsAvgProgress: 0, maxGoalProgress: 0, txCount: 0, accountsTotal: 0,
}

// ── Lecture Firestore ────────────────────────────────────────────────────────
export async function fetchUserAggregates(uid: string): Promise<UserAggregates> {
  if (!uid) return { ...EMPTY_AGG }

  const now = new Date()
  const windowStart = new Date(now.getFullYear(), now.getMonth() - 2, 1)
  const windowPrefix = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
  const monthPrefix = windowPrefix(now)

  const [txSnap, entriesSnap, goalsSnap, accountsSnap] = await Promise.all([
    getDocs(query(collection(db, "transactions"), where("userId", "==", uid))),
    getDocs(query(collection(db, "savings_entries"), where("userId", "==", uid))),
    getDocs(query(collection(db, "savings_goals_v2"), where("userId", "==", uid))),
    getDocs(query(collection(db, "savings_accounts"), where("userId", "==", uid))),
  ])

  // Transactions → revenus / dépenses sur ~3 mois glissants
  let income = 0, expenses = 0
  const startStr = `${windowStart.getFullYear()}-${String(windowStart.getMonth() + 1).padStart(2, "0")}`
  txSnap.forEach((d) => {
    const data = d.data() as any
    const date: string = data.date ?? ""
    if (date.slice(0, 7) < startStr) return
    const amt = Number(data.amount) || 0
    if (data.type === "in") income += Math.abs(amt)
    else expenses += Math.abs(amt)
  })
  const savingsRate = income > 0 ? Math.max(0, Math.min(1, (income - expenses) / income)) : 0

  // Mises de côté
  let totalSaved = 0, entriesThisMonth = 0
  entriesSnap.forEach((d) => {
    const data = d.data() as any
    totalSaved += Number(data.amount) || 0
    if (typeof data.date === "string" && data.date.startsWith(monthPrefix)) entriesThisMonth++
  })

  // Objectifs
  let goalsAvgProgress = 0, maxGoalProgress = 0
  const goals = goalsSnap.docs.map((d) => d.data() as any)
  if (goals.length) {
    const progresses = goals.map((g) =>
      Math.min(1, (Number(g.currentAmount) || 0) / Math.max(Number(g.targetAmount) || 1, 1))
    )
    goalsAvgProgress = progresses.reduce((s, p) => s + p, 0) / progresses.length
    maxGoalProgress = Math.max(...progresses)
  }

  // Comptes d'épargne
  let accountsTotal = 0
  accountsSnap.forEach((d) => { accountsTotal += Number((d.data() as any).balance) || 0 })

  return {
    income, expenses, savingsRate, totalSaved, entriesThisMonth,
    goalsCount: goals.length, goalsAvgProgress, maxGoalProgress,
    txCount: txSnap.size, accountsTotal,
  }
}

// ── Défis (auto-calculés depuis les vraies données) ───────────────────────────
export function computeChallenges(a: UserAggregates): ChallengeState[] {
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
  return [
    {
      id: "premier-pas",
      title: "Premier pas",
      description: "Importe ton relevé bancaire pour démarrer le suivi.",
      emoji: "🚀", reward: 10, unit: "op.",
      current: a.txCount, target: 1,
      progress: clamp01(a.txCount / 1),
      completed: a.txCount >= 1,
    },
    {
      id: "epargne-reguliere",
      title: "Épargne régulière",
      description: "Enregistre 4 mises de côté ce mois-ci.",
      emoji: "📅", reward: 15, unit: "/ 4",
      current: a.entriesThisMonth, target: 4,
      progress: clamp01(a.entriesThisMonth / 4),
      completed: a.entriesThisMonth >= 4,
    },
    {
      id: "maitrise-depenses",
      title: "Maîtrise des dépenses",
      description: "Atteins un taux d'épargne de 15 %.",
      emoji: "🎯", reward: 20, unit: "%",
      current: Math.round(a.savingsRate * 100), target: 15,
      progress: clamp01(a.savingsRate / 0.15),
      completed: a.savingsRate >= 0.15,
    },
    {
      id: "objectif-en-vue",
      title: "Objectif en vue",
      description: "Atteins 50 % sur l'un de tes objectifs d'épargne.",
      emoji: "🏁", reward: 15, unit: "%",
      current: Math.round(a.maxGoalProgress * 100), target: 50,
      progress: clamp01(a.maxGoalProgress / 0.5),
      completed: a.maxGoalProgress >= 0.5,
    },
    {
      id: "batisseur",
      title: "Bâtisseur",
      description: "Cumule 500 € d'épargne enregistrée.",
      emoji: "🏗️", reward: 20, unit: "€",
      current: Math.round(a.totalSaved), target: 500,
      progress: clamp01(a.totalSaved / 500),
      completed: a.totalSaved >= 500,
    },
  ]
}

// ── Score de suivi ─────────────────────────────────────────────────────────
export function computeScore(a: UserAggregates, challenges: ChallengeState[]): ScoreResult {
  const completed = challenges.filter((c) => c.completed).length

  const savings  = Math.round(Math.min(a.savingsRate / 0.2, 1) * 35)         // 35 pts à 20 %
  const goals    = Math.round(a.goalsAvgProgress * 20)                       // 20 pts
  const activity = Math.round(Math.min(a.entriesThisMonth / 4, 1) * 15)      // 15 pts
  const defis    = Math.round((challenges.length ? completed / challenges.length : 0) * 20) // 20 pts
  const setup    = Math.round(((a.txCount > 0 ? 1 : 0) + (a.goalsCount > 0 ? 1 : 0)) / 2 * 10) // 10 pts

  const score = Math.max(0, Math.min(100, savings + goals + activity + defis + setup))
  const label = score >= 80 ? "Excellent" : score >= 60 ? "Bon" : score >= 40 ? "Moyen" : "À améliorer"

  const breakdown = [
    { label: "Taux d'épargne", points: savings,  max: 35, hint: `${Math.round(a.savingsRate * 100)}% du revenu épargné` },
    { label: "Objectifs",      points: goals,     max: 20, hint: `${a.goalsCount} objectif(s) · ${Math.round(a.goalsAvgProgress * 100)}% en moyenne` },
    { label: "Régularité",     points: activity,  max: 15, hint: `${a.entriesThisMonth} mise(s) de côté ce mois` },
    { label: "Défis réussis",  points: defis,     max: 20, hint: `${completed} / ${challenges.length} défis` },
    { label: "Configuration",  points: setup,     max: 10, hint: a.txCount > 0 ? "Données connectées" : "Importe un relevé" },
  ]

  const insights: string[] = []
  if (a.txCount === 0) insights.push("Importe ton relevé bancaire pour activer ton suivi 📥")
  if (a.income > 0 && a.savingsRate < 0.1) insights.push("Ton taux d'épargne est faible — vise au moins 10 % du revenu 💡")
  else if (a.savingsRate >= 0.15) insights.push("Beau taux d'épargne, tu maîtrises tes dépenses 👏")
  if (a.entriesThisMonth === 0) insights.push("Aucune mise de côté ce mois — programme un virement automatique ⏱️")
  else if (a.entriesThisMonth >= 4) insights.push("Ton épargne est régulière, continue comme ça 🔥")
  if (a.goalsCount === 0) insights.push("Crée un objectif d'épargne pour te donner un cap 🎯")
  else if (a.maxGoalProgress >= 0.5) insights.push("Tu es à plus de la moitié d'un objectif, bientôt atteint ! 🏁")
  if (insights.length === 0) insights.push("Continue à enregistrer tes opérations pour affiner ton score.")

  return { score, label, breakdown, insights: insights.slice(0, 4) }
}

// ── Tout-en-un ────────────────────────────────────────────────────────────────
export async function fetchUserStats(uid: string): Promise<UserStats> {
  const aggregates = await fetchUserAggregates(uid)
  const challenges = computeChallenges(aggregates)
  const score = computeScore(aggregates, challenges)
  return { aggregates, score, challenges, completedChallenges: challenges.filter((c) => c.completed).length }
}
