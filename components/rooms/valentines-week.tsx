"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { Day1View } from "@/components/rooms/valentines-week/day-1"
import { Day2View } from "@/components/rooms/valentines-week/day-2"
import { Day3View } from "@/components/rooms/valentines-week/day-3"
import { Day4View } from "@/components/rooms/valentines-week/day-4"
import { Day5View } from "@/components/rooms/valentines-week/day-5"
import { Day6View } from "@/components/rooms/valentines-week/day-6"
import { Day7View } from "@/components/rooms/valentines-week/day-7"
import {
  emptyDay1,
  emptyDay2,
  emptyDay3,
  emptyDay4,
  emptyDay5,
  emptyDay6,
  emptyDay7,
  type Day1Data,
  type Day2Data,
  type Day3Data,
  type Day4Data,
  type Day5Data,
  type Day6Data,
  type Day7Data,
  type ValentinesWeekProps,
} from "@/components/rooms/valentines-week/types"

const DAY_LABELS = [
  "Day 1",
  "Day 2",
  "Day 3",
  "Day 4",
  "Day 5",
  "Day 6",
  "Day 7",
]

export default function ValentinesWeek({
  sessionId,
  roomCode,
  role,
  playerName,
  partnerName,
  onDayChanged,
  onWeekFinished,
}: ValentinesWeekProps) {
  const supabase = useMemo(() => createClient(), [])
  const [currentDay, setCurrentDay] = useState(1)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [day1, setDay1] = useState<Day1Data>(emptyDay1)
  const [day2, setDay2] = useState<Day2Data>(emptyDay2)
  const [day3, setDay3] = useState<Day3Data>(emptyDay3)
  const [day4, setDay4] = useState<Day4Data>(emptyDay4)
  const [day5, setDay5] = useState<Day5Data>(emptyDay5)
  const [day6, setDay6] = useState<Day6Data>(emptyDay6)
  const [day7, setDay7] = useState<Day7Data>(emptyDay7)
  const [loading, setLoading] = useState(true)
  const advancingRef = useRef(false)
  const teddyPathRef = useRef<SVGPathElement | null>(null)
  const [partnerOnline, setPartnerOnline] = useState(false)
  const isMountedRef = useRef(true)
  const weekFinishedRef = useRef(false)

  const loadDayState = useCallback(async () => {
    if (!isMountedRef.current) return

    setLoading(true)

    let roomData: { id: string; current_day: number | null; current_stage: number | null } | null = null

    const { data: existingRoom, error: existingRoomError } = await supabase
      .from("rooms")
      .select("id,current_day,current_stage")
      .eq("room_code", roomCode)
      .maybeSingle()

    if (existingRoomError) {
      setLoading(false)
      return
    }

    if (!existingRoom) {
      const { data: insertedRoom, error: insertRoomError } = await supabase
        .from("rooms")
        .insert({ room_code: roomCode, current_day: 1, current_stage: 1 })
        .select("id,current_day,current_stage")
        .single()

      if (insertRoomError || !insertedRoom) {
        setLoading(false)
        return
      }

      roomData = insertedRoom
    } else {
      roomData = existingRoom
      const safeDay = Math.max(1, existingRoom.current_day ?? 1)
      const safeStage = Math.max(1, existingRoom.current_stage ?? 1)
      if (safeDay !== existingRoom.current_day || safeStage !== existingRoom.current_stage) {
        const { data: fixedRoom } = await supabase
          .from("rooms")
          .update({ current_day: safeDay, current_stage: safeStage, updated_at: new Date().toISOString() })
          .eq("id", existingRoom.id)
          .select("id,current_day,current_stage")
          .single()
        if (fixedRoom) roomData = fixedRoom
      }
    }

    if (!roomData) return

    setRoomId(roomData.id)
    const day = Math.max(1, Math.min(7, roomData.current_day ?? roomData.current_stage ?? 1))
    setCurrentDay(day)
    onDayChanged?.(day)

    const { data: progressRows } = await supabase
      .from("room_progress")
      .select("room_name,data")
      .eq("session_id", sessionId)
      .in("room_name", [
        "bedroom_day_1",
        "bedroom_day_2",
        "bedroom_day_3",
        "bedroom_day_4",
        "bedroom_day_5",
        "bedroom_day_6",
        "bedroom_day_7",
      ])

    progressRows?.forEach((row) => {
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
        setDay5({ shownAt: payload.shownAt ?? null, done: payload.done ?? false })
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
        setDay7({ finished: payload.finished ?? false })
      }
    })

    if (isMountedRef.current) {
      setLoading(false)
    }
  }, [supabase, roomCode, sessionId, onDayChanged])

  useEffect(() => {
    if (!sessionId || !roomId) return

    const channel = supabase
      .channel(`bedroom-day-${sessionId}`)
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

          if (row.room_name === "bedroom_day_1") {
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
            setDay5({ shownAt: d.shownAt ?? null, done: d.done ?? false })
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
            setDay7({ finished: d.finished ?? false })
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
          const day = Math.max(1, Math.min(7, updated.current_day ?? updated.current_stage ?? 1))
          setCurrentDay(day)
          onDayChanged?.(day)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId, roomId, supabase, onDayChanged])

  useEffect(() => {
    const presenceChannel = supabase.channel(`bedroom-presence-${sessionId}`, {
      config: { presence: { key: role } },
    })
    const partnerRole = role === "partner_a" ? "partner_b" : "partner_a"

    const hasPartner = () => {
      const state = presenceChannel.presenceState() as Record<string, Array<{ key?: string }>>
      return Object.values(state).some((entries) => entries.some((entry) => entry.key === partnerRole))
    }

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        if (isMountedRef.current) setPartnerOnline(hasPartner())
      })
      .on("presence", { event: "join" }, ({ key }) => {
        if (key === partnerRole && isMountedRef.current) setPartnerOnline(true)
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        if (key === partnerRole && isMountedRef.current) setPartnerOnline(false)
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({ key: role, name: playerName })
          if (isMountedRef.current) setPartnerOnline(hasPartner())
        }
      })

    return () => {
      supabase.removeChannel(presenceChannel)
    }
  }, [supabase, sessionId, role, playerName])

  useEffect(() => {
    isMountedRef.current = true
    const loadTimer = setTimeout(() => {
      if (isMountedRef.current) void loadDayState()
    }, 100)
    return () => {
      clearTimeout(loadTimer)
      isMountedRef.current = false
    }
  }, [loadDayState])

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
      const nextDay = Math.max(1, Math.min(7, targetDay))
      if (nextDay === currentDay) return

      advancingRef.current = true
      await supabase
        .from("rooms")
        .update({ current_day: nextDay, current_stage: nextDay, updated_at: new Date().toISOString() })
        .eq("id", roomId)

      setCurrentDay(nextDay)
      onDayChanged?.(nextDay)
      advancingRef.current = false
    },
    [roomId, currentDay, supabase, onDayChanged]
  )

  const goToPreviousDay = useCallback(() => {
    if (currentDay <= 1) return
    void advanceDay(currentDay - 1)
  }, [currentDay, advanceDay])

  const goToNextDay = useCallback(() => {
    if (currentDay >= 7) return
    void advanceDay(currentDay + 1)
  }, [currentDay, advanceDay])

  useEffect(() => {
    if (currentDay === 1 && day1.accepted) void advanceDay(2)
  }, [currentDay, day1.accepted, advanceDay])

  useEffect(() => {
    if (currentDay === 2 && day2.matched) void advanceDay(3)
  }, [currentDay, day2.matched, advanceDay])

  useEffect(() => {
    if (currentDay === 3 && day3.progress >= 100) void advanceDay(4)
  }, [currentDay, day3.progress, advanceDay])

  useEffect(() => {
    const complete = day4.locked && day4.promiseA.trim().length > 0 && day4.promiseB.trim().length > 0
    if (currentDay === 4 && complete) void advanceDay(5)
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
    if (currentDay === 6 && day6.kissA && day6.kissB) void advanceDay(7)
  }, [currentDay, day6.kissA, day6.kissB, advanceDay])

  useEffect(() => {
    if (currentDay === 7 && day7.finished && !weekFinishedRef.current) {
      weekFinishedRef.current = true
      onWeekFinished?.()
    }
  }, [currentDay, day7.finished, onWeekFinished])

  if (loading) {
    return <div className="relative z-10 min-h-dvh grid place-items-center">Loading...</div>
  }

  const paused = !partnerOnline
  const view = (() => {
    switch (currentDay) {
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
      <div className="mx-auto mb-3 flex w-full max-w-5xl items-center justify-between rounded-xl border border-border bg-background/80 px-3 py-2 backdrop-blur-sm">
        <button
          onClick={goToPreviousDay}
          disabled={currentDay === 1}
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-40 hover:bg-secondary transition-colors"
        >
          Previous day
        </button>
        <p className="text-sm font-medium text-foreground">{DAY_LABELS[currentDay - 1] ?? `Day ${currentDay}`}</p>
        <button
          onClick={goToNextDay}
          disabled={currentDay === 7}
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-40 hover:bg-secondary transition-colors"
        >
          Next day
        </button>
      </div>

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
