"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, CheckCircle2, ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

type Role = "partner_a" | "partner_b"

type CrackDef = {
  id: string
  label: string
  prompt: string
  d: string
}

type Point = { x: number; y: number }

type SyncPayload = {
  senderId: string
  role: Role
  selectedCrackId: string | null
  cursor: Point | null
  holding: boolean
  progressByCrack: Record<string, number>
  completedByCrack: Record<string, boolean>
}

type KintsugiExperienceProps = {
  sessionId: string
  role: Role
  playerName: string
  partnerName: string
  onBack?: () => void
  onComplete?: () => void
}

const VIEWBOX = { width: 520, height: 460 }
const TARGET_RADIUS = 20
const REPAIR_RATE_PER_SEC = 24

const HEART_PATH =
  "M260 404C248 393 194 360 152 325C96 278 60 225 60 165C60 101 112 56 170 56C211 56 240 75 260 105C280 75 309 56 350 56C408 56 460 101 460 165C460 225 424 278 368 325C326 360 272 393 260 404Z"

const CRACKS: CrackDef[] = [
  {
    id: "long-nights",
    label: "The Long Nights",
    prompt: "What is the hardest night we got through together?",
    d: "M226 132 L214 158 L232 185 L219 214 L238 242 L225 273 L244 305 L232 334",
  },
  {
    id: "missed-dates",
    label: "The Missed Dates",
    prompt: "Which cancelled plan do we promise to recreate?",
    d: "M286 126 L303 154 L285 183 L302 211 L284 242 L300 272 L282 302 L296 330",
  },
  {
    id: "silence",
    label: "The Silence",
    prompt: "How do we handle it when we run out of things to say?",
    d: "M174 214 L203 225 L227 247 L254 260 L281 282 L312 295 L336 318",
  },
]

export default function KintsugiExperience({
  sessionId,
  role,
  playerName,
  partnerName,
  onBack,
  onComplete,
}: KintsugiExperienceProps) {
  const supabase = useMemo(() => createClient(), [])
  const clientId = useMemo(() => crypto.randomUUID(), [])

  const [showIntro, setShowIntro] = useState(true)
  const [selectedCrackId, setSelectedCrackId] = useState<string | null>(null)
  const [progressByCrack, setProgressByCrack] = useState<Record<string, number>>(() =>
    Object.fromEntries(CRACKS.map((c) => [c.id, 0]))
  )
  const [completedByCrack, setCompletedByCrack] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(CRACKS.map((c) => [c.id, false]))
  )

  const [cursorA, setCursorA] = useState<Point | null>(null)
  const [cursorB, setCursorB] = useState<Point | null>(null)
  const [holdingA, setHoldingA] = useState(false)
  const [holdingB, setHoldingB] = useState(false)

  const [flashCrackId, setFlashCrackId] = useState<string | null>(null)

  const svgRef = useRef<SVGSVGElement | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const pathRefs = useRef<Record<string, SVGPathElement | null>>({})
  const lastBroadcastRef = useRef(0)

  const myCursor = role === "partner_a" ? cursorA : cursorB
  const partnerCursor = role === "partner_a" ? cursorB : cursorA
  const myHolding = role === "partner_a" ? holdingA : holdingB
  const partnerHolding = role === "partner_a" ? holdingB : holdingA

  const allComplete = useMemo(
    () => CRACKS.every((c) => completedByCrack[c.id]),
    [completedByCrack]
  )

  const selectedCrack = useMemo(
    () => CRACKS.find((c) => c.id === selectedCrackId) ?? null,
    [selectedCrackId]
  )

  const getPathNode = useCallback((crackId: string | null) => {
    if (!crackId) return null
    return pathRefs.current[crackId] ?? null
  }, [])

  const distance = useCallback((a: Point, b: Point) => {
    const dx = a.x - b.x
    const dy = a.y - b.y
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  const getSvgPoint = useCallback((evt: React.PointerEvent<SVGSVGElement>): Point | null => {
    const svg = svgRef.current
    if (!svg) return null
    const pt = svg.createSVGPoint()
    pt.x = evt.clientX
    pt.y = evt.clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return null
    const local = pt.matrixTransform(ctm.inverse())
    return { x: local.x, y: local.y }
  }, [])

  const broadcastState = useCallback(
    (force = false) => {
      if (!channelRef.current) return

      const now = Date.now()
      if (!force && now - lastBroadcastRef.current < 45) return
      lastBroadcastRef.current = now

      const payload: SyncPayload = {
        senderId: clientId,
        role,
        selectedCrackId,
        cursor: role === "partner_a" ? cursorA : cursorB,
        holding: role === "partner_a" ? holdingA : holdingB,
        progressByCrack,
        completedByCrack,
      }

      void channelRef.current.send({
        type: "broadcast",
        event: "kintsugi_state",
        payload,
      })
    },
    [clientId, role, selectedCrackId, cursorA, cursorB, holdingA, holdingB, progressByCrack, completedByCrack]
  )

  useEffect(() => {
    const channel = supabase
      .channel(`kintsugi-${sessionId}`)
      .on("broadcast", { event: "kintsugi_state" }, ({ payload }) => {
        const state = payload as SyncPayload
        if (!state || state.senderId === clientId) return

        setSelectedCrackId((prev) => state.selectedCrackId ?? prev)

        if (state.role === "partner_a") {
          setCursorA(state.cursor)
          setHoldingA(state.holding)
        } else {
          setCursorB(state.cursor)
          setHoldingB(state.holding)
        }

        setProgressByCrack((prev) => {
          const next = { ...prev }
          for (const crack of CRACKS) {
            next[crack.id] = Math.max(prev[crack.id] ?? 0, state.progressByCrack[crack.id] ?? 0)
          }
          return next
        })

        setCompletedByCrack((prev) => {
          const next = { ...prev }
          for (const crack of CRACKS) {
            next[crack.id] = Boolean(prev[crack.id] || state.completedByCrack[crack.id])
          }
          return next
        })
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      channelRef.current = null
      void supabase.removeChannel(channel)
    }
  }, [sessionId, supabase, clientId])

  useEffect(() => {
    broadcastState()
  }, [broadcastState])

  useEffect(() => {
    let rafId = 0
    let last = performance.now()

    const step = (ts: number) => {
      const dt = (ts - last) / 1000
      last = ts

      if (selectedCrackId && !completedByCrack[selectedCrackId]) {
        const path = getPathNode(selectedCrackId)
        if (path && myCursor && partnerCursor && myHolding && partnerHolding) {
          const totalLen = path.getTotalLength()
          const currentProgress = progressByCrack[selectedCrackId] ?? 0
          const targetLen = (currentProgress / 100) * totalLen
          const target = path.getPointAtLength(targetLen)
          const targetPoint = { x: target.x, y: target.y }

          const bothNear =
            distance(myCursor, targetPoint) <= TARGET_RADIUS &&
            distance(partnerCursor, targetPoint) <= TARGET_RADIUS

          if (bothNear) {
            const increment = REPAIR_RATE_PER_SEC * dt
            const nextProgress = Math.min(100, currentProgress + increment)

            setProgressByCrack((prev) => ({
              ...prev,
              [selectedCrackId]: nextProgress,
            }))

            if (nextProgress >= 100 && !completedByCrack[selectedCrackId]) {
              setCompletedByCrack((prev) => ({
                ...prev,
                [selectedCrackId]: true,
              }))
              setFlashCrackId(selectedCrackId)
              setTimeout(() => setFlashCrackId((cur) => (cur === selectedCrackId ? null : cur)), 600)
            }
          }
        }
      }

      rafId = requestAnimationFrame(step)
    }

    rafId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId)
  }, [
    selectedCrackId,
    completedByCrack,
    getPathNode,
    myCursor,
    partnerCursor,
    myHolding,
    partnerHolding,
    progressByCrack,
    distance,
  ])

  const setMyCursor = useCallback(
    (point: Point | null) => {
      if (role === "partner_a") setCursorA(point)
      else setCursorB(point)
    },
    [role]
  )

  const setMyHolding = useCallback(
    (holding: boolean) => {
      if (role === "partner_a") setHoldingA(holding)
      else setHoldingB(holding)
    },
    [role]
  )

  const selectCrack = useCallback((crackId: string) => {
    setSelectedCrackId(crackId)
  }, [])

  const onSvgPointerMove = useCallback(
    (evt: React.PointerEvent<SVGSVGElement>) => {
      const p = getSvgPoint(evt)
      if (!p) return
      setMyCursor(p)
    },
    [getSvgPoint, setMyCursor]
  )

  const onSvgPointerUp = useCallback(() => {
    setMyHolding(false)
  }, [setMyHolding])

  const onSvgPointerLeave = useCallback(() => {
    setMyHolding(false)
    setMyCursor(null)
  }, [setMyHolding, setMyCursor])

  const onSvgPointerDown = useCallback(
    (evt: React.PointerEvent<SVGSVGElement>) => {
      if (!selectedCrackId) return
      const p = getSvgPoint(evt)
      if (!p) return

      const path = getPathNode(selectedCrackId)
      if (!path) return

      const start = path.getPointAtLength(0)
      const startPoint = { x: start.x, y: start.y }

      if (distance(p, startPoint) <= TARGET_RADIUS) {
        setMyHolding(true)
      } else {
        setMyHolding(false)
      }
    },
    [selectedCrackId, getSvgPoint, getPathNode, distance, setMyHolding]
  )

  const targetPoint = useMemo(() => {
    if (!selectedCrackId) return null
    const path = getPathNode(selectedCrackId)
    if (!path) return null
    const progress = progressByCrack[selectedCrackId] ?? 0
    const len = path.getTotalLength() * (progress / 100)
    const point = path.getPointAtLength(len)
    return { x: point.x, y: point.y }
  }, [selectedCrackId, progressByCrack, getPathNode])

  const themeClass = allComplete
    ? "from-amber-100 via-orange-100 to-rose-100"
    : "from-slate-950 via-zinc-900 to-neutral-950"

  return (
    <div className={`relative min-h-dvh overflow-hidden bg-gradient-to-br ${themeClass}`}>
      <div className="pointer-events-none absolute inset-0 opacity-30" style={{
        backgroundImage:
          "radial-gradient(circle at 20% 10%, rgba(255,255,255,0.16), transparent 38%), radial-gradient(circle at 85% 15%, rgba(255,255,255,0.1), transparent 30%), repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 8px)",
      }} />

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 pt-16 pb-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="rounded-md border border-white/20 bg-black/20 px-2.5 py-1.5 text-xs text-white/90 hover:bg-black/30"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <h2 className={`font-serif text-2xl ${allComplete ? "text-amber-900" : "text-white"}`}>
              The Golden Repair
            </h2>
          </div>
          <div className={`text-xs ${allComplete ? "text-amber-900/80" : "text-white/80"}`}>
            {playerName} + {partnerName}
          </div>
        </div>

        <div className="grid flex-1 gap-4 lg:grid-cols-[280px_1fr]">
          <aside className={`rounded-xl border p-4 ${allComplete ? "border-amber-300/60 bg-white/60" : "border-white/15 bg-black/25"}`}>
            <p className={`mb-3 text-xs uppercase tracking-[0.2em] ${allComplete ? "text-amber-900/70" : "text-amber-200/80"}`}>
              Cracks
            </p>
            <div className="space-y-2">
              {CRACKS.map((crack) => {
                const progress = Math.round(progressByCrack[crack.id] ?? 0)
                const active = selectedCrackId === crack.id
                const done = completedByCrack[crack.id]

                return (
                  <button
                    key={crack.id}
                    onClick={() => selectCrack(crack.id)}
                    className={`w-full rounded-lg border px-3 py-2 text-left transition ${active ? "border-amber-300 bg-amber-100/15" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${allComplete ? "text-amber-950" : "text-white"}`}>{crack.label}</span>
                      {done && <CheckCircle2 className="h-4 w-4 text-amber-400" />}
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-black/25">
                      <motion.div
                        className="h-full rounded-full bg-amber-300"
                        animate={{ width: `${progress}%` }}
                        transition={{ type: "spring", stiffness: 140, damping: 20 }}
                      />
                    </div>
                  </button>
                )
              })}
            </div>

            {selectedCrack && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 rounded-lg border p-3 ${allComplete ? "border-amber-300/70 bg-white/70" : "border-amber-300/40 bg-amber-100/10"}`}
              >
                <p className={`mb-1 text-xs uppercase tracking-wide ${allComplete ? "text-amber-900/70" : "text-amber-200/80"}`}>
                  Discuss While Repairing
                </p>
                <p className={`text-sm leading-relaxed ${allComplete ? "text-amber-950" : "text-amber-100"}`}>
                  {selectedCrack.prompt}
                </p>
              </motion.div>
            )}

            {allComplete && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-lg border border-amber-300/70 bg-white/70 p-3 text-center"
              >
                <p className="font-serif text-lg text-amber-900">Beautifully Broken, Perfectly Whole.</p>
                {onComplete && (
                  <button
                    onClick={onComplete}
                    className="mt-3 rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-amber-950"
                  >
                    Continue
                  </button>
                )}
              </motion.div>
            )}
          </aside>

          <section className={`relative rounded-xl border ${allComplete ? "border-amber-300/70 bg-white/55" : "border-white/15 bg-black/20"}`}>
            <svg
              ref={svgRef}
              viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
              className="h-full w-full"
              onPointerMove={onSvgPointerMove}
              onPointerDown={onSvgPointerDown}
              onPointerUp={onSvgPointerUp}
              onPointerCancel={onSvgPointerUp}
              onPointerLeave={onSvgPointerLeave}
            >
              <defs>
                <linearGradient id="ceramicFill" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f8f4ea" />
                  <stop offset="100%" stopColor="#ece4d5" />
                </linearGradient>
                <linearGradient id="goldFill" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fff4b3" />
                  <stop offset="45%" stopColor="#ffd700" />
                  <stop offset="100%" stopColor="#c89b00" />
                </linearGradient>
                <filter id="goldGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#ffd700" floodOpacity="0.8" />
                </filter>
              </defs>

              <motion.path
                d={HEART_PATH}
                fill="url(#ceramicFill)"
                stroke={allComplete ? "#f59e0b" : "#d6cbb6"}
                strokeWidth="3"
                animate={allComplete ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                transition={allComplete ? { repeat: Infinity, duration: 3.2 } : { duration: 0.2 }}
                style={{ transformOrigin: "260px 220px" }}
              />

              {CRACKS.map((crack) => {
                const progress = Math.max(0, Math.min(100, progressByCrack[crack.id] ?? 0))
                const completed = completedByCrack[crack.id]
                const isActive = selectedCrackId === crack.id
                const flash = flashCrackId === crack.id

                return (
                  <g key={crack.id}>
                    <path
                      ref={(node) => {
                        pathRefs.current[crack.id] = node
                      }}
                      d={crack.d}
                      fill="none"
                      stroke={isActive ? "#161616" : "#2a2a2a"}
                      strokeWidth={6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={0.9}
                      onPointerDown={(evt) => {
                        evt.stopPropagation()
                        selectCrack(crack.id)
                      }}
                      className="cursor-pointer"
                    />

                    <motion.path
                      d={crack.d}
                      fill="none"
                      stroke="url(#goldFill)"
                      strokeWidth={completed ? 8 : 7}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#goldGlow)"
                      pathLength={1}
                      initial={false}
                      animate={{
                        pathLength: progress / 100,
                        opacity: completed ? [1, 1, 1] : 1,
                        strokeWidth: flash ? [7, 11, 8] : completed ? 8 : 7,
                      }}
                      transition={{
                        pathLength: { type: "spring", stiffness: 120, damping: 20 },
                        strokeWidth: { duration: 0.55 },
                      }}
                    />
                  </g>
                )
              })}

              {targetPoint && selectedCrackId && !completedByCrack[selectedCrackId] && (
                <>
                  <circle cx={targetPoint.x} cy={targetPoint.y} r={10} fill="#ffd700" opacity={0.3} />
                  <circle cx={targetPoint.x} cy={targetPoint.y} r={5} fill="#ffd700" opacity={0.8} />
                </>
              )}

              {myCursor && (
                <g>
                  <circle cx={myCursor.x} cy={myCursor.y} r={8} fill="#60a5fa" opacity={0.35} />
                  <circle cx={myCursor.x} cy={myCursor.y} r={3} fill="#93c5fd" />
                </g>
              )}

              {partnerCursor && (
                <g>
                  <circle cx={partnerCursor.x} cy={partnerCursor.y} r={8} fill="#f472b6" opacity={0.35} />
                  <circle cx={partnerCursor.x} cy={partnerCursor.y} r={3} fill="#fbcfe8" />
                </g>
              )}
            </svg>

            <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-black/35 px-2 py-1 text-xs text-white/90">
              Hold on crack start together, then trace in sync.
            </div>
            <div className="pointer-events-none absolute bottom-3 right-3 rounded-md bg-black/35 px-2 py-1 text-xs text-white/90">
              You: {myHolding ? "Holding" : "Not holding"} | Partner: {partnerHolding ? "Holding" : "Not holding"}
            </div>
          </section>
        </div>
      </div>

      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4"
          >
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 12, opacity: 0, scale: 0.98 }}
              className="w-full max-w-2xl rounded-2xl border border-amber-200/40 bg-[rgba(248,244,234,0.92)] p-6 shadow-2xl"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 15% 15%, rgba(255,255,255,0.45), transparent 40%), repeating-linear-gradient(0deg, rgba(120,90,40,0.05) 0, rgba(120,90,40,0.05) 1px, transparent 1px, transparent 7px)",
              }}
            >
              <div className="mb-3 flex items-center gap-2 text-amber-700">
                <Sparkles className="h-5 w-5" />
                <h3 className="font-serif text-3xl text-amber-900">The Golden Repair</h3>
              </div>

              <p className="mb-4 text-sm leading-relaxed text-amber-950/90">
                In Japan, broken objects are repaired with gold. The cracks are not hidden; they are honored as part
                of the history. Distance is our crack, but our effort to stay connected is the gold that makes us
                stronger.
              </p>

              <ol className="list-decimal space-y-2 pl-5 text-sm text-amber-950/90">
                <li>
                  <span className="font-medium">Select a Scar:</span> Click on a crack that represents a challenge
                  we&apos;ve faced.
                </li>
                <li>
                  <span className="font-medium">Trace Together:</span> Both partners click and hold at the crack
                  start.
                </li>
                <li>
                  <span className="font-medium">Heal:</span> Move in sync along the line. Too fast or too far apart,
                  and the gold stops.
                </li>
                <li>
                  <span className="font-medium">Discuss:</span> While repairing, answer the question on the side.
                </li>
              </ol>

              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => setShowIntro(false)}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-amber-950 hover:bg-amber-400"
                >
                  Begin the Repair
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
