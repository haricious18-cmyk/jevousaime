"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Stars, ArrowLeft, Tag, Download } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

type Star = {
  id: string
  placed_by: string
  x: number
  y: number
  label: string | null
  created_at: string
}

type ConstellationProps = {
  sessionId: string
  playerName: string
  partnerName: string
  onComplete: () => void
  onBack: () => void
}

const REQUIRED_STARS = 5

export function ConstellationCanvas({ sessionId, playerName, partnerName, onComplete, onBack }: ConstellationProps) {
  const [stars, setStars] = useState<Star[]>([])
  const [labeling, setLabeling] = useState<string | null>(null)
  const [labelInput, setLabelInput] = useState("")
  const [constellationName, setConstellationName] = useState("")
  const [showNaming, setShowNaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasDownloaded, setHasDownloaded] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const supabase = useMemo(() => createClient(), [])

  const syncStars = useCallback(async () => {
    const { data } = await supabase
      .from("stars")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })

    if (data) {
      setStars(data as Star[])
    }
  }, [sessionId, supabase])

  useEffect(() => {
    let channel: RealtimeChannel

    void syncStars()

    channel = supabase
      .channel(`stars-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "stars", filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const newStar = payload.new as Star
          setStars((prev) => {
            if (prev.find((s) => s.id === newStar.id)) return prev
            return [...prev, newStar]
          })
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "stars", filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const updated = payload.new as Star
          setStars((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId, supabase, syncStars])

  // Fallback sync when Realtime is unavailable.
  useEffect(() => {
    const interval = setInterval(() => {
      void syncStars()
    }, 1500)

    return () => clearInterval(interval)
  }, [syncStars])

  const handleCanvasClick = useCallback(
    async (e: React.MouseEvent<HTMLDivElement>) => {
      if (labeling || showNaming) return
      setError(null)
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100

      const { error: insertError } = await supabase.from("stars").insert({
        session_id: sessionId,
        placed_by: playerName,
        x,
        y,
      })
      if (insertError) {
        setError("Failed to place star.")
      } else {
        void syncStars()
      }
    },
    [labeling, showNaming, sessionId, playerName, supabase, syncStars]
  )

  const handleLabel = async () => {
    if (!labeling || !labelInput.trim()) return
    setError(null)
    const { error: updateError } = await supabase
      .from("stars")
      .update({ label: labelInput.trim() })
      .eq("id", labeling)
    if (updateError) {
      setError("Failed to save star label.")
      return
    }
    setLabeling(null)
    setLabelInput("")
    void syncStars()
  }

  const myStars = stars.filter((s) => s.placed_by === playerName).length
  const partnerStars = stars.filter((s) => s.placed_by === partnerName).length
  const isComplete = myStars >= REQUIRED_STARS && partnerStars >= REQUIRED_STARS

  // Draw lines between consecutive stars
  const sortedStars = [...stars].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const downloadConstellation = useCallback(() => {
    if (sortedStars.length === 0) return

    const width = 1600
    const height = 900
    const title = (constellationName.trim() || "Our Constellation").replace(/[<>]/g, "")

    const lines = sortedStars
      .map((star, i) => {
        if (i === 0) return ""
        const prev = sortedStars[i - 1]
        return `<line x1="${(prev.x / 100) * width}" y1="${(prev.y / 100) * height}" x2="${(star.x / 100) * width}" y2="${(star.y / 100) * height}" stroke="rgba(251,191,36,0.45)" stroke-width="2"/>`
      })
      .join("")

    const points = sortedStars
      .map((star) => {
        const x = (star.x / 100) * width
        const y = (star.y / 100) * height
        const isMine = star.placed_by === playerName
        const color = isMine ? "#fb7185" : "#fbbf24"
        const safeLabel = (star.label || "").replace(/[<>]/g, "")
        return `
          <circle cx="${x}" cy="${y}" r="5" fill="${color}" />
          <circle cx="${x}" cy="${y}" r="10" fill="${color}" opacity="0.25" />
          ${safeLabel ? `<text x="${x}" y="${y + 24}" fill="#e2e8f0" font-size="18" text-anchor="middle" font-family="Inter, sans-serif">${safeLabel}</text>` : ""}
        `
      })
      .join("")

    const stamp = new Date().toLocaleString()
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#020617"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#000000"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#sky)" />
  <text x="48" y="64" fill="#f8fafc" font-size="42" font-family="Georgia, serif">${title}</text>
  <text x="48" y="102" fill="#94a3b8" font-size="20" font-family="Inter, sans-serif">${stamp}</text>
  ${lines}
  ${points}
</svg>`

    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${title.toLowerCase().replace(/\s+/g, "-")}-constellation.svg`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    setHasDownloaded(true)
  }, [sortedStars, constellationName, playerName])

  return (
    <div className="relative z-10 flex flex-col min-h-dvh pt-14 bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/60 bg-slate-950/70 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-slate-300 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Stars className="w-5 h-5 text-accent" />
          <h2 className="font-serif text-xl text-slate-100">Constellation Canvas</h2>
        </div>
        <div className="flex items-center gap-3">
          {sortedStars.length > 0 && (
            <button
              onClick={downloadConstellation}
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-slate-600 text-slate-200 hover:text-white hover:border-slate-400 transition-colors"
              title="Download constellation image"
            >
              <Download className="w-3.5 h-3.5" />
              Save image
            </button>
          )}
          {hasDownloaded && (
            <button
              onClick={onComplete}
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
              title="Go to next room"
            >
              Done
            </button>
          )}
          <div className="text-xs text-slate-300">
            You: {myStars} stars | {partnerName}: {partnerStars} stars
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="px-4 py-2 text-center text-sm text-slate-300 border-b border-slate-700/40">
        Tap the sky to place stars. Each of you needs {REQUIRED_STARS}. Tap a star to name it.
      </div>
      {error && (
        <div className="px-4 py-2 text-sm text-rose-300 border-b border-slate-700/40">
          {error}
        </div>
      )}

      {/* Canvas */}
      <div
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="flex-1 relative cursor-crosshair overflow-hidden"
        style={{ minHeight: "60vh" }}
        role="application"
        aria-label="Night sky canvas for placing stars"
      >
        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
          {sortedStars.map((star, i) => {
            if (i === 0) return null
            const prev = sortedStars[i - 1]
            return (
              <line
                key={`line-${star.id}`}
                x1={`${prev.x}%`}
                y1={`${prev.y}%`}
                x2={`${star.x}%`}
                y2={`${star.y}%`}
                stroke="hsl(30, 70%, 55%)"
                strokeWidth="0.5"
                strokeOpacity="0.3"
              />
            )
          })}
        </svg>

        {/* Stars */}
        <AnimatePresence>
          {stars.map((star) => {
            const isMine = star.placed_by === playerName
            return (
              <motion.button
                key={star.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute -translate-x-1/2 -translate-y-1/2 group"
                style={{ left: `${star.x}%`, top: `${star.y}%` }}
                onClick={(e) => {
                  e.stopPropagation()
                  if (!star.label) {
                    setLabeling(star.id)
                    setLabelInput("")
                  }
                }}
                title={star.label || `Star by ${star.placed_by}`}
              >
                <div
                  className={`w-3 h-3 rounded-full animate-twinkle ${
                    isMine ? "bg-primary" : "bg-accent"
                  }`}
                  style={{
                    boxShadow: `0 0 8px ${isMine ? "hsl(350, 65%, 65%)" : "hsl(30, 70%, 55%)"}`,
                    animationDelay: `${Math.random() * 3}s`,
                  }}
                />
                {star.label && (
                  <span className="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-slate-200/90 whitespace-nowrap pointer-events-none">
                    {star.label}
                  </span>
                )}
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Label dialog */}
      <AnimatePresence>
        {labeling && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 border-t border-slate-700 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-accent" />
              <span className="text-sm text-slate-100">Name this star</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLabel()}
                placeholder="A name, memory, or feeling..."
                className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-accent/50 text-sm"
                maxLength={30}
                autoFocus
              />
              <button
                onClick={handleLabel}
                disabled={!labelInput.trim()}
                className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => setLabeling(null)}
                className="px-3 py-2 rounded-lg text-slate-300 text-sm hover:text-white"
              >
                Skip
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Complete button */}
      {isComplete && !labeling && (
        <div className="border-t border-slate-700 bg-slate-950/80 backdrop-blur-sm px-4 py-3">
          {!showNaming ? (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setShowNaming(true)}
              className="w-full py-3 rounded-lg bg-accent/20 text-amber-200 font-medium border border-accent/30"
            >
              Name your constellation
            </motion.button>
          ) : (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={constellationName}
                onChange={(e) => setConstellationName(e.target.value)}
                placeholder="What do you call this constellation?"
                className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-accent/50 font-serif text-lg"
                maxLength={40}
                autoFocus
              />
              <button
                onClick={onComplete}
                disabled={!constellationName.trim()}
                className="w-full py-3 rounded-lg bg-accent text-accent-foreground font-medium box-glow-amber disabled:opacity-50"
              >
                Seal this sky
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
