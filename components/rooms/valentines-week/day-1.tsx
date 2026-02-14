"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import type { Day1Data, Role } from "@/components/rooms/valentines-week/types"

type Day1Props = {
  role: Role
  playerName: string
  partnerName: string
  day1: Day1Data
  setDay1: (d: Day1Data) => void
  saveDay1: (d: Day1Data) => Promise<void>
  paused: boolean
}

export function Day1View({ role, playerName, partnerName, day1, setDay1, saveDay1, paused }: Day1Props) {
  const [localQuestion, setLocalQuestion] = useState(day1.question)

  useEffect(() => {
    setLocalQuestion(day1.question)
  }, [day1.question])

  const handleQuestion = async (q: string) => {
    setLocalQuestion(q)
    const next = { ...day1, question: q }
    setDay1(next)
    await saveDay1(next)
  }

  const handleReveal = async () => {
    if (day1.revealed) return
    const next = { ...day1, revealed: true }
    setDay1(next)
    await saveDay1(next)
  }

  const handleAccept = async () => {
    if (day1.accepted) return
    const next = { ...day1, accepted: true }
    setDay1(next)
    await saveDay1(next)
  }

  const isPartnerA = role === "partner_a"

  return (
    <div className="relative z-10 min-h-dvh px-4 py-16">
      <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-card/80 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-3xl text-foreground">Day 1: Propose Day (Feb 8)</h2>
          <p className="text-sm text-muted-foreground">
            {playerName} & {partnerName}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[260px,1fr]">
          <div className="rounded-xl border border-border bg-amber-50 p-4 grid place-items-center">
            <div className="h-40 w-32 rounded-lg border-2 border-dashed border-amber-400 bg-white/70 grid place-items-center text-4xl font-serif text-amber-500">
              ?
            </div>
            {day1.revealed && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, rotate: [0, -3, 3, 0] }}
                transition={{ duration: 1.2 }}
                className="mt-3 text-amber-600 text-sm"
              >
                Confetti!
              </motion.div>
            )}
          </div>

          <div className="space-y-3">
            {isPartnerA ? (
              <textarea
                value={localQuestion}
                onChange={(e) => void handleQuestion(e.target.value)}
                disabled={paused}
                className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 h-24"
                placeholder="Will you be my Player 2?"
              />
            ) : (
              <div className="rounded-lg border border-border bg-secondary/20 p-3 text-sm text-muted-foreground">
                Partner A is writing the question.
              </div>
            )}

            {!day1.revealed ? (
              <button
                onClick={() => void handleReveal()}
                disabled={isPartnerA || !day1.question.trim() || paused}
                className="rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
              >
                Reveal
              </button>
            ) : (
              <div className="space-y-2">
                <p className="rounded-lg border border-border bg-background p-3 font-serif text-lg">{day1.question}</p>
                <button
                  onClick={() => void handleAccept()}
                  disabled={isPartnerA || day1.accepted || paused}
                  className="rounded-lg bg-green-500 px-4 py-2 text-white disabled:opacity-50"
                >
                  {day1.accepted ? "Accepted" : "Yes"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
