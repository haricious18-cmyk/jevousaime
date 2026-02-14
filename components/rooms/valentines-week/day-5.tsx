"use client"

import type { Day5Data } from "@/components/rooms/valentines-week/types"

type Day5Props = {
  playerName: string
  partnerName: string
  day5: Day5Data
}

export function Day5View({ playerName, partnerName, day5 }: Day5Props) {
  return (
    <div className="relative z-10 min-h-dvh px-4 py-16">
      <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-card/80 p-8 text-center space-y-4">
        <h2 className="font-serif text-3xl text-foreground">Day 5: Hug Day (Feb 12)</h2>
        <p className="text-muted-foreground text-sm">A virtual hug just for you two.</p>
        <div className="h-48 rounded-xl border border-border bg-rose-100/60 grid place-items-center text-2xl font-serif text-rose-700">
          Wrap your arms around the screen and hug tight.
        </div>
        <p className="text-sm text-muted-foreground">
          {playerName} and {partnerName}, this will fade after 10 seconds and move you onward.
        </p>
        {day5.done ? (
          <p className="text-green-600 text-sm">Hug delivered. Moving to the next day...</p>
        ) : (
          <p className="text-sm text-amber-600">Hug in progress...</p>
        )}
      </div>
    </div>
  )
}
