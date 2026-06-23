<<<<<<< HEAD
"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Heart, MessageCircle, Share2, Plus, Newspaper, TrendingUp, X, Loader2, Send, Trash2 } from "lucide-react"
import { GOLD, GOLD_DIM, BG_CARD, BORDER, GREEN } from "@/lib/theme"
import { db } from "@/lib/firebase"
import {
  collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, deleteDoc,
  getDoc, getDocs, setDoc, serverTimestamp, arrayUnion, arrayRemove, increment, limit,
} from "firebase/firestore"
import { useAuth } from "@/components/AuthProvider"

interface Post {
  id: string
  authorId: string
  authorName: string
  avatar: string
  title: string
  content: string
  tags: string[]
  likedBy: string[]
  commentsCount: number
  createdAt: any
}
interface Comment {
  id: string
  authorId: string
  authorName: string
  content: string
  createdAt: any
}

const TAG_OPTIONS = ["Budget", "Épargne", "Crédit", "Question", "Astuce", "Expérience", "Placement"]

// Posts de démarrage (écrits une seule fois si la communauté est vide)
const SEED_POSTS = [
  {
    authorName: "Marie L.", avatar: "ML",
    title: "Comment j'ai économisé 500 € en 1 mois sans me priver",
    content: "J'ai appliqué la règle 50/30/20 strictement ce mois-ci. Résultat : 523 € d'économies ! La clé : automatiser le virement le jour de la paie, avant de voir l'argent.",
    tags: ["Budget", "Épargne"],
  },
  {
    authorName: "Alex T.", avatar: "AT",
    title: "Mon template Excel pour suivre son budget",
    content: "Je partage la méthode qui m'a changé la vie : une feuille par mois, une colonne par catégorie, et un graphique automatique. Posez vos questions !",
    tags: ["Astuce", "Budget"],
  },
  {
    authorName: "Sophie R.", avatar: "SR",
    title: "Livret A ou assurance-vie ? Votre avis ?",
    content: "J'ai 10 000 € à placer pour 5 ans. Livret A pour la dispo, ou assurance-vie pour le rendement ? Qu'est-ce qui vaut mieux selon vous ?",
    tags: ["Question", "Placement"],
  },
]

function timeAgo(ts: any) {
  const d = ts?.toDate?.() ?? (ts ? new Date(ts) : null)
  if (!d) return "à l'instant"
  const mins = Math.floor((Date.now() - d.getTime()) / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `${mins}min`
  const h = Math.floor(mins / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}j`
}

function initialsOf(name: string) {
  return name.split(/[\s_.-]+/).filter(Boolean).map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"
}

// Nettoie un nom/pseudo : remplace _ - . par des espaces (pas de séparateurs entre les mots)
function cleanName(s: string) {
  return (s || "").replace(/[_\-.]+/g, " ").replace(/\s+/g, " ").trim()
=======
﻿"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Heart, MessageCircle, Share2, Plus, Newspaper, TrendingUp } from "lucide-react"
import { GOLD, GOLD_DIM, BG_CARD, BORDER } from "@/lib/theme"

const posts = [
  {
    id: 1, user: "Marie L.", avatar: "ML", time: "2h", badge: "Expert",
    title: "Comment j'ai economise 500 EUR en 1 mois sans me priver",
    preview: "J'ai applique la regle 50/30/20 strictement ce mois-ci. Resultat : 523 EUR d'economies ! Voici ma methode en detail...",
    likes: 42, comments: 8, tags: ["Budget", "Epargne"],
  },
  {
    id: 2, user: "Alex T.", avatar: "AT", time: "5h", badge: "Actif",
    title: "Mes astuces pour suivre son budget avec un fichier Excel",
    preview: "Je partage mon template Excel gratuit qui m'a change la vie. Il calcule automatiquement vos depenses par categorie...",
    likes: 28, comments: 15, tags: ["Excel", "Organisation"],
  },
  {
    id: 3, user: "Sophie R.", avatar: "SR", time: "1j", badge: "Debutant",
    title: "Livret A ou assurance-vie ? Votre avis ?",
    preview: "Je me pose la question depuis quelques semaines. J'ai 10 000 EUR a placer pour 5 ans. Livret A ou assurance-vie, qu'est-ce qui vaut mieux selon vous ?",
    likes: 19, comments: 34, tags: ["Question", "Placement"],
  },
  {
    id: 4, user: "Karim B.", avatar: "KB", time: "2j", badge: "Expert",
    title: "Retour d'experience : 6 mois sans depenses inutiles",
    preview: "Il y a 6 mois je me suis lance un defi : 0 depense non-essentielle. Voici ce que j'ai appris sur moi-meme et sur la gestion financiere...",
    likes: 87, comments: 22, tags: ["Defi", "Experience"],
  },
]

const badgeColors: Record<string, string> = {
  Expert: GOLD, Actif: "#4ade80", Debutant: "#60a5fa",
>>>>>>> c2ce98782d34bda170bcf3571c6142480a36998b
}

export default function Communaute() {
  const router = useRouter()
<<<<<<< HEAD
  const { user } = useAuth()

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(0) // 0 Tendances · 1 Récent · 2 Questions

  // Identité communautaire (par compte)
  const [pseudo, setPseudo] = useState<string>("")
  const [needPseudo, setNeedPseudo] = useState(false)
  const [pseudoInput, setPseudoInput] = useState("")

  // Création de post
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newContent, setNewContent] = useState("")
  const [newTags, setNewTags] = useState<string[]>([])
  const [posting, setPosting] = useState(false)

  // Détail post + commentaires
  const [openPost, setOpenPost] = useState<Post | null>(null)

  const seededRef = useRef(false)

  // ── Charge le pseudo depuis le profil utilisateur ──────────────────────────
  useEffect(() => {
    if (!user) { setPseudo(""); return }
    ;(async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid))
        const saved = snap.exists() ? (snap.data() as any)?.communityPseudo : null
        setPseudo(cleanName(saved || user.displayName || user.email?.split("@")[0] || ""))
      } catch {
        setPseudo(cleanName(user.displayName || user.email?.split("@")[0] || ""))
      }
    })()
  }, [user])

  // ── Flux temps réel des posts (partagé entre tous les utilisateurs) ─────────
  useEffect(() => {
    const q = query(collection(db, "community_posts"), orderBy("createdAt", "desc"), limit(60))
    const unsub = onSnapshot(q, async (snap) => {
      // Seed initial si vide
      if (snap.empty && !seededRef.current) {
        seededRef.current = true
        for (const p of SEED_POSTS) {
          await addDoc(collection(db, "community_posts"), {
            authorId: "seed", authorName: p.authorName, avatar: p.avatar,
            title: p.title, content: p.content, tags: p.tags,
            likedBy: [], commentsCount: 0, createdAt: serverTimestamp(),
          })
        }
        return
      }
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Post)))
      setLoading(false)
    }, (err) => { console.error(err); setLoading(false) })
    return unsub
  }, [])

  const ensurePseudo = useCallback((then: () => void) => {
    if (!user) { router.push("/login"); return }
    if (!pseudo) { setNeedPseudo(true); return }
    then()
  }, [user, pseudo, router])

  async function savePseudo() {
    const clean = cleanName(pseudoInput.replace(/[^a-zA-Z0-9À-ÿ _.\-]/g, ""))
    if (clean.length < 2 || !user) return
    setPseudo(clean)
    setNeedPseudo(false)
    setPseudoInput("")
    try { await setDoc(doc(db, "users", user.uid), { communityPseudo: clean }, { merge: true }) }
    catch (e) { console.error(e) }
  }

  async function toggleLike(p: Post) {
    if (!user) { router.push("/login"); return }
    const liked = p.likedBy?.includes(user.uid)
    try {
      await updateDoc(doc(db, "community_posts", p.id), {
        likedBy: liked ? arrayRemove(user.uid) : arrayUnion(user.uid),
      })
    } catch (e) { console.error(e) }
  }

  async function createPost() {
    if (!user || !pseudo) return
    if (newTitle.trim().length < 2 || newContent.trim().length < 2) return
    setPosting(true)
    try {
      await addDoc(collection(db, "community_posts"), {
        authorId: user.uid,
        authorName: pseudo,
        avatar: initialsOf(pseudo),
        title: newTitle.trim(),
        content: newContent.trim(),
        tags: newTags.length ? newTags : ["Général"],
        likedBy: [],
        commentsCount: 0,
        createdAt: serverTimestamp(),
      })
      setShowCreate(false); setNewTitle(""); setNewContent(""); setNewTags([])
    } catch (e) { console.error(e); alert("Erreur lors de la publication") }
    finally { setPosting(false) }
  }

  async function deletePost(p: Post) {
    if (!user || p.authorId !== user.uid) return
    try { await deleteDoc(doc(db, "community_posts", p.id)) } catch (e) { console.error(e) }
  }

  // Tri selon l'onglet
  const visible = [...posts]
  if (tab === 0) visible.sort((a, b) => (b.likedBy?.length ?? 0) - (a.likedBy?.length ?? 0))
  else if (tab === 2) { /* questions */ }
  const filtered = tab === 2 ? visible.filter(p => p.tags?.includes("Question")) : visible

  const onlineCount = 80 + (posts.length * 7) % 120
=======
  const [likes, setLikes] = useState<Record<number, boolean>>({})
  const [tab, setTab] = useState(0)
>>>>>>> c2ce98782d34bda170bcf3571c6142480a36998b

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="px-5 pt-10 pb-0 shrink-0">
<<<<<<< HEAD
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-1">
          <div>
            <h1 className="text-[26px] font-bold text-white">Communauté</h1>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>
              {posts.length} publication{posts.length > 1 ? "s" : ""} · {onlineCount} en ligne
            </p>
=======
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-1">
          <div>
            <h1 className="text-[26px] font-bold text-white">Communaute</h1>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>2 847 membres - 143 en ligne</p>
>>>>>>> c2ce98782d34bda170bcf3571c6142480a36998b
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.push("/actualites")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: BG_CARD, border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.6)" }}>
<<<<<<< HEAD
            <Newspaper size={13} /> Actu
          </motion.button>
        </motion.div>

        {/* Bandeau identité */}
        {pseudo && (
          <button onClick={() => { setPseudoInput(pseudo); setNeedPseudo(true) }}
            className="flex items-center gap-1.5 mt-2 mb-1 px-2.5 py-1 rounded-full"
            style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: GREEN }} />
            <span className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
              Tu publies sous <span style={{ color: GOLD }}>{pseudo}</span>
            </span>
          </button>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mt-3 mb-4">
          {["Tendances", "Récent", "Questions"].map((t, i) => (
            <motion.button key={t} whileTap={{ scale: 0.93 }} onClick={() => setTab(i)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{ background: tab === i ? GOLD : BG_CARD, color: tab === i ? "#050A14" : "rgba(255,255,255,0.5)", border: `1px solid ${tab === i ? GOLD : BORDER}` }}>
=======
            <Newspaper size={13} />
            Actu
          </motion.button>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4 mb-4">
          {["Tendances", "Recent", "Questions"].map((t, i) => (
            <motion.button key={t} whileTap={{ scale: 0.93 }} onClick={() => setTab(i)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{
                background: tab === i ? GOLD : BG_CARD,
                color: tab === i ? "#050A14" : "rgba(255,255,255,0.5)",
                border: `1px solid ${tab === i ? GOLD : BORDER}`,
              }}>
>>>>>>> c2ce98782d34bda170bcf3571c6142480a36998b
              {t}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Posts */}
<<<<<<< HEAD
      <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-24 flex flex-col gap-3">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin" style={{ color: GOLD }} /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-sm text-white/50">Aucune publication ici.</p>
            <p className="text-[11px] mt-1 text-white/30">Sois le premier à partager !</p>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((p, i) => {
              const liked = user ? p.likedBy?.includes(user.uid) : false
              const mine = user && p.authorId === user.uid
              return (
                <motion.div key={p.id} layout
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ delay: Math.min(i * 0.05, 0.3) }}
                  onClick={() => setOpenPost(p)}
                  className="rounded-3xl p-4 cursor-pointer"
                  style={{ background: BG_CARD, border: `1px solid ${mine ? "rgba(236,204,104,0.3)" : BORDER}` }}>
                  {/* Author */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DIM})`, color: "#050A14" }}>
                      {p.avatar || initialsOf(p.authorName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-white truncate">{p.authorName}</p>
                        {mine && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: `${GOLD}22`, color: GOLD }}>Toi</span>}
                      </div>
                      <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.32)" }}>il y a {timeAgo(p.createdAt)}</p>
                    </div>
                    {mine ? (
                      <button onClick={(e) => { e.stopPropagation(); deletePost(p) }} className="p-1">
                        <Trash2 size={13} color="rgba(248,113,113,0.55)" />
                      </button>
                    ) : <TrendingUp size={13} color="rgba(255,255,255,0.2)" />}
                  </div>

                  <p className="text-sm font-bold text-white mb-1.5">{p.title}</p>
                  <p className="text-xs leading-relaxed mb-3 line-clamp-3" style={{ color: "rgba(255,255,255,0.52)" }}>{p.content}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {p.tags?.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{ background: "rgba(236,204,104,0.09)", color: GOLD, border: "1px solid rgba(236,204,104,0.18)" }}>#{t}</span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
                    <motion.button whileTap={{ scale: 0.85 }} onClick={(e) => { e.stopPropagation(); toggleLike(p) }} className="flex items-center gap-1.5">
                      <Heart size={15} color={liked ? "#f87171" : "rgba(255,255,255,0.35)"} fill={liked ? "#f87171" : "none"} />
                      <span className="text-xs" style={{ color: liked ? "#f87171" : "rgba(255,255,255,0.38)" }}>{p.likedBy?.length ?? 0}</span>
                    </motion.button>
                    <button onClick={(e) => { e.stopPropagation(); setOpenPost(p) }} className="flex items-center gap-1.5">
                      <MessageCircle size={15} color="rgba(255,255,255,0.35)" />
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>{p.commentsCount ?? 0}</span>
                    </button>
                    <span className="ml-auto"><Share2 size={15} color="rgba(255,255,255,0.28)" /></span>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>

      {/* FAB — au-dessus de la navbar (z > navbar) et remonté pour rester cliquable */}
      <motion.button whileTap={{ scale: 0.9 }} onClick={() => ensurePseudo(() => setShowCreate(true))}
        className="absolute right-5 rounded-full flex items-center justify-center z-[60]"
        style={{ bottom: 104, width: 56, height: 56, background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DIM})`, boxShadow: "0 6px 24px rgba(236,204,104,0.45)", color: "#050A14" }}>
        <Plus size={24} />
      </motion.button>

      {/* Modal pseudo */}
      <AnimatePresence>
        {needPseudo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl p-6 space-y-4" style={{ background: "#0d1629", border: `1px solid ${BORDER}` }}>
              <div className="text-center space-y-1">
                <p className="text-3xl">🎭</p>
                <h2 className="text-sm font-bold text-white">Ton pseudo communauté</h2>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>Visible par tous · attaché à ton compte</p>
              </div>
              <input value={pseudoInput} onChange={e => setPseudoInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && savePseudo()} placeholder="ex : Sarah Z" maxLength={20} autoFocus
                className="w-full rounded-xl px-4 py-2.5 text-sm text-white text-center outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}` }} />
              <div className="flex gap-2">
                <button onClick={() => setNeedPseudo(false)} className="flex-1 py-2.5 rounded-xl text-xs font-semibold" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)" }}>Annuler</button>
                <button onClick={savePseudo} disabled={pseudoInput.trim().length < 2}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold disabled:opacity-30" style={{ background: GOLD, color: "#050A14" }}>Valider</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal création */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-end justify-center pb-[96px]"
            onClick={() => setShowCreate(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 32 }}
              onClick={e => e.stopPropagation()}
              className="w-full rounded-3xl p-5 space-y-3 max-h-[80%] overflow-y-auto" style={{ background: "#0d1629", border: `1px solid ${BORDER}` }}>
              <div className="flex items-center justify-between sticky top-0 -mx-5 px-5 -mt-5 pt-5 pb-2 z-10" style={{ background: "#0d1629" }}>
                <h2 className="text-sm font-bold text-white">Nouvelle publication</h2>
                <button onClick={() => setShowCreate(false)}><X size={18} color="rgba(255,255,255,0.5)" /></button>
              </div>
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Titre de ta publication" maxLength={120}
                className="w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none" style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}` }} />
              <textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Partage ton expérience, ta question…" maxLength={1500} rows={4}
                className="w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none resize-none" style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}` }} />
              <div className="flex flex-wrap gap-1.5">
                {TAG_OPTIONS.map(t => {
                  const on = newTags.includes(t)
                  return (
                    <button key={t} onClick={() => setNewTags(s => on ? s.filter(x => x !== t) : [...s, t])}
                      className="px-2.5 py-1 rounded-full text-[10px] font-semibold transition"
                      style={{ background: on ? GOLD : "rgba(255,255,255,0.05)", color: on ? "#050A14" : "rgba(255,255,255,0.5)", border: `1px solid ${on ? GOLD : BORDER}` }}>
                      #{t}
                    </button>
                  )
                })}
              </div>
              <button onClick={createPost} disabled={posting || newTitle.trim().length < 2 || newContent.trim().length < 2}
                className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40" style={{ background: GOLD, color: "#050A14" }}>
                {posting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {posting ? "Publication…" : "Publier"}
              </button>
              {(newTitle.trim().length < 2 || newContent.trim().length < 2) && (
                <p className="text-[10px] text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {newTitle.trim().length < 2 ? "Ajoute un titre" : "Ajoute un peu de texte"} pour pouvoir publier
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Détail post + commentaires */}
      <AnimatePresence>
        {openPost && (
          <PostDetail post={openPost} user={user} pseudo={pseudo}
            onClose={() => setOpenPost(null)}
            ensurePseudo={ensurePseudo}
            onLike={() => toggleLike(openPost)} />
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Détail d'un post avec commentaires temps réel ─────────────────────────────
function PostDetail({ post, user, pseudo, onClose, ensurePseudo, onLike }: {
  post: Post; user: any; pseudo: string; onClose: () => void; ensurePseudo: (cb: () => void) => void; onLike: () => void
}) {
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const liked = user ? post.likedBy?.includes(user.uid) : false

  useEffect(() => {
    const q = query(collection(db, "community_posts", post.id, "comments"), orderBy("createdAt", "asc"))
    const unsub = onSnapshot(q, (snap) => setComments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Comment))))
    return unsub
  }, [post.id])

  async function send() {
    if (!user || !pseudo || text.trim().length < 1) return
    const content = text.trim()
    setText(""); setSending(true)
    try {
      await addDoc(collection(db, "community_posts", post.id, "comments"), {
        authorId: user.uid, authorName: pseudo, content, createdAt: serverTimestamp(),
      })
      await updateDoc(doc(db, "community_posts", post.id), { commentsCount: increment(1) })
    } catch (e) { console.error(e) } finally { setSending(false) }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-end pb-[96px]"
      onClick={onClose}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 32 }}
        onClick={e => e.stopPropagation()}
        className="w-full rounded-3xl flex flex-col" style={{ background: "#0d1629", border: `1px solid ${BORDER}`, maxHeight: "78%" }}>
        <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
          <p className="text-sm font-bold text-white">Discussion</p>
          <button onClick={onClose}><X size={18} color="rgba(255,255,255,0.5)" /></button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-3">
          {/* Post */}
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DIM})`, color: "#050A14" }}>
              {post.avatar || initialsOf(post.authorName)}
            </div>
            <div>
              <p className="text-xs font-bold text-white">{post.authorName}</p>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.32)" }}>il y a {timeAgo(post.createdAt)}</p>
            </div>
          </div>
          <p className="text-sm font-bold text-white mb-1.5">{post.title}</p>
          <p className="text-xs leading-relaxed mb-3 whitespace-pre-wrap" style={{ color: "rgba(255,255,255,0.6)" }}>{post.content}</p>
          <div className="flex items-center gap-4 pb-3 mb-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <button onClick={onLike} className="flex items-center gap-1.5">
              <Heart size={15} color={liked ? "#f87171" : "rgba(255,255,255,0.35)"} fill={liked ? "#f87171" : "none"} />
              <span className="text-xs" style={{ color: liked ? "#f87171" : "rgba(255,255,255,0.38)" }}>{post.likedBy?.length ?? 0}</span>
            </button>
            <span className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>
              <MessageCircle size={15} color="rgba(255,255,255,0.35)" /> {comments.length}
            </span>
          </div>

          {/* Commentaires */}
          <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
            Commentaires ({comments.length})
          </p>
          {comments.length === 0 ? (
            <p className="text-center text-[11px] py-6" style={{ color: "rgba(255,255,255,0.35)" }}>Aucun commentaire. Lance la discussion !</p>
          ) : (
            <div className="space-y-2">
              {comments.map(c => {
                const mine = user && c.authorId === user.uid
                return (
                  <div key={c.id} className="rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}` }}>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-bold" style={{ color: mine ? GOLD : "rgba(255,255,255,0.75)" }}>{c.authorName}</span>
                      <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>· {timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.6)" }}>{c.content}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Saisie commentaire */}
        <div className="px-5 py-3 shrink-0 flex gap-2 items-center" style={{ borderTop: `1px solid ${BORDER}` }}>
          <input value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") ensurePseudo(send) }}
            placeholder="Écris un commentaire…" maxLength={400}
            className="flex-1 rounded-2xl px-4 py-2.5 text-xs text-white outline-none" style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}` }} />
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => ensurePseudo(send)} disabled={sending || !text.trim()}
            className="w-10 h-10 rounded-2xl flex items-center justify-center disabled:opacity-30 shrink-0" style={{ background: GOLD, color: "#050A14" }}>
            <Send size={16} />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
=======
      <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-4 flex flex-col gap-3">
        <AnimatePresence>
          {posts.map((p, i) => (
            <motion.div key={p.id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-3xl p-4"
              style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>

              {/* Author */}
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DIM})`, color: "#050A14" }}>
                  {p.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-white">{p.user}</p>
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                      style={{ background: `${badgeColors[p.badge]}22`, color: badgeColors[p.badge] }}>
                      {p.badge}
                    </span>
                  </div>
                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.32)" }}>il y a {p.time}</p>
                </div>
                <TrendingUp size={13} color="rgba(255,255,255,0.2)" />
              </div>

              {/* Content */}
              <p className="text-sm font-bold text-white mb-1.5">{p.title}</p>
              <p className="text-xs leading-relaxed mb-3"
                style={{ color: "rgba(255,255,255,0.52)" }}>{p.preview}</p>

              {/* Tags */}
              <div className="flex gap-1.5 mb-3">
                {p.tags.map(t => (
                  <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                    style={{ background: "rgba(236,204,104,0.09)", color: GOLD, border: "1px solid rgba(236,204,104,0.18)" }}>
                    #{t}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
                <motion.button whileTap={{ scale: 0.85 }}
                  onClick={() => setLikes(l => ({ ...l, [p.id]: !l[p.id] }))}
                  className="flex items-center gap-1.5">
                  <Heart size={15}
                    color={likes[p.id] ? "#f87171" : "rgba(255,255,255,0.35)"}
                    fill={likes[p.id] ? "#f87171" : "none"} />
                  <span className="text-xs" style={{ color: likes[p.id] ? "#f87171" : "rgba(255,255,255,0.38)" }}>
                    {p.likes + (likes[p.id] ? 1 : 0)}
                  </span>
                </motion.button>
                <button className="flex items-center gap-1.5">
                  <MessageCircle size={15} color="rgba(255,255,255,0.35)" />
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>{p.comments}</span>
                </button>
                <button className="ml-auto">
                  <Share2 size={15} color="rgba(255,255,255,0.28)" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        className="absolute bottom-24 right-5 rounded-full flex items-center justify-center"
        style={{
          width: 52, height: 52,
          background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DIM})`,
          boxShadow: "0 6px 24px rgba(236,204,104,0.45)",
          color: "#050A14",
        }}
      >
        <Plus size={22} />
      </motion.button>
    </div>
  )
}
>>>>>>> c2ce98782d34bda170bcf3571c6142480a36998b
