"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

type Role = "partner_a" | "partner_b"

type ValentinesWeekProps = {
  sessionId: string
  roomCode: string
  role: Role
  playerName: string
  partnerName: string
  onDayChanged?: (day: number) => void
}

type RoseData = {
  notesA: string[]
  notesB: string[]
}

const emptyRoseData: RoseData = { notesA: [], notesB: [] }

type Day1Data = {
  question: string
  revealed: boolean
  accepted: boolean
}

const emptyDay1: Day1Data = { question: "", revealed: false, accepted: false }

type Day2Data = {
  darkMemory: string
  milkMemory: string
  dateA: string
  dateB: string
  matched: boolean
}

const emptyDay2: Day2Data = {
  darkMemory: "",
  milkMemory: "",
  dateA: "",
  dateB: "",
  matched: false,
}

type Day3Data = {
  progress: number
  cursorA: { x: number; y: number } | null
  cursorB: { x: number; y: number } | null
  holdingA: boolean
  holdingB: boolean
}

const emptyDay3: Day3Data = {
  progress: 0,
  cursorA: null,
  cursorB: null,
  holdingA: false,
  holdingB: false,
}

type Day4Data = {
  handA: number
  handB: number
  locked: boolean
  promiseA: string
  promiseB: string
}

const emptyDay4: Day4Data = {
  handA: -140,
  handB: 140,
  locked: false,
  promiseA: "",
  promiseB: "",
}

type Day5Data = {
  shownAt: number | null
  done: boolean
}

const emptyDay5: Day5Data = {
  shownAt: null,
  done: false,
}

type Day6Data = {
  cameraA: boolean
  cameraB: boolean
  kissA: boolean
  kissB: boolean
}

const emptyDay6: Day6Data = {
  cameraA: false,
  cameraB: false,
  kissA: false,
  kissB: false,
}

type Day7Data = {
  finished: boolean
}

const emptyDay7: Day7Data = { finished: false }

function bloomColor(progress: number) {
  const clamped = Math.max(0, Math.min(100, progress))
  const sat = 5 + clamped * 0.9
  const light = 65 - clamped * 0.15
  return `hsl(0 ${sat}% ${light}%)`
}

export default function ValentinesWeek({
  sessionId,
  roomCode,
  role,
  playerName,
  partnerName,
  onDayChanged,
}: ValentinesWeekProps) {
  const supabase = useMemo(() => createClient(), [])
  const [currentDay, setCurrentDay] = useState(0)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [roseData, setRoseData] = useState<RoseData>(emptyRoseData)
  const [day1, setDay1] = useState<Day1Data>(emptyDay1)
  const [day2, setDay2] = useState<Day2Data>(emptyDay2)
  const [day3, setDay3] = useState<Day3Data>(emptyDay3)
  const [day4, setDay4] = useState<Day4Data>(emptyDay4)
  const [day5, setDay5] = useState<Day5Data>(emptyDay5)
  const [day6, setDay6] = useState<Day6Data>(emptyDay6)
  const [day7, setDay7] = useState<Day7Data>(emptyDay7)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const advancingRef = useRef(false)
  const teddyPathRef = useRef<SVGPathElement | null>(null)
  const [partnerOnline, setPartnerOnline] = useState(false)
  const isMountedRef = useRef(true)

  const myNotes = role === "partner_a" ? roseData.notesA : roseData.notesB
  const partnerNotes = role === "partner_a" ? roseData.notesB : roseData.notesA
  const totalNotes = roseData.notesA.length + roseData.notesB.length
  const roseProgress = Math.round((totalNotes / 10) * 100)
  const readyToAdvance = roseData.notesA.length >= 5 && roseData.notesB.length >= 5

  const loadDayState = useCallback(async () => {
    if (!isMountedRef.current) return
    
    setLoading(true)
    setError(null)

    const { data: roomData, error: roomError } = await supabase
      .from("rooms")
      .upsert({ room_code: roomCode }, { onConflict: "room_code" })
      .select("id,current_day,current_stage")
      .single()

    if (roomError || !roomData) {
      setError("Failed to load room state.")
      setLoading(false)
      return
    }

    setRoomId(roomData.id)
    const day = Math.max(0, Math.min(7, roomData.current_day ?? roomData.current_stage ?? 0))
    setCurrentDay(day)
    onDayChanged?.(day)

    const { data: progressRows } = await supabase
      .from("room_progress")
      .select("room_name,data")
      .eq("session_id", sessionId)
      .in("room_name", [
        "bedroom_day_0",
        "bedroom_day_1",
        "bedroom_day_2",
        "bedroom_day_3",
        "bedroom_day_4",
        "bedroom_day_5",
        "bedroom_day_6",
        "bedroom_day_7",
      ])

    progressRows?.forEach((row) => {
      if (row.room_name === "bedroom_day_0" && row.data) {
        const payload = row.data as Partial<RoseData>
        setRoseData({
          notesA: payload.notesA ?? [],
          notesB: payload.notesB ?? [],
        })
      }
      if (row.room_name === "bedroom_day_1" && row.data) {
        const payload = row.data as Partial<Day1Data>
        setDay1({
          question: payload.question ?? "",
          revealed: payload.revealed ?? false,
          accepted: payload.accepted ?? false,
        })
      }
      if (row.room_name === "bedroom_day_2" && row.data) {
        const payload = row.data as Partial<Day2Data>
        setDay2({
          darkMemory: payload.darkMemory ?? "",
          milkMemory: payload.milkMemory ?? "",
          dateA: payload.dateA ?? "",
          dateB: payload.dateB ?? "",
          matched: payload.matched ?? false,
        })
      }
      if (row.room_name === "bedroom_day_3" && row.data) {
        const payload = row.data as Partial<Day3Data>
        setDay3({
          progress: payload.progress ?? 0,
          cursorA: payload.cursorA ?? null,
          cursorB: payload.cursorB ?? null,
          holdingA: payload.holdingA ?? false,
          holdingB: payload.holdingB ?? false,
        })
      }
      if (row.room_name === "bedroom_day_4" && row.data) {
        const payload = row.data as Partial<Day4Data>
        setDay4({
          handA: payload.handA ?? -140,
          handB: payload.handB ?? 140,
          locked: payload.locked ?? false,
          promiseA: payload.promiseA ?? "",
          promiseB: payload.promiseB ?? "",
        })
      }
      if (row.room_name === "bedroom_day_5" && row.data) {
        const payload = row.data as Partial<Day5Data>
        setDay5({
          shownAt: payload.shownAt ?? null,
          done: payload.done ?? false,
        })
      }
      if (row.room_name === "bedroom_day_6" && row.data) {
        const payload = row.data as Partial<Day6Data>
        setDay6({
          cameraA: payload.cameraA ?? false,
          cameraB: payload.cameraB ?? false,
          kissA: payload.kissA ?? false,
          kissB: payload.kissB ?? false,
        })
      }
      if (row.room_name === "bedroom_day_7" && row.data) {
        const payload = row.data as Partial<Day7Data>
        setDay7({
          finished: payload.finished ?? false,
        })
      }
    })

    if (isMountedRef.current) {
      setLoading(false)
    }
  }, [supabase, roomCode, sessionId, onDayChanged])

  useEffect(() => {
    void loadDayState()
  }, [loadDayState])

  useEffect(() => {
    if (!sessionId || !roomId) return
    let channel: RealtimeChannel

    channel = supabase
      .channel(`bedroom-day0-${sessionId}`)
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
          if (!row?.room_name) return
          if (row.room_name === "bedroom_day_0") {
            const d = (row.data || {}) as Partial<RoseData>
            setRoseData({
              notesA: d.notesA ?? [],
              notesB: d.notesB ?? [],
            })
          } else if (row.room_name === "bedroom_day_1") {
            const d = (row.data || {}) as Partial<Day1Data>
            setDay1({
              question: d.question ?? "",
              revealed: d.revealed ?? false,
              accepted: d.accepted ?? false,
            })
          } else if (row.room_name === "bedroom_day_2") {
            const d = (row.data || {}) as Partial<Day2Data>
            setDay2({
              darkMemory: d.darkMemory ?? "",
              milkMemory: d.milkMemory ?? "",
              dateA: d.dateA ?? "",
              dateB: d.dateB ?? "",
              matched: d.matched ?? false,
            })
          } else if (row.room_name === "bedroom_day_3") {
            const d = (row.data || {}) as Partial<Day3Data>
            setDay3({
              progress: d.progress ?? 0,
              cursorA: d.cursorA ?? null,
              cursorB: d.cursorB ?? null,
              holdingA: d.holdingA ?? false,
              holdingB: d.holdingB ?? false,
            })
          } else if (row.room_name === "bedroom_day_4") {
            const d = (row.data || {}) as Partial<Day4Data>
            setDay4({
              handA: d.handA ?? -140,
              handB: d.handB ?? 140,
              locked: d.locked ?? false,
              promiseA: d.promiseA ?? "",
              promiseB: d.promiseB ?? "",
            })
          } else if (row.room_name === "bedroom_day_5") {
            const d = (row.data || {}) as Partial<Day5Data>
            setDay5({
              shownAt: d.shownAt ?? null,
              done: d.done ?? false,
            })
          } else if (row.room_name === "bedroom_day_6") {
            const d = (row.data || {}) as Partial<Day6Data>
            setDay6({
              cameraA: d.cameraA ?? false,
              cameraB: d.cameraB ?? false,
              kissA: d.kissA ?? false,
              kissB: d.kissB ?? false,
            })
          } else if (row.room_name === "bedroom_day_7") {
            const d = (row.data || {}) as Partial<Day7Data>
            setDay7({
              finished: d.finished ?? false,
            })
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          const updated = payload.new as { current_day?: number; current_stage?: number }
          const day = Math.max(0, Math.min(7, updated.current_day ?? updated.current_stage ?? 0))
          setCurrentDay(day)
          onDayChanged?.(day)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId, roomId, supabase, onDayChanged])

  // Presence to pause when partner disconnects
  useEffect(() => {
    const presenceChannel = supabase.channel(`bedroom-presence-${sessionId}`, {
      config: { presence: { key: role } },
    })
    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState()
        const roles = new Set<string>()
        Object.values(state).forEach((arr) => {
          arr.forEach((entry: any) => roles.add(entry.key))
        })
        setPartnerOnline(roles.has(role === "partner_a" ? "partner_b" : "partner_a"))
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({ key: role, name: playerName })
        }
      })
    return () => {
      supabase.removeChannel(presenceChannel)
    }
  }, [supabase, sessionId, role, playerName])

  // Cleanup mounted ref on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const saveRoseData = useCallback(async (data: RoseData) => {
    const { error } = await supabase
      .from("room_progress")
      .upsert(
        {
          session_id: sessionId,
          room_name: "bedroom_day_0",
          completed: data.notesA.length >= 5 && data.notesB.length >= 5,
          completed_at: new Date().toISOString(),
          data,
        },
        { onConflict: "session_id,room_name" }
      )
  }, [supabase, sessionId])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text) return
    setError(null)

    const next = {
      notesA: role === "partner_a" ? [...roseData.notesA, text] : roseData.notesA,
      notesB: role === "partner_b" ? [...roseData.notesB, text] : roseData.notesB,
    }

    setRoseData(next)
    setInput("")
    await saveRoseData(next)
  }, [input, role, roseData, saveRoseData])

  const saveDay1 = useCallback(
    async (data: Day1Data) => {
      await supabase.from("room_progress").upsert(
        {
          session_id: sessionId,
          room_name: "bedroom_day_1",
          completed: data.accepted,
          completed_at: new Date().toISOString(),
          data,
        },
        { onConflict: "session_id,room_name" }
      )
    },
    [supabase, sessionId]
  )

  const saveDay2 = useCallback(
    async (data: Day2Data) => {
      await supabase.from("room_progress").upsert(
        {
          session_id: sessionId,
          room_name: "bedroom_day_2",
          completed: data.matched,
          completed_at: new Date().toISOString(),
          data,
        },
        { onConflict: "session_id,room_name" }
      )
    },
    [supabase, sessionId]
  )

  const saveDay3 = useCallback(
    async (data: Day3Data) => {
      await supabase.from("room_progress").upsert(
        {
          session_id: sessionId,
          room_name: "bedroom_day_3",
          completed: data.progress >= 100,
          completed_at: new Date().toISOString(),
          data,
        },
        { onConflict: "session_id,room_name" }
      )
    },
    [supabase, sessionId]
  )

  const saveDay4 = useCallback(
    async (data: Day4Data) => {
      await supabase.from("room_progress").upsert(
        {
          session_id: sessionId,
          room_name: "bedroom_day_4",
          completed: data.locked && data.promiseA.trim() !== "" && data.promiseB.trim() !== "",
          completed_at: new Date().toISOString(),
          data,
        },
        { onConflict: "session_id,room_name" }
      )
    },
    [supabase, sessionId]
  )

  const saveDay5 = useCallback(
    async (data: Day5Data) => {
      await supabase.from("room_progress").upsert(
        {
          session_id: sessionId,
          room_name: "bedroom_day_5",
          completed: data.done,
          completed_at: new Date().toISOString(),
          data,
        },
        { onConflict: "session_id,room_name" }
      )
    },
    [supabase, sessionId]
  )

  const saveDay6 = useCallback(
    async (data: Day6Data) => {
      await supabase.from("room_progress").upsert(
        {
          session_id: sessionId,
          room_name: "bedroom_day_6",
          completed: data.kissA && data.kissB,
          completed_at: new Date().toISOString(),
          data,
        },
        { onConflict: "session_id,room_name" }
      )
    },
    [supabase, sessionId]
  )

  const saveDay7 = useCallback(
    async (data: Day7Data) => {
      await supabase.from("room_progress").upsert(
        {
          session_id: sessionId,
          room_name: "bedroom_day_7",
          completed: data.finished,
          completed_at: new Date().toISOString(),
          data,
        },
        { onConflict: "session_id,room_name" }
      )
    },
    [supabase, sessionId]
  )

  const advanceDay = useCallback(
    async (targetDay: number) => {
      if (!roomId || advancingRef.current) return
      advancingRef.current = true
      await supabase
        .from("rooms")
        .update({ current_day: targetDay, current_stage: targetDay, updated_at: new Date().toISOString() })
        .eq("id", roomId)
      setCurrentDay(targetDay)
      onDayChanged?.(targetDay)
      advancingRef.current = false
    },
    [roomId, supabase, onDayChanged]
  )

  useEffect(() => {
    if (readyToAdvance && currentDay === 0) {
      void advanceDay(1)
    }
  }, [readyToAdvance, currentDay, advanceDay])

  useEffect(() => {
    if (currentDay === 1 && day1.accepted) {
      void advanceDay(2)
    }
  }, [currentDay, day1.accepted, advanceDay])

  useEffect(() => {
    if (currentDay === 2 && day2.matched) {
      void advanceDay(3)
    }
  }, [currentDay, day2.matched, advanceDay])

  useEffect(() => {
    if (currentDay === 3 && day3.progress >= 100) {
      void advanceDay(4)
    }
  }, [currentDay, day3.progress, advanceDay])

  useEffect(() => {
    const complete = day4.locked && day4.promiseA.trim().length > 0 && day4.promiseB.trim().length > 0
    if (currentDay === 4 && complete) {
      void advanceDay(5)
    }
  }, [currentDay, day4.locked, day4.promiseA, day4.promiseB, advanceDay])

  useEffect(() => {
    if (currentDay !== 5) return
    if (!day5.shownAt) {
      const now = Date.now()
      const next = { ...day5, shownAt: now }
      setDay5(next)
      void saveDay5(next)
      return
    }
    if (!day5.done) {
      const timer = setInterval(() => {
        if (Date.now() - (day5.shownAt ?? 0) >= 10_000) {
          const next = { ...day5, done: true }
          setDay5(next)
          void saveDay5(next)
          void advanceDay(6)
        }
      }, 500)
      return () => clearInterval(timer)
    }
  }, [currentDay, day5, saveDay5, advanceDay])

  useEffect(() => {
    if (currentDay === 6 && day6.kissA && day6.kissB) {
      void advanceDay(7)
    }
  }, [currentDay, day6.kissA, day6.kissB, advanceDay])

  useEffect(() => {
    if (currentDay === 7 && day7.finished) {
      void advanceDay(7) // stay, but ensure completion stored
    }
  }, [currentDay, day7.finished, advanceDay])

  if (loading) {
    return <div className="relative z-10 min-h-dvh grid place-items-center">Loading...</div>
  }

  const paused = !partnerOnline

  const view = (() => {
    switch (currentDay) {
      case 0:
        return (
          <Day0View
            playerName={playerName}
            partnerName={partnerName}
            myNotes={myNotes}
            partnerNotes={partnerNotes}
            roseProgress={roseProgress}
            readyToAdvance={readyToAdvance}
            input={input}
            setInput={setInput}
            handleSend={handleSend}
            error={error}
            paused={paused}
          />
        )
      case 1:
        return (
          <Day1View
            role={role}
            playerName={playerName}
            partnerName={partnerName}
            day1={day1}
            setDay1={setDay1}
            saveDay1={saveDay1}
            paused={paused}
          />
        )
      case 2:
        return (
          <Day2View
            role={role}
            playerName={playerName}
            partnerName={partnerName}
            day2={day2}
            setDay2={setDay2}
            saveDay2={saveDay2}
            paused={paused}
          />
        )
      case 3:
        return (
          <Day3View
            role={role}
            playerName={playerName}
            partnerName={partnerName}
            day3={day3}
            setDay3={setDay3}
            saveDay3={saveDay3}
            teddyPathRef={teddyPathRef}
            paused={paused}
          />
        )
      case 4:
        return (
          <Day4View
            role={role}
            playerName={playerName}
            partnerName={partnerName}
            day4={day4}
            setDay4={setDay4}
            saveDay4={saveDay4}
            paused={paused}
          />
        )
      case 5:
        return <Day5View playerName={playerName} partnerName={partnerName} day5={day5} />
      case 6:
        return (
          <Day6View
            role={role}
            playerName={playerName}
            partnerName={partnerName}
            day6={day6}
            setDay6={setDay6}
            saveDay6={saveDay6}
            paused={paused}
          />
        )
      case 7:
        return (
          <Day7View
            playerName={playerName}
            partnerName={partnerName}
            roseNotesA={roseData.notesA}
            roseNotesB={roseData.notesB}
            promiseA={day4.promiseA}
            promiseB={day4.promiseB}
            day7={day7}
            setDay7={setDay7}
            saveDay7={saveDay7}
          />
        )
      default:
        return (
          <div className="rounded-xl border border-border bg-card/70 p-6 text-center">
            <p className="font-serif text-2xl text-foreground">Day {currentDay} in progress...</p>
          </div>
        )
    }
  })()

  return (
    <div className="relative z-10 min-h-dvh px-4 py-16">
      {paused && (
        <div className="mb-3 rounded-lg border border-amber-400/40 bg-amber-100/30 px-3 py-2 text-sm text-amber-800">
          Waiting for your partner to reconnect...
        </div>
      )}
      <AnimatePresence mode="wait">
        <motion.div
          key={`day-${currentDay}`}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.35 }}
        >
          {view}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function Day0View({
  playerName,
  partnerName,
  myNotes,
  partnerNotes,
  roseProgress,
  readyToAdvance,
  input,
  setInput,
  handleSend,
  error,
  paused,
}: {
  playerName: string
  partnerName: string
  myNotes: string[]
  partnerNotes: string[]
  roseProgress: number
  readyToAdvance: boolean
  input: string
  setInput: (v: string) => void
  handleSend: () => void
  error: string | null
  paused: boolean
}) {
  return (
    <div className="relative z-10 min-h-dvh px-4 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 rounded-xl border border-border bg-background/80 p-4">
          <h2 className="font-serif text-3xl text-foreground">Day 0: Rose Day (Feb 7)</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Both partners send 5 kind words to bloom the rose.
          </p>
          <p className="text-sm mt-2">
            {playerName}: {myNotes.length}/5 | {partnerName}: {partnerNotes.length}/5
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mx-auto mb-3 h-64 w-56 rounded-xl border border-border bg-zinc-100/90 grid place-items-center">
              <svg viewBox="0 0 180 240" className="h-56 w-40">
                <rect x="68" y="160" width="44" height="60" rx="8" fill="hsl(30 20% 80%)" />
                <path d="M90 160 L90 96" stroke="hsl(130 35% 35%)" strokeWidth="4" />
                <motion.circle
                  cx="90"
                  cy="82"
                  r="24"
                  fill={bloomColor(roseProgress)}
                  animate={{ scale: readyToAdvance ? [1, 1.08, 1] : 1 }}
                  transition={readyToAdvance ? { duration: 1.2, repeat: Infinity } : { duration: 0.2 }}
                />
                <circle cx="80" cy="72" r="7" fill={bloomColor(roseProgress)} opacity="0.75" />
                <circle cx="100" cy="72" r="7" fill={bloomColor(roseProgress)} opacity="0.75" />
                <circle cx="90" cy="67" r="7" fill={bloomColor(roseProgress)} opacity="0.75" />
              </svg>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <motion.div
                className="h-full bg-rose-500"
                animate={{ width: `${Math.min(100, roseProgress)}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <label className="text-sm text-muted-foreground">Write a compliment</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="mt-2 h-32 w-full rounded-lg border border-border bg-secondary/40 px-3 py-2"
              placeholder="I love how you make distance feel small..."
            />
            <button
              onClick={() => void handleSend()}
              disabled={!input.trim() || paused}
              className="mt-3 rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
            >
              Send kind word
            </button>
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
            {readyToAdvance && (
              <p className="mt-3 text-sm text-green-600">
                Rose fully bloomed. Auto-unlocking next day...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Day1View({
  role,
  playerName,
  partnerName,
  day1,
  setDay1,
  saveDay1,
  paused,
}: {
  role: Role
  playerName: string
  partnerName: string
  day1: Day1Data
  setDay1: (d: Day1Data) => void
  saveDay1: (d: Day1Data) => Promise<void>
  paused: boolean
}) {
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
                <p className="rounded-lg border border-border bg-background p-3 font-serif text-lg">
                  {day1.question}
                </p>
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

const CHOCOLATE_DATES = ["First Call", "First Fight", "First Trip", "First I Love You"]

function Day2View({
  role,
  playerName,
  partnerName,
  day2,
  setDay2,
  saveDay2,
  paused,
}: {
  role: Role
  playerName: string
  partnerName: string
  day2: Day2Data
  setDay2: (d: Day2Data) => void
  saveDay2: (d: Day2Data) => Promise<void>
  paused: boolean
}) {
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
              Partner A picks a Dark Chocolate (tough memory). Partner B picks a Milk Chocolate (sweet memory).
              Match them to the same date to share the chocolate.
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
                day2.matched
                  ? "border-green-500 bg-green-100/40 text-green-700"
                  : "border-border bg-secondary/20 text-muted-foreground"
              }`}
            >
              {day2.matched
                ? "Match found! Chocolate unlocked."
                : "Pick your memory and date. They must match the same date to share."}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Day3View({
  role,
  playerName,
  partnerName,
  day3,
  setDay3,
  saveDay3,
  teddyPathRef,
  paused,
}: {
  role: Role
  playerName: string
  partnerName: string
  day3: Day3Data
  setDay3: (d: Day3Data) => void
  saveDay3: (d: Day3Data) => Promise<void>
  teddyPathRef: React.MutableRefObject<SVGPathElement | null>
  paused: boolean
}) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const isA = role === "partner_a"

  const toLocal = (e: React.PointerEvent<SVGSVGElement>) => {
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

      // compute progress increment if both are holding and near target
      const path = teddyPathRef.current
      const myCursor = isA ? (patch.cursorA ?? day3.cursorA) : (patch.cursorB ?? day3.cursorB)
      const partnerCursor = isA ? day3.cursorB : day3.cursorA
      const myHold = isA ? (patch.holdingA ?? day3.holdingA) : (patch.holdingB ?? day3.holdingB)
      const partnerHold = isA ? day3.holdingB : day3.holdingA

      let nextProgress = day3.progress
      if (path && myCursor && partnerCursor && myHold && partnerHold && day3.progress < 100) {
        const len = path.getTotalLength()
        const targetLen = (day3.progress / 100) * len
        const target = path.getPointAtLength(targetLen)
        const d1 = Math.hypot(myCursor.x - target.x, myCursor.y - target.y)
        const d2 = Math.hypot(partnerCursor.x - target.x, partnerCursor.y - target.y)
        if (d1 <= 20 && d2 <= 20) {
          nextProgress = Math.min(100, day3.progress + 1.2)
          patch.progress = nextProgress
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
          Both partners hold at the stitch start and trace together. Stay close to the line to advance.
          You are {isA ? "Partner A" : "Partner B"}: {myHolding ? "holding" : "not holding"}.
        </p>
      </div>
    </div>
  )
}

function Day4View({
  role,
  playerName,
  partnerName,
  day4,
  setDay4,
  saveDay4,
  paused,
}: {
  role: Role
  playerName: string
  partnerName: string
  day4: Day4Data
  setDay4: (d: Day4Data) => void
  saveDay4: (d: Day4Data) => Promise<void>
  paused: boolean
}) {
  const isA = role === "partner_a"

  const update = async (patch: Partial<Day4Data>) => {
    const next = { ...day4, ...patch }
    const locked = Math.abs(next.handA - next.handB) <= 36 && Math.abs((next.handA + next.handB) / 2) <= 16
    next.locked = locked
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
              day4.locked
                ? "border-green-500 bg-green-100/50 text-green-700"
                : "border-border bg-secondary/20 text-muted-foreground"
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

function Day5View({
  playerName,
  partnerName,
  day5,
}: {
  playerName: string
  partnerName: string
  day5: Day5Data
}) {
  return (
    <div className="relative z-10 min-h-dvh px-4 py-16">
      <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-card/80 p-8 text-center space-y-4">
        <h2 className="font-serif text-3xl text-foreground">Day 5: Hug Day (Feb 12)</h2>
        <p className="text-muted-foreground text-sm">A virtual hug just for you two.</p>
        <div className="h-48 rounded-xl border border-border bg-rose-100/60 grid place-items-center text-2xl font-serif text-rose-700">
          Wrap your arms around the screen and hug tight. ??
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

function Day6View({
  role,
  playerName,
  partnerName,
  day6,
  setDay6,
  saveDay6,
  paused,
}: {
  role: Role
  playerName: string
  partnerName: string
  day6: Day6Data
  setDay6: (d: Day6Data) => void
  saveDay6: (d: Day6Data) => Promise<void>
  paused: boolean
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const isA = role === "partner_a"

  const update = async (patch: Partial<Day6Data>) => {
    const next = { ...day6, ...patch }
    setDay6(next)
    await saveDay6(next)
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play().catch(() => {})
      }
      await update(isA ? { cameraA: true } : { cameraB: true })
    } catch {
      // ignore for now; could add error UI
    }
  }

  const stopCamera = () => {
    const trackStream = videoRef.current?.srcObject as MediaStream | null
    trackStream?.getTracks().forEach((t) => t.stop())
    if (videoRef.current) videoRef.current.srcObject = null
  }

  useEffect(() => stopCamera, [])

  const kiss = async () => {
    await update(isA ? { kissA: true } : { kissB: true })
  }

  return (
    <div className="relative z-10 min-h-dvh px-4 py-16">
      <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-card/80 p-6 space-y-4 text-center">
        <h2 className="font-serif text-3xl text-foreground">Day 6: Kiss Day (Feb 13)</h2>
        <p className="text-muted-foreground text-sm">
          Open your camera and blow a kiss to each other. Keep it sweet.
        </p>

        <div className="mx-auto h-64 w-full max-w-xl rounded-xl border border-rose-300 bg-rose-50 grid place-items-center overflow-hidden">
          <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
          {!(isA ? day6.cameraA : day6.cameraB) && (
            <button
              onClick={() => void startCamera()}
              disabled={paused}
              className="absolute rounded-lg bg-rose-500 px-4 py-2 text-white shadow"
            >
              Start camera
            </button>
          )}
        </div>

        <div className="flex justify-center gap-3 text-sm text-muted-foreground">
          <span>You: {isA ? (day6.cameraA ? "Camera on" : "Camera off") : day6.cameraB ? "Camera on" : "Camera off"}</span>
          <span>Partner: {isA ? (day6.cameraB ? "Camera on" : "Camera off") : day6.cameraA ? "Camera on" : "Camera off"}</span>
        </div>

        <button
          onClick={() => void kiss()}
          disabled={(isA ? day6.kissA : day6.kissB) || paused}
          className="rounded-lg bg-primary px-5 py-2 text-primary-foreground disabled:opacity-60"
        >
          {isA ? (day6.kissA ? "Kiss sent" : "Send kiss") : day6.kissB ? "Kiss sent" : "Send kiss"}
        </button>

        <p className="text-sm text-muted-foreground">
          Need both kisses to move to Valentine&apos;s Day. {playerName}: {isA ? (day6.kissA ? "done" : "pending") : (day6.kissB ? "done" : "pending")}. {partnerName}: {isA ? (day6.kissB ? "done" : "pending") : (day6.kissA ? "done" : "pending")}.
        </p>
      </div>
    </div>
  )
}

function Day7View({
  playerName,
  partnerName,
  roseNotesA,
  roseNotesB,
  promiseA,
  promiseB,
  day7,
  setDay7,
  saveDay7,
}: {
  playerName: string
  partnerName: string
  roseNotesA: string[]
  roseNotesB: string[]
  promiseA: string
  promiseB: string
  day7: Day7Data
  setDay7: (d: Day7Data) => void
  saveDay7: (d: Day7Data) => Promise<void>
}) {
  // Simple text wrap helper
  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) => {
    const words = text.split(" ")
    let line = ""
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " "
      const metrics = ctx.measureText(testLine)
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, y)
        line = words[n] + " "
        y += lineHeight
      } else {
        line = testLine
      }
    }
    ctx.fillText(line, x, y)
  }

  const download = async () => {
    const width = 1080
    const height = 1350
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // background
    const grad = ctx.createLinearGradient(0, 0, width, height)
    grad.addColorStop(0, "#fff7e6")
    grad.addColorStop(1, "#ffe4ec")
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)

    ctx.fillStyle = "#b45309"
    ctx.font = "48px Georgia"
    ctx.fillText("Love Letter", 60, 100)

    ctx.fillStyle = "#7c2d12"
    ctx.font = "28px Georgia"
    ctx.fillText(`From ${playerName} & ${partnerName}`, 60, 150)

    ctx.font = "24px 'Helvetica Neue', sans-serif"
    ctx.fillStyle = "#1f2937"
    let y = 210
    const lineHeight = 34

    const writeBlock = (title: string, lines: string[]) => {
      ctx.font = "26px Georgia"
      ctx.fillStyle = "#b91c1c"
      ctx.fillText(title, 60, y)
      y += lineHeight
      ctx.font = "22px 'Helvetica Neue', sans-serif"
      ctx.fillStyle = "#111827"
      if (lines.length === 0) {
        ctx.fillText("- (blank) -", 80, y)
        y += lineHeight
      } else {
        lines.forEach((ln) => {
          wrapText(ctx, ln, 80, y, width - 120, lineHeight)
          y += lineHeight * Math.max(1, Math.ceil(ctx.measureText(ln).width / (width - 120)))
        })
      }
      y += lineHeight * 0.5
    }

    writeBlock("Rose Notes (Partner A)", roseNotesA)
    writeBlock("Rose Notes (Partner B)", roseNotesB)
    writeBlock("Promise A", promiseA ? [promiseA] : [])
    writeBlock("Promise B", promiseB ? [promiseB] : [])

    const url = canvas.toDataURL("image/png")
    const a = document.createElement("a")
    a.href = url
    a.download = "love-letter.png"
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)

    const next = { ...day7, finished: true }
    setDay7(next)
    await saveDay7(next)
  }

  return (
    <div className="relative z-10 min-h-dvh px-4 py-16">
      <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-card/80 p-6 space-y-4 text-center">
        <h2 className="font-serif text-3xl text-foreground">Day 7: Valentine's Day (Feb 14)</h2>
        <p className="text-muted-foreground text-sm">The Grand Door opens.</p>

        <div className="h-48 rounded-xl border border-amber-300 bg-gradient-to-br from-amber-100 to-rose-100 grid place-items-center">
          <p className="font-serif text-2xl text-amber-700">Love Letter</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 text-left">
          <div className="rounded-lg border border-border bg-secondary/30 p-3 text-sm">
            <p className="font-medium mb-2">Rose Notes</p>
            <p className="text-muted-foreground">A:</p>
            <ul className="list-disc pl-5">
              {roseNotesA.map((n, i) => (
                <li key={`a-${i}`}>{n}</li>
              ))}
            </ul>
            <p className="text-muted-foreground mt-2">B:</p>
            <ul className="list-disc pl-5">
              {roseNotesB.map((n, i) => (
                <li key={`b-${i}`}>{n}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-border bg-secondary/30 p-3 text-sm">
            <p className="font-medium mb-2">Promises</p>
            <p className="mb-1">A: {promiseA || "-"}</p>
            <p>B: {promiseB || "-"}</p>
          </div>
        </div>

        <button
          onClick={() => void download()}
          className="rounded-lg bg-primary px-5 py-2 text-primary-foreground"
        >
          Download Love Letter
        </button>
        {day7.finished && <p className="text-green-600 text-sm">Saved. Congratulations!</p>}
      </div>
    </div>
  )
}