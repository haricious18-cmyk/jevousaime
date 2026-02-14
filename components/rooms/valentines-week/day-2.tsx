"use client"

import { CHOCOLATE_DATES } from "@/components/rooms/valentines-week/constants"
import type { Day2Data, Role } from "@/components/rooms/valentines-week/types"

type Day2Props = {
  role: Role
  playerName: string
  partnerName: string
  day2: Day2Data
  setDay2: (d: Day2Data) => void
  saveDay2: (d: Day2Data) => Promise<void>
  paused: boolean
}

export function Day2View({ role, playerName, partnerName, day2, setDay2, saveDay2, paused }: Day2Props) {
  const isA = role === "partner_a"

  const update = async (patch: Partial<Day2Data>) => {
    const next = { ...day2, ...patch }
    next.matched =
      next.darkMemory.trim().length > 0 &&
      next.milkMemory.trim().length > 0 &&
      Boolean(next.dateA) &&
      next.dateA === next.dateB
    setDay2(next)
    await saveDay2(next)
  }

  return (
    <div className="relative z-10 min-h-dvh px-4 py-16">
      <div className="mx-auto max-w-5xl rounded-2xl border border-border bg-card/80 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-3xl text-foreground">Day 2: Chocolate Day (Feb 9)</h2>
          <p className="text-sm text-muted-foreground">
            {playerName} & {partnerName}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[280px,1fr]">
          <div className="rounded-xl border border-border bg-amber-100/60 p-4">
            <div className="h-40 w-full rounded-lg border border-amber-300 bg-amber-200/60 grid place-items-center font-serif text-lg text-amber-700">
              Chocolate Box
            </div>
            <p className="mt-3 text-sm text-amber-800">
              Partner A picks a Dark Chocolate (tough memory). Partner B picks a Milk Chocolate (sweet memory). Match them to the same date to share the chocolate.
            </p>
          </div>

          <div className="space-y-3">
            {isA ? (
              <>
                <input
                  value={day2.darkMemory}
                  onChange={(e) => void update({ darkMemory: e.target.value })}
                  disabled={paused}
                  placeholder="Dark chocolate memory (tough)"
                  className="w-full rounded-lg border border-border bg-secondary/30 px-3 py-2"
                />
                <select
                  value={day2.dateA}
                  onChange={(e) => void update({ dateA: e.target.value })}
                  disabled={paused}
                  className="w-full rounded-lg border border-border bg-secondary/30 px-3 py-2"
                >
                  <option value="">Select date</option>
                  {CHOCOLATE_DATES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <>
                <input
                  value={day2.milkMemory}
                  onChange={(e) => void update({ milkMemory: e.target.value })}
                  disabled={paused}
                  placeholder="Milk chocolate memory (sweet)"
                  className="w-full rounded-lg border border-border bg-secondary/30 px-3 py-2"
                />
                <select
                  value={day2.dateB}
                  onChange={(e) => void update({ dateB: e.target.value })}
                  disabled={paused}
                  className="w-full rounded-lg border border-border bg-secondary/30 px-3 py-2"
                >
                  <option value="">Select date</option>
                  {CHOCOLATE_DATES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </>
            )}

            <div
              className={`rounded-lg border p-3 text-sm ${
                day2.matched ? "border-green-500 bg-green-100/40 text-green-700" : "border-border bg-secondary/20 text-muted-foreground"
              }`}
            >
              {day2.matched ? "Match found! Chocolate unlocked." : "Pick your memory and date. They must match the same date to share."}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
