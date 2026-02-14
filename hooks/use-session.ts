"use client"

import { useEffect, useCallback, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

export type Session = {
  id: string
  room_code: string
  player1_name: string | null
  player2_name: string | null
  current_phase: string
  love_meter: number
  created_at: string
  updated_at: string
}

export type GamePhase =
  | "lobby"
  | "waiting"
  | "door"
  | "library"
  | "constellation"
  | "kintsugi"
  | "words"
  | "the_end"
  | "celebration"

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [playerName, setPlayerName] = useState<string>("")
  const [isPlayer1, setIsPlayer1] = useState<boolean>(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  const createSession = useCallback(
    async (name: string) => {
      setLoading(true)
      setError(null)
      try {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase()
        const { data, error: dbError } = await supabase
          .from("sessions")
          .insert({ room_code: code, player1_name: name, current_phase: "waiting" })
          .select()
          .single()

        if (dbError) throw dbError
        setSession(data)
        setPlayerName(name)
        setIsPlayer1(true)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to create session")
      } finally {
        setLoading(false)
      }
    },
    [supabase]
  )

  const joinSession = useCallback(
    async (code: string, name: string) => {
      setLoading(true)
      setError(null)
      try {
        const { data: existing, error: findError } = await supabase
          .from("sessions")
          .select()
          .eq("room_code", code.toUpperCase())
          .single()

        if (findError || !existing) throw new Error("Room not found")
        if (existing.player2_name) throw new Error("Room is full")

        const { data, error: updateError } = await supabase
          .from("sessions")
          .update({ player2_name: name, current_phase: "door" })
          .eq("id", existing.id)
          .select()
          .single()

        if (updateError) throw updateError
        setSession(data)
        setPlayerName(name)
        setIsPlayer1(false)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to join session")
      } finally {
        setLoading(false)
      }
    },
    [supabase]
  )

  const updatePhase = useCallback(
    async (phase: GamePhase) => {
      if (!session) return

      const { data, error: updateError } = await supabase
        .from("sessions")
        .update({ current_phase: phase, updated_at: new Date().toISOString() })
        .eq("id", session.id)
        .select()
        .single()

      if (!updateError && data) setSession(data)
    },
    [session, supabase]
  )

  const updateLoveMeter = useCallback(
    async (increment: number) => {
      if (!session) return
      const newVal = Math.min(100, session.love_meter + increment)
      const { data, error: updateError } = await supabase
        .from("sessions")
        .update({ love_meter: newVal, updated_at: new Date().toISOString() })
        .eq("id", session.id)
        .select()
        .single()

      if (!updateError && data) setSession(data)
    },
    [session, supabase]
  )

  const setLoveMeter = useCallback(
    async (value: number) => {
      if (!session) return
      const clamped = Math.max(0, Math.min(100, Math.round(value)))
      if (clamped === session.love_meter) return
      const { data, error: updateError } = await supabase
        .from("sessions")
        .update({ love_meter: clamped, updated_at: new Date().toISOString() })
        .eq("id", session.id)
        .select()
        .single()

      if (!updateError && data) setSession(data)
    },
    [session, supabase]
  )

  const refreshSession = useCallback(
    async (sessionId: string) => {
      const { data, error: fetchError } = await supabase
        .from("sessions")
        .select()
        .eq("id", sessionId)
        .single()

      if (!fetchError && data) {
        setSession((prev) => {
          if (
            prev &&
            prev.id === data.id &&
            prev.current_phase === data.current_phase &&
            prev.player2_name === data.player2_name &&
            prev.updated_at === data.updated_at &&
            prev.love_meter === data.love_meter
          ) {
            return prev
          }
          return data
        })
      }
    },
    [supabase]
  )

  // Subscribe to session changes via Realtime
  useEffect(() => {
    if (!session?.id) return

    let channel: RealtimeChannel

    channel = supabase
      .channel(`session-${session.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sessions", filter: `id=eq.${session.id}` },
        (payload) => {
          setSession(payload.new as Session)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session?.id, supabase])

  // Fallback polling while waiting for partner in case Realtime is unavailable.
  useEffect(() => {
    if (!session?.id) return

    const shouldPoll = session.current_phase === "waiting" || !session.player2_name
    if (!shouldPoll) return

    const sessionId = session.id
    void refreshSession(sessionId)

    const interval = setInterval(() => {
      void refreshSession(sessionId)
    }, 1500)

    return () => clearInterval(interval)
  }, [session?.id, session?.current_phase, session?.player2_name, refreshSession])

  return {
    session,
    playerName,
    isPlayer1,
    loading,
    error,
    createSession,
    joinSession,
    updatePhase,
    updateLoveMeter,
    setLoveMeter,
  }
}
