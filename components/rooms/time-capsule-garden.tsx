"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Flower2, ArrowLeft, Send, Eye, EyeOff, SkipForward } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

type Capsule = {
  id: string
  author_name: string
  content: string
  capsule_type: string
  unlocked: boolean
  created_at: string
}

type CapsuleRow = {
  id: string
  author_name?: string | null
  author?: string | null
  content?: string | null
  message?: string | null
  capsule_type?: string | null
  unlocked?: boolean | null
  sealed?: boolean | null
  created_at: string
}

type CapsuleGardenProps = {
  sessionId: string
  playerName: string
  partnerName: string
  onComplete: () => void
  onBack: () => void
}

const CAPSULE_TYPES = [
  { id: "love-letter", label: "Love Letter", prompt: "Write a love letter to your partner..." },
  { id: "future-wish", label: "Future Wish", prompt: "What do you wish for your future together?" },
  { id: "secret", label: "A Secret", prompt: "Share something you have never told them..." },
]

const FLOWER_COLORS = [
  "hsl(350, 65%, 65%)",
  "hsl(30, 70%, 55%)",
  "hsl(280, 60%, 65%)",
  "hsl(160, 60%, 50%)",
  "hsl(210, 70%, 60%)",
]

function FlowerSVG({ color, size = 40 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size * 1.5} viewBox="0 0 40 60" fill="none" aria-hidden="true">
      {/* Stem */}
      <path d="M20 60 L20 30" stroke="hsl(140, 40%, 40%)" strokeWidth="2" />
      <path d="M20 45 Q12 40 10 35" stroke="hsl(140, 40%, 40%)" strokeWidth="1.5" fill="none" />
      {/* Petals */}
      <circle cx="20" cy="22" r="5" fill={color} opacity="0.8" />
      <circle cx="14" cy="18" r="5" fill={color} opacity="0.7" />
      <circle cx="26" cy="18" r="5" fill={color} opacity="0.7" />
      <circle cx="16" cy="26" r="5" fill={color} opacity="0.6" />
      <circle cx="24" cy="26" r="5" fill={color} opacity="0.6" />
      {/* Center */}
      <circle cx="20" cy="22" r="3" fill="hsl(45, 80%, 65%)" />
    </svg>
  )
}

export function TimeCapsuleGarden({ sessionId, playerName, partnerName, onComplete, onBack }: CapsuleGardenProps) {
  const [capsules, setCapsules] = useState<Capsule[]>([])
  const [writing, setWriting] = useState(false)
  const [selectedType, setSelectedType] = useState(CAPSULE_TYPES[0])
  const [content, setContent] = useState("")
  const [viewingCapsule, setViewingCapsule] = useState<Capsule | null>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  const normalizeCapsule = useCallback((row: CapsuleRow): Capsule => {
    const authorName = row.author_name ?? row.author ?? "Unknown"
    const body = row.content ?? row.message ?? ""
    const isUnlocked =
      typeof row.unlocked === "boolean"
        ? row.unlocked
        : typeof row.sealed === "boolean"
        ? !row.sealed
        : false

    return {
      id: row.id,
      author_name: authorName,
      content: body,
      capsule_type: row.capsule_type ?? "love-letter",
      unlocked: isUnlocked,
      created_at: row.created_at,
    }
  }, [])

  const syncCapsules = useCallback(async () => {
    const { data } = await supabase
      .from("capsules")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })

    if (data) {
      const normalized = (data as CapsuleRow[]).map(normalizeCapsule)
      setCapsules(normalized)
    }
  }, [sessionId, supabase, normalizeCapsule])

  useEffect(() => {
    let channel: RealtimeChannel

    void syncCapsules()

    channel = supabase
      .channel(`capsules-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "capsules", filter: `session_id=eq.${sessionId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newCap = normalizeCapsule(payload.new as CapsuleRow)
            setCapsules((prev) => {
              if (prev.find((c) => c.id === newCap.id)) return prev
              return [...prev, newCap]
            })
          } else if (payload.eventType === "UPDATE") {
            const updated = normalizeCapsule(payload.new as CapsuleRow)
            setCapsules((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId, supabase, normalizeCapsule, syncCapsules])

  // Fallback sync for environments where Realtime is not configured.
  useEffect(() => {
    const interval = setInterval(() => {
      void syncCapsules()
    }, 1500)

    return () => clearInterval(interval)
  }, [syncCapsules])

  const plantCapsule = async () => {
    if (!content.trim()) return
    setError(null)
    const text = content.trim()

    const primaryInsert = await supabase
      .from("capsules")
      .insert({
        session_id: sessionId,
        author_name: playerName,
        content: text,
        capsule_type: selectedType.id,
      })
      .select()
      .single()

    if (primaryInsert.error || !primaryInsert.data) {
      const fallbackInsert = await supabase
        .from("capsules")
        .insert({
          session_id: sessionId,
          author: playerName,
          message: text,
          unlock_date: new Date().toISOString().slice(0, 10),
          sealed: true,
        })
        .select()
        .single()

      if (fallbackInsert.error || !fallbackInsert.data) {
        setError("Failed to plant capsule.")
        return
      }
    }

    void syncCapsules()
    setContent("")
    setWriting(false)
  }

  const unlockCapsule = async (capsule: Capsule) => {
    if (capsule.unlocked) {
      setViewingCapsule(capsule)
      return
    }
    // Only partner can unlock
    if (capsule.author_name === playerName) return
    setError(null)
    const primaryUpdate = await supabase.from("capsules").update({ unlocked: true }).eq("id", capsule.id)
    if (primaryUpdate.error) {
      const fallbackUpdate = await supabase.from("capsules").update({ sealed: false }).eq("id", capsule.id)
      if (fallbackUpdate.error) {
        setError("Failed to unlock capsule.")
        return
      }
    }

    void syncCapsules()
    setViewingCapsule({ ...capsule, unlocked: true })
  }

  const myCapsules = capsules.filter((c) => c.author_name === playerName)
  const partnerCapsules = capsules.filter((c) => c.author_name === partnerName)
  const bothPlanted = myCapsules.length >= 1 && partnerCapsules.length >= 1
  const allUnlocked = capsules.length >= 2 && capsules.every((c) => c.unlocked)

  return (
    <div className="relative z-10 flex flex-col min-h-dvh pt-14">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Flower2 className="w-5 h-5 text-green-400" />
          <h2 className="font-serif text-xl text-foreground">Time Capsule Garden</h2>
        </div>
      </div>
      {error && (
        <div className="px-4 py-2 text-sm text-destructive border-b border-border/50">
          {error}
        </div>
      )}

      {/* Garden */}
      <div className="flex-1 px-4 py-6">
        {/* Planted capsules */}
        {capsules.length > 0 && (
          <div className="mb-8">
            <p className="text-sm text-muted-foreground mb-4">Your garden is growing...</p>
            <div className="flex flex-wrap gap-6 justify-center">
              {capsules.map((capsule, i) => {
                const isMine = capsule.author_name === playerName
                const canUnlock = !isMine && !capsule.unlocked
                const color = FLOWER_COLORS[i % FLOWER_COLORS.length]

                return (
                  <motion.button
                    key={capsule.id}
                    initial={{ scale: 0, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: "spring", delay: i * 0.2 }}
                    onClick={() => unlockCapsule(capsule)}
                    className="flex flex-col items-center gap-1 group"
                    disabled={isMine && !capsule.unlocked}
                  >
                    <motion.div
                      animate={capsule.unlocked ? {} : { y: [0, -3, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <FlowerSVG color={color} size={capsule.unlocked ? 50 : 35} />
                    </motion.div>
                    <span className="text-xs text-muted-foreground">{capsule.author_name}</span>
                    {capsule.unlocked ? (
                      <Eye className="w-3 h-3 text-green-400" />
                    ) : canUnlock ? (
                      <span className="text-xs text-accent">Tap to open</span>
                    ) : (
                      <EyeOff className="w-3 h-3 text-muted-foreground/50" />
                    )}
                  </motion.button>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {capsules.length === 0 && !writing && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Flower2 className="w-16 h-16 text-green-400/30 mb-4" />
            <p className="font-serif text-xl text-foreground/60 mb-2">
              The garden is empty
            </p>
            <p className="text-muted-foreground text-sm max-w-xs">
              Plant a time capsule with a heartfelt letter, wish, or secret. Your partner will grow and open it.
            </p>
          </div>
        )}

        {/* Writing form */}
        <AnimatePresence>
          {writing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-card border border-border rounded-xl p-5 max-w-md mx-auto"
            >
              <h3 className="font-serif text-lg text-foreground mb-3">Plant a capsule</h3>

              <div className="flex gap-2 mb-4">
                {CAPSULE_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      selectedType.id === type.id
                        ? "bg-green-400/20 border-green-400/50 text-green-400"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={selectedType.prompt}
                className="w-full h-32 px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-green-400/50 resize-none text-sm"
                maxLength={1000}
              />

              <div className="flex gap-2 mt-3">
                <button
                  onClick={plantCapsule}
                  disabled={!content.trim()}
                  className="flex-1 py-2.5 rounded-lg bg-green-400/20 text-green-400 font-medium text-sm border border-green-400/30 hover:bg-green-400/30 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Flower2 className="w-4 h-4" />
                  Plant it
                </button>
                <button
                  onClick={() => setWriting(false)}
                  className="px-4 py-2.5 rounded-lg text-muted-foreground text-sm hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Viewing capsule modal */}
      <AnimatePresence>
        {viewingCapsule && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4"
            onClick={() => setViewingCapsule(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-xl p-6 max-w-sm w-full"
            >
              <div className="flex items-center gap-2 mb-3">
                <Flower2 className="w-5 h-5 text-green-400" />
                <span className="text-sm text-muted-foreground">
                  From {viewingCapsule.author_name}
                </span>
              </div>
              <p className="font-serif text-lg text-foreground leading-relaxed whitespace-pre-wrap">
                {viewingCapsule.content}
              </p>
              <button
                onClick={() => setViewingCapsule(null)}
                className="mt-4 w-full py-2 rounded-lg bg-secondary text-secondary-foreground text-sm"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom actions */}
      <div className="border-t border-border bg-background/80 backdrop-blur-sm px-4 py-3">
        {allUnlocked && capsules.length >= 2 ? (
          <div className="flex gap-2">
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={onComplete}
              className="flex-1 py-3 rounded-lg bg-green-400/20 text-green-400 font-medium border border-green-400/30 hover:bg-green-400/30 transition-colors"
            >
              Done
            </motion.button>
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={onComplete}
              className="flex-1 py-3 rounded-lg bg-white/20 text-white font-medium border border-white/20 hover:bg-white/30 transition-colors flex items-center justify-center gap-2"
              title="Skip this room"
            >
              <SkipForward className="w-4 h-4" />
              Skip
            </motion.button>
          </div>
        ) : !writing ? (
          <button
            onClick={() => setWriting(true)}
            className="w-full py-3 rounded-lg bg-secondary text-secondary-foreground font-medium border border-green-400/20 hover:border-green-400/40 transition-colors flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {myCapsules.length === 0 ? "Write your first capsule" : "Plant another capsule"}
          </button>
        ) : null}
      </div>
    </div>
  )
}
