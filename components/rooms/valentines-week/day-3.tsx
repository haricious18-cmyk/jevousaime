"use client"

import { useCallback, useRef, type MutableRefObject, type PointerEvent } from "react"
import { motion } from "framer-motion"
import type { Day3Data, Role } from "@/components/rooms/valentines-week/types"

type Day3Props = {
  role: Role
  playerName: string
  partnerName: string
  day3: Day3Data
  setDay3: (d: Day3Data) => void
  saveDay3: (d: Day3Data) => Promise<void>
  teddyPathRef: MutableRefObject<SVGPathElement | null>
  paused: boolean
}

export function Day3View({ role, playerName, partnerName, day3, setDay3, saveDay3, teddyPathRef, paused }: Day3Props) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const isA = role === "partner_a"

  const toLocal = (e: PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg) return null
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return null
    const p = pt.matrixTransform(ctm.inverse())
    return { x: p.x, y: p.y }
  }

  const updateState = useCallback(
    async (patch: Partial<Day3Data>) => {
      const next = { ...day3, ...patch }
      setDay3(next)
      await saveDay3(next)
    },
    [day3, saveDay3, setDay3]
  )

  const handlePointer = useCallback(
    async (p: { x: number; y: number } | null, holding?: boolean) => {
      const patch: Partial<Day3Data> = {}
      if (p) {
        if (isA) patch.cursorA = p
        else patch.cursorB = p
      } else {
        if (isA) patch.cursorA = null
        else patch.cursorB = null
      }
      if (holding !== undefined) {
        if (isA) patch.holdingA = holding
        else patch.holdingB = holding
      }

      const path = teddyPathRef.current
      const myCursor = isA ? (patch.cursorA ?? day3.cursorA) : (patch.cursorB ?? day3.cursorB)
      const partnerCursor = isA ? day3.cursorB : day3.cursorA
      const myHold = isA ? (patch.holdingA ?? day3.holdingA) : (patch.holdingB ?? day3.holdingB)
      const partnerHold = isA ? day3.holdingB : day3.holdingA

      if (path && myCursor && partnerCursor && myHold && partnerHold && day3.progress < 100) {
        const len = path.getTotalLength()
        const targetLen = (day3.progress / 100) * len
        const target = path.getPointAtLength(targetLen)
        const d1 = Math.hypot(myCursor.x - target.x, myCursor.y - target.y)
        const d2 = Math.hypot(partnerCursor.x - target.x, partnerCursor.y - target.y)
        if (d1 <= 20 && d2 <= 20) {
          patch.progress = Math.min(100, day3.progress + 1.2)
        }
      }

      await updateState(patch)
    },
    [day3, isA, teddyPathRef, updateState]
  )

  const myCursor = isA ? day3.cursorA : day3.cursorB
  const partnerCursor = isA ? day3.cursorB : day3.cursorA
  const myHolding = isA ? day3.holdingA : day3.holdingB

  return (
    <div className="relative z-10 min-h-dvh px-4 py-16">
      <div className="mx-auto max-w-5xl rounded-2xl border border-border bg-card/80 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-3xl text-foreground">Day 3: Teddy Day (Feb 10)</h2>
          <p className="text-sm text-muted-foreground">
            {playerName} & {partnerName}
          </p>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Stitch progress</span>
          <span>{Math.round(day3.progress)}%</span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <motion.div className="h-full bg-amber-400" animate={{ width: `${day3.progress}%` }} />
        </div>

        <svg
          ref={svgRef}
          viewBox="0 0 420 320"
          className="w-full rounded-xl border border-border bg-amber-50"
          onPointerMove={(e) => {
            if (paused) return
            const p = toLocal(e)
            if (p) void handlePointer(p)
          }}
          onPointerLeave={() => void handlePointer(null, false)}
          onPointerUp={() => void handlePointer(null, false)}
          onPointerDown={(e) => {
            if (paused) return
            const p = toLocal(e)
            if (!p || !teddyPathRef.current) return
            const start = teddyPathRef.current.getPointAtLength(0)
            if (Math.hypot(p.x - start.x, p.y - start.y) <= 20) {
              void handlePointer(p, true)
            }
          }}
        >
          <circle cx="120" cy="90" r="45" fill="#f4d8b0" />
          <circle cx="300" cy="90" r="45" fill="#f4d8b0" />
          <ellipse cx="210" cy="185" rx="120" ry="95" fill="#f6dfbd" />
          <path
            d="M145 150 L180 175 L160 205 L195 232 L176 260"
            stroke="#2f1d1d"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            ref={teddyPathRef}
          />
          <motion.path
            d="M145 150 L180 175 L160 205 L195 232 L176 260"
            stroke="#FFD700"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            pathLength={1}
            animate={{ pathLength: day3.progress / 100 }}
          />
          {myCursor && <circle cx={myCursor.x} cy={myCursor.y} r="4" fill="#60a5fa" />}
          {partnerCursor && <circle cx={partnerCursor.x} cy={partnerCursor.y} r="4" fill="#f472b6" />}
        </svg>

        <p className="text-xs text-muted-foreground">
          Both partners hold at the stitch start and trace together. Stay close to the line to advance. You are{" "}
          {isA ? "Partner A" : "Partner B"}: {myHolding ? "holding" : "not holding"}.
        </p>
      </div>
    </div>
  )
}
