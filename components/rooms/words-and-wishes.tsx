"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"

type TimerData = {
  startedAt: number
  revealed: boolean
}

type WordsAndWishesProps = {
  sessionId: string
  role: "partner_a" | "partner_b"
  playerName: string
  partnerName: string
  onComplete?: () => void
}

const TIMER_ROOM_NAME = "words_timer"
const LETTER_ROOM_A = "words_letter_partner_a"
const LETTER_ROOM_B = "words_letter_partner_b"
const LEGACY_ROOM_NAME = "love_letter_room"
const DURATION_MS = 2 * 60 * 1000

const emptyTimerData: TimerData = {
  startedAt: Date.now(),
  revealed: false,
}

export default function WordsAndWishes({
  sessionId,
  role,
  playerName,
  partnerName,
  onComplete,
}: WordsAndWishesProps) {
  const supabase = useMemo(() => createClient(), [])
  const [timerData, setTimerData] = useState<TimerData>(emptyTimerData)
  const [letterA, setLetterA] = useState("")
  const [letterB, setLetterB] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(Date.now())
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timerDataRef = useRef<TimerData>(emptyTimerData)
  const myLetterRef = useRef("")
  const isEditingRef = useRef(false)

  const isA = role === "partner_a"
  const myLetter = isA ? letterA : letterB
  const partnerLetter = isA ? letterB : letterA
  const myRoomName = isA ? LETTER_ROOM_A : LETTER_ROOM_B
  const remainingMs = Math.max(0, timerData.startedAt + DURATION_MS - now)
  const isTimeUp = remainingMs === 0
  const isRevealed = timerData.revealed || isTimeUp

  useEffect(() => {
    timerDataRef.current = timerData
  }, [timerData])

  useEffect(() => {
    myLetterRef.current = myLetter
  }, [myLetter])

  const persistTimer = useCallback(
    async (patch: Partial<TimerData>) => {
      const next: TimerData = {
        startedAt: patch.startedAt ?? timerDataRef.current.startedAt ?? Date.now(),
        revealed: patch.revealed ?? timerDataRef.current.revealed ?? false,
      }

      if (Date.now() >= next.startedAt + DURATION_MS) {
        next.revealed = true
      }

      const { error: saveError } = await supabase.from("room_progress").upsert(
        {
          session_id: sessionId,
          room_name: TIMER_ROOM_NAME,
          completed: next.revealed,
          data: next,
        },
        { onConflict: "session_id,room_name" }
      )

      if (saveError) {
        setError(`Failed to save your letter: ${saveError.message}`)
        return
      }

      setTimerData(next)
    },
    [supabase, sessionId]
  )

  const loadState = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data: rows, error: loadError } = await supabase
      .from("room_progress")
      .select("room_name,data")
      .eq("session_id", sessionId)
      .in("room_name", [TIMER_ROOM_NAME, LETTER_ROOM_A, LETTER_ROOM_B, LEGACY_ROOM_NAME])

    if (loadError) {
      setError("Failed to load love letter room.")
      setLoading(false)
      return
    }

    const timerRow = rows?.find((row) => row.room_name === TIMER_ROOM_NAME)
    const letterARow = rows?.find((row) => row.room_name === LETTER_ROOM_A)
    const letterBRow = rows?.find((row) => row.room_name === LETTER_ROOM_B)
    const legacyRow = rows?.find((row) => row.room_name === LEGACY_ROOM_NAME)

    const timerPayload = (timerRow?.data || {}) as Partial<TimerData>
    const nextTimerData: TimerData = {
      startedAt: timerPayload.startedAt ?? Date.now(),
      revealed: timerPayload.revealed ?? false,
    }
    const legacyData = (legacyRow?.data || {}) as { letterA?: string; letterB?: string }
    const nextLetterA = ((letterARow?.data || {}) as { text?: string }).text ?? legacyData.letterA ?? ""
    const nextLetterB = ((letterBRow?.data || {}) as { text?: string }).text ?? legacyData.letterB ?? ""

    setTimerData(nextTimerData)
    setLetterA(nextLetterA)
    setLetterB(nextLetterB)

    if (!timerRow) {
      await persistTimer({ startedAt: nextTimerData.startedAt, revealed: false })
    }

    if (Date.now() >= nextTimerData.startedAt + DURATION_MS && !nextTimerData.revealed) {
      await persistTimer({ revealed: true, startedAt: nextTimerData.startedAt })
    }

    setLoading(false)
  }, [supabase, sessionId, persistTimer])

  useEffect(() => {
    void loadState()
  }, [loadState])

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const refreshLetters = useCallback(async () => {
    const { data: rows, error: fetchError } = await supabase
      .from("room_progress")
      .select("room_name,data")
      .eq("session_id", sessionId)
      .in("room_name", [LETTER_ROOM_A, LETTER_ROOM_B, LEGACY_ROOM_NAME])

    if (fetchError) return

    const rowA = rows?.find((row) => row.room_name === LETTER_ROOM_A)
    const rowB = rows?.find((row) => row.room_name === LETTER_ROOM_B)
    const legacyRow = rows?.find((row) => row.room_name === LEGACY_ROOM_NAME)
    const legacyData = (legacyRow?.data || {}) as { letterA?: string; letterB?: string }
    const nextA = ((rowA?.data || {}) as { text?: string }).text ?? legacyData.letterA ?? ""
    const nextB = ((rowB?.data || {}) as { text?: string }).text ?? legacyData.letterB ?? ""

    // Don't overwrite the user's local typing for their own letter while editing
    if (!(isA && isEditingRef.current)) {
      setLetterA(nextA)
    }
    if (!(!isA && isEditingRef.current)) {
      setLetterB(nextB)
    }
  }, [supabase, sessionId])

  useEffect(() => {
    if (!isTimeUp || timerData.revealed) return
    void persistTimer({ revealed: true })
  }, [isTimeUp, timerData.revealed, persistTimer])

  useEffect(() => {
    if (!isRevealed) return
    void refreshLetters()
  }, [isRevealed, refreshLetters])

  useEffect(() => {
    if (isRevealed) return
    const interval = setInterval(() => {
      void refreshLetters()
    }, 1500)
    return () => clearInterval(interval)
  }, [isRevealed, refreshLetters])

  useEffect(() => {
    const channel = supabase
      .channel(`love-letter-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_progress",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const row = payload.new as { room_name?: string; data?: unknown }
          if (row?.room_name === TIMER_ROOM_NAME) {
            const next = (row.data || {}) as Partial<TimerData>
            setTimerData({
              startedAt: next.startedAt ?? Date.now(),
              revealed: next.revealed ?? false,
            })
            return
          }

          if (row?.room_name === LETTER_ROOM_A) {
            const next = (row.data || {}) as { text?: string }
            // don't stomp local edits
            if (!(isA && isEditingRef.current)) {
              setLetterA(next.text ?? "")
            }
            return
          }

          if (row?.room_name === LETTER_ROOM_B) {
            const next = (row.data || {}) as { text?: string }
            if (!(!isA && isEditingRef.current)) {
              setLetterB(next.text ?? "")
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, sessionId])

  const persistMyLetter = useCallback(
    async (value: string) => {
      const { error: saveError } = await supabase.from("room_progress").upsert(
        {
          session_id: sessionId,
          room_name: myRoomName,
          completed: false,
          data: { text: value },
        },
        { onConflict: "session_id,room_name" }
      )

      if (saveError) {
        setError(`Failed to save your letter: ${saveError.message}`)
      }
    },
    [supabase, sessionId, myRoomName]
  )

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }
      void persistMyLetter(myLetterRef.current)
    }
  }, [persistMyLetter])

  const handleMyLetterChange = useCallback(
    (value: string) => {
      setError(null)
      if (isA) {
        setLetterA(value)
      } else {
        setLetterB(value)
      }

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        void persistMyLetter(value)
      }, 180)
    },
    [isA, persistMyLetter]
  )

  useEffect(() => {
    if (!isTimeUp) return
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    void persistMyLetter(myLetterRef.current)
  }, [isTimeUp, persistMyLetter])

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000)
    const mm = String(Math.floor(totalSec / 60)).padStart(2, "0")
    const ss = String(totalSec % 60).padStart(2, "0")
    return `${mm}:${ss}`
  }

  const drawWrappedText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) => {
    const words = text.split(" ")
    let line = ""

    for (let i = 0; i < words.length; i++) {
      const test = `${line}${words[i]} `
      if (ctx.measureText(test).width > maxWidth && i > 0) {
        ctx.fillText(line, x, y)
        line = `${words[i]} `
        y += lineHeight
      } else {
        line = test
      }
    }

    ctx.fillText(line, x, y)
  }

  const downloadPartnerLetter = () => {
    const width = 1080
    const height = 1350
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const grad = ctx.createLinearGradient(0, 0, width, height)
    grad.addColorStop(0, "#fff7f1")
    grad.addColorStop(1, "#ffe9f3")
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)

    ctx.fillStyle = "#b91c1c"
    ctx.font = "52px Georgia"
    ctx.fillText("Love Letter", 70, 110)

    ctx.fillStyle = "#7f1d1d"
    ctx.font = "30px Georgia"
    ctx.fillText(`From ${partnerName} to ${playerName}`, 70, 160)

    ctx.fillStyle = "#111827"
    ctx.font = "26px 'Helvetica Neue', sans-serif"
    drawWrappedText(ctx, partnerLetter || "(No letter written)", 70, 240, 940, 42)

    const url = canvas.toDataURL("image/png")
    const a = document.createElement("a")
    a.href = url
    a.download = `love-letter-from-${partnerName}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  if (loading) {
    return <div className="relative z-10 min-h-dvh grid place-items-center">Loading...</div>
  }

  return (
    <div className="relative z-10 min-h-dvh px-4 py-16">
      <div className="mx-auto max-w-5xl rounded-2xl border border-border bg-card/80 p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-3xl text-foreground">Words & Wishes</h2>
          <div className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm">
            Time left: <span className="font-semibold">{formatTime(remainingMs)}</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          You both have 2 minutes to write what you feel right now. When the timer ends, your partner's letter is revealed.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-secondary/20 p-4">
            <p className="mb-2 text-sm font-medium text-foreground">Your letter</p>
            <textarea
              value={myLetter}
              onChange={(e) => handleMyLetterChange(e.target.value)}
              onFocus={() => {
                isEditingRef.current = true
              }}
              onBlur={() => {
                isEditingRef.current = false
                if (saveTimerRef.current) {
                  clearTimeout(saveTimerRef.current)
                  saveTimerRef.current = null
                }
                void persistMyLetter(myLetterRef.current)
              }}
              onCompositionStart={() => (isEditingRef.current = true)}
              onCompositionEnd={() => (isEditingRef.current = false)}
              disabled={isTimeUp}
              aria-label="Your letter"
              className="h-56 w-full rounded-lg border border-border bg-background px-3 py-2 disabled:opacity-60"
              placeholder="Write your heart out..."
            />
            {isTimeUp && <p className="mt-2 text-xs text-muted-foreground">Writing time ended.</p>}
          </div>

          <div className="rounded-xl border border-border bg-secondary/20 p-4">
            <p className="mb-2 text-sm font-medium text-foreground">{partnerName}'s letter</p>
            {!isRevealed ? (
              <div className="grid h-56 place-items-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
                Reveals when timer ends.
              </div>
            ) : (
              <div className="h-56 overflow-auto rounded-lg border border-border bg-background px-3 py-2 whitespace-pre-wrap text-sm">
                {partnerLetter || "(No letter written)"}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={downloadPartnerLetter}
            disabled={!isRevealed}
            className="rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
          >
            Download Partner Letter
          </button>
          <button
            onClick={() => onComplete?.()}
            disabled={!isRevealed}
            className="rounded-lg border border-border px-4 py-2 text-foreground disabled:opacity-50"
          >
            Continue
          </button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  )
}
