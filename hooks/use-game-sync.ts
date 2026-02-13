"use client"

import { useEffect, useCallback, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

export type GameSyncState = {
  roomId: string
  role: "partner_a" | "partner_b"
  partnerOnline: boolean
  doorInput: { partner_a: string; partner_b: string }
  heartbeatState: { partner_a_pressing: boolean; partner_b_pressing: boolean; fill_percentage: number }
  libraryMatches: Record<string, boolean>
  compassSelections: { partner_a: string | null; partner_b: string | null; both_locked: boolean }
  currentStage: number
}

type GameSyncCallbacks = {
  onDoorInputChange?: (state: { partner_a: string; partner_b: string }) => void
  onHeartbeatStateChange?: (state: GameSyncState["heartbeatState"]) => void
  onLibraryMatchChange?: (matches: Record<string, boolean>) => void
  onCompassChange?: (selections: GameSyncState["compassSelections"]) => void
  onStageChange?: (stage: number) => void
  onPartnerStatusChange?: (online: boolean) => void
}

export function useGameSync(
  roomId: string,
  role: "partner_a" | "partner_b",
  callbacks?: GameSyncCallbacks
) {
  const supabase = createClient()
  const [state, setState] = useState<GameSyncState>({
    roomId,
    role,
    partnerOnline: false,
    doorInput: { partner_a: "", partner_b: "" },
    heartbeatState: { partner_a_pressing: false, partner_b_pressing: false, fill_percentage: 0 },
    libraryMatches: {},
    compassSelections: { partner_a: null, partner_b: null, both_locked: false },
    currentStage: 0,
  })

  const channelRef = useRef<RealtimeChannel | null>(null)
  
  // OPTIMIZATION: Store callbacks in a ref so the effect doesn't re-run unnecessarily
  const callbacksRef = useRef(callbacks)
  useEffect(() => {
    callbacksRef.current = callbacks
  }, [callbacks])

  // Initialize Realtime subscription
  useEffect(() => {
    let channel: RealtimeChannel

    const subscribe = async () => {
      // Load initial room state
      const { data: roomData } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single()

      if (roomData) {
        setState(prev => ({ ...prev, currentStage: roomData.current_stage }))
      }

      // Load room metadata
      const { data: metadataData } = await supabase
        .from("room_metadata")
        .select("*")
        .eq("room_id", roomId)
        .single()

      if (metadataData) {
        setState(prev => ({
          ...prev,
          doorInput: metadataData.door_state,
          heartbeatState: metadataData.heartbeat_state,
          libraryMatches: metadataData.library_matches,
          compassSelections: metadataData.compass_selections,
        }))
      }

      // Subscribe to room changes
      channel = supabase
        .channel(`room:${roomId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "rooms",
            filter: `id=eq.${roomId}`,
          },
          (payload) => {
            if (payload.eventType === "UPDATE") {
              setState(prev => ({
                ...prev,
                currentStage: payload.new.current_stage,
              }))
              callbacksRef.current?.onStageChange?.(payload.new.current_stage)
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "room_metadata",
            filter: `room_id=eq.${roomId}`,
          },
          (payload) => {
            if (payload.eventType === "UPDATE") {
              const metadata = payload.new
              setState(prev => ({
                ...prev,
                doorInput: metadata.door_state,
                heartbeatState: metadata.heartbeat_state,
                libraryMatches: metadata.library_matches,
                compassSelections: metadata.compass_selections,
              }))

              callbacksRef.current?.onDoorInputChange?.(metadata.door_state)
              callbacksRef.current?.onHeartbeatStateChange?.(metadata.heartbeat_state)
              callbacksRef.current?.onLibraryMatchChange?.(metadata.library_matches)
              callbacksRef.current?.onCompassChange?.(metadata.compass_selections)
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "room_users",
            filter: `room_id=eq.${roomId}`,
          },
          async (payload) => { // <-- FIX: Added 'async' here to allow 'await' inside
            // Check if partner is online
            const { data: users } = await supabase
              .from("room_users")
              .select("*")
              .eq("room_id", roomId)
              .neq("role", role)

            const partnerOnline = users && users.length > 0 && users[0].is_online
            setState(prev => ({ ...prev, partnerOnline: partnerOnline || false }))
            callbacksRef.current?.onPartnerStatusChange?.(partnerOnline || false)
          }
        )
        .subscribe()

      channelRef.current = channel
    }

    subscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [roomId, role, supabase]) // Removed 'callbacks' from here to prevent infinite reconnects

  // Update door input
  const updateDoorInput = useCallback(
    async (input: string) => {
      setState(prev => ({
        ...prev,
        doorInput: {
          ...prev.doorInput,
          [role === "partner_a" ? "partner_a" : "partner_b"]: input,
        },
      }))

      // Update in Supabase
      const { data: existing } = await supabase
        .from("room_metadata")
        .select("*")
        .eq("room_id", roomId)
        .single()

      if (existing) {
        await supabase
          .from("room_metadata")
          .update({
            door_state: {
              ...existing.door_state,
              [role === "partner_a" ? "partner_a" : "partner_b"]: input,
            },
          })
          .eq("room_id", roomId)
      }
    },
    [roomId, role, supabase]
  )

  // Update heartbeat pressing state
  const updateHeartbeatState = useCallback(
    async (isPressing: boolean, fillPercentage: number = 0) => {
      setState(prev => ({
        ...prev,
        heartbeatState: {
          ...prev.heartbeatState,
          [role === "partner_a" ? "partner_a_pressing" : "partner_b_pressing"]: isPressing,
          fill_percentage:
            isPressing && prev.heartbeatState[role === "partner_a" ? "partner_b_pressing" : "partner_a_pressing"]
              ? fillPercentage
              : 0,
        },
      }))

      const { data: existing } = await supabase
        .from("room_metadata")
        .select("*")
        .eq("room_id", roomId)
        .single()

      if (existing) {
        await supabase
          .from("room_metadata")
          .update({
            heartbeat_state: {
              ...existing.heartbeat_state,
              [role === "partner_a" ? "partner_a_pressing" : "partner_b_pressing"]: isPressing,
            },
          })
          .eq("room_id", roomId)
      }
    },
    [roomId, role, supabase]
  )

  // Update library match
  const updateLibraryMatch = useCallback(
    async (matchId: string, isMatched: boolean) => {
      setState(prev => ({
        ...prev,
        libraryMatches: {
          ...prev.libraryMatches,
          [matchId]: isMatched,
        },
      }))

      const { data: existing } = await supabase
        .from("room_metadata")
        .select("*")
        .eq("room_id", roomId)
        .single()

      if (existing) {
        await supabase
          .from("room_metadata")
          .update({
            library_matches: {
              ...existing.library_matches,
              [matchId]: isMatched,
            },
          })
          .eq("room_id", roomId)
      }
    },
    [roomId, supabase]
  )

  // Update compass selection
  const updateCompassSelection = useCallback(
    async (value: string | null, lockIn: boolean = false) => {
      setState(prev => ({
        ...prev,
        compassSelections: {
          ...prev.compassSelections,
          [role === "partner_a" ? "partner_a" : "partner_b"]: value,
          both_locked: lockIn && 
            (role === "partner_a" 
              ? prev.compassSelections.partner_b !== null
              : prev.compassSelections.partner_a !== null),
        },
      }))

      const { data: existing } = await supabase
        .from("room_metadata")
        .select("*")
        .eq("room_id", roomId)
        .single()

      if (existing) {
        await supabase
          .from("room_metadata")
          .update({
            compass_selections: {
              ...existing.compass_selections,
              [role === "partner_a" ? "partner_a" : "partner_b"]: value,
              both_locked:
                lockIn && existing.compass_selections[role === "partner_a" ? "partner_b" : "partner_a"] !== null,
            },
          })
          .eq("room_id", roomId)
      }
    },
    [roomId, role, supabase]
  )

  // Advance stage
  const advanceStage = useCallback(async () => {
    await supabase
      .from("rooms")
      .update({ current_stage: state.currentStage + 1 })
      .eq("id", roomId)
  }, [roomId, state.currentStage, supabase])

  // Update love meter
  const updateLoveMeter = useCallback(
    async (amount: number) => {
      const { data } = await supabase.from("rooms").select("love_meter").eq("id", roomId).single()

      if (data) {
        await supabase
          .from("rooms")
          .update({ love_meter: Math.min(100, data.love_meter + amount) })
          .eq("id", roomId)
      }
    },
    [roomId, supabase]
  )

  return {
    state,
    updateDoorInput,
    updateHeartbeatState,
    updateLibraryMatch,
    updateCompassSelection,
    advanceStage,
    updateLoveMeter,
  }
}