"use client"

import type { Day4Data, Role } from "@/components/rooms/valentines-week/types"

type Day4Props = {
  role: Role
  playerName: string
  partnerName: string
  day4: Day4Data
  setDay4: (d: Day4Data) => void
  saveDay4: (d: Day4Data) => Promise<void>
  paused: boolean
}

export function Day4View({ role, playerName, partnerName, day4, setDay4, saveDay4, paused }: Day4Props) {
  const isA = role === "partner_a"

  const update = async (patch: Partial<Day4Data>) => {
    const next = { ...day4, ...patch }
    next.locked = Math.abs(next.handA - next.handB) <= 36 && Math.abs((next.handA + next.handB) / 2) <= 16
    setDay4(next)
    await saveDay4(next)
  }

  return (
    <div className="relative z-10 min-h-dvh px-4 py-16">
      <div className="mx-auto max-w-5xl rounded-2xl border border-border bg-card/80 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-3xl text-foreground">Day 4: Promise Day (Feb 11)</h2>
          <p className="text-sm text-muted-foreground">
            {playerName} & {partnerName}
          </p>
        </div>

        <div className="relative h-44 rounded-xl border border-border bg-rose-100/50 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-primary" />
          <div
            className="absolute top-1/2 h-12 w-28 -translate-y-1/2 rounded-full bg-pink-300 shadow-lg"
            style={{ left: `calc(50% + ${day4.handA}px - 56px)` }}
          />
          <div
            className="absolute top-1/2 h-12 w-28 -translate-y-1/2 rounded-full bg-blue-300 shadow-lg"
            style={{ left: `calc(50% + ${day4.handB}px - 56px)` }}
          />
        </div>

        <div className="space-y-2">
          {isA ? (
            <input
              type="range"
              min={-160}
              max={0}
              value={day4.handA}
              onChange={(e) => void update({ handA: Number(e.target.value) })}
              disabled={paused}
              className="w-full"
            />
          ) : (
            <input
              type="range"
              min={0}
              max={160}
              value={day4.handB}
              onChange={(e) => void update({ handB: Number(e.target.value) })}
              disabled={paused}
              className="w-full"
            />
          )}
          <div
            className={`rounded-lg border p-2 text-sm ${
              day4.locked ? "border-green-500 bg-green-100/50 text-green-700" : "border-border bg-secondary/20 text-muted-foreground"
            }`}
          >
            {day4.locked ? "Pinky lock complete. Share your promises." : "Drag both hands to meet at the center."}
          </div>
        </div>

        {day4.locked && (
          <div className="grid gap-3 md:grid-cols-2">
            <textarea
              value={day4.promiseA}
              onChange={(e) => void update({ promiseA: e.target.value })}
              disabled={!isA || paused}
              placeholder="Partner A promise"
              className="h-28 rounded-lg border border-border bg-secondary/30 px-3 py-2 disabled:opacity-60"
            />
            <textarea
              value={day4.promiseB}
              onChange={(e) => void update({ promiseB: e.target.value })}
              disabled={isA || paused}
              placeholder="Partner B promise"
              className="h-28 rounded-lg border border-border bg-secondary/30 px-3 py-2 disabled:opacity-60"
            />
          </div>
        )}
      </div>
    </div>
  )
}
