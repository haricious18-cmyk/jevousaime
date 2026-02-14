"use client"

import { useEffect, useState, useCallback } from "react"
import { AnimatePresence } from "framer-motion"
import { Starfield } from "@/components/starfield"
import { FloatingParticles } from "@/components/floating-particles"
import { Lobby } from "@/components/lobby"
import { DoorGatekeeper } from "@/components/door-gatekeeper"
import { RoomSelector } from "@/components/room-selector"
import { StatusBar } from "@/components/status-bar"
import { Celebration } from "@/components/celebration"
import { LibraryOfEchoes } from "@/components/rooms/library-of-echoes"
import { ConstellationCanvas } from "@/components/rooms/constellation-canvas"
import KintsugiExperience from "@/components/rooms/KintsugiExperience"
import ValentinesWeek from "@/components/rooms/valentines-week"
import WordsAndWishes from "@/components/rooms/words-and-wishes"
import { useSession, type GamePhase } from "@/hooks/use-session"
import { createClient } from "@/lib/supabase/client"

const ROOM_NAV_ORDER: GamePhase[] = ["library", "constellation", "kintsugi", "bedroom", "words"]

export default function Home() {
  const {
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
  } = useSession()

  const [completedRooms, setCompletedRooms] = useState<string[]>([])
  const supabase = createClient()
  const TOTAL_ROOMS = 3

  // Load completed rooms from DB
  useEffect(() => {
    if (!session?.id) return

    async function loadProgress() {
      const { data } = await supabase
        .from("room_progress")
        .select("room_name")
        .eq("session_id", session!.id)
        .eq("completed", true)

      if (data) {
        setCompletedRooms(data.map((r) => r.room_name))
      }
    }

    loadProgress()

    const channel = supabase
      .channel(`progress-${session.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "room_progress",
          filter: `session_id=eq.${session.id}`,
        },
        (payload) => {
          const newProgress = payload.new as { room_name: string; completed: boolean }
          if (newProgress.completed) {
            setCompletedRooms((prev) =>
              prev.includes(newProgress.room_name) ? prev : [...prev, newProgress.room_name]
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session?.id, supabase])

  const completeRoom = useCallback(
    async (roomName: string) => {
      if (!session?.id) return
      await supabase.from("room_progress").insert({
        session_id: session.id,
        room_name: roomName,
        completed: true,
        completed_at: new Date().toISOString(),
      })
      const nextCompleted = completedRooms.includes(roomName)
        ? completedRooms
        : [...completedRooms, roomName]

      if (nextCompleted.length >= TOTAL_ROOMS) {
        await setLoveMeter(0)
        await updatePhase("bedroom")
        return
      }

      await updateLoveMeter(Math.ceil(100 / TOTAL_ROOMS))
      await updatePhase("lobby")
    },
    [session?.id, supabase, completedRooms, setLoveMeter, updateLoveMeter, updatePhase, TOTAL_ROOMS]
  )

  const phase = (session?.current_phase || "lobby") as GamePhase

  useEffect(() => {
    if (phase !== "bedroom") return
    if (!session) return
    if (session.love_meter !== 0) {
      void setLoveMeter(0)
    }
  }, [phase, session, setLoveMeter])

  const goToHallway = useCallback(async () => {
    await updatePhase("lobby")
  }, [updatePhase])

  const player1 = session?.player1_name || ""
  const player2 = session?.player2_name || ""
  const partnerName = isPlayer1 ? player2 : player1

  const isInHallway = !!session && !!session.player2_name && phase === "lobby"
  const showStatusBar =
    !!session && !!session.player2_name && phase !== "waiting" && phase !== "door"
  const currentRoomIndex = ROOM_NAV_ORDER.indexOf(phase)
  const canNavigateRooms = currentRoomIndex !== -1

  const goToPreviousRoom = useCallback(async () => {
    if (currentRoomIndex <= 0) return
    await updatePhase(ROOM_NAV_ORDER[currentRoomIndex - 1])
  }, [currentRoomIndex, updatePhase])

  const goToNextRoom = useCallback(async () => {
    if (currentRoomIndex < 0 || currentRoomIndex >= ROOM_NAV_ORDER.length - 1) return
    await updatePhase(ROOM_NAV_ORDER[currentRoomIndex + 1])
  }, [currentRoomIndex, updatePhase])

  return (
    <main className="relative min-h-dvh">
      <Starfield />
      <FloatingParticles count={15} />

      {showStatusBar && (
        <StatusBar
          player1Name={player1}
          player2Name={player2}
          loveMeter={session.love_meter}
          currentRoom={isInHallway ? "hallway" : phase}
        />
      )}

      {showStatusBar && canNavigateRooms && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-full border border-border bg-background/85 px-2 py-2 backdrop-blur-md shadow-lg">
            <button
              onClick={() => void goToPreviousRoom()}
              disabled={currentRoomIndex === 0}
              className="rounded-full border border-border px-4 py-2 text-sm text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-secondary transition-colors"
            >
              Previous room
            </button>
            <button
              onClick={() => void goToNextRoom()}
              disabled={currentRoomIndex === ROOM_NAV_ORDER.length - 1}
              className="rounded-full border border-border px-4 py-2 text-sm text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-secondary transition-colors"
            >
              Next room
            </button>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Phase: Lobby / Waiting */}
        {(!session || phase === "waiting") && (
          <Lobby
            key="lobby"
            onCreateSession={createSession}
            onJoinSession={joinSession}
            session={session}
            loading={loading}
            error={error}
          />
        )}

        {/* Phase: Door Gatekeeper */}
        {phase === "door" && session && (
          <DoorGatekeeper
            key="door"
            player1Name={player1}
            player2Name={player2}
            onEnter={() => updatePhase("lobby")}
          />
        )}

        {/* Phase: Hallway / Room Selection */}
        {isInHallway && (
          <RoomSelector
            key="hallway"
            completedRooms={completedRooms}
            onSelectRoom={(room) => updatePhase(room)}
          />
        )}

        {/* Phase: Library of Echoes */}
        {phase === "library" && session && (
          <LibraryOfEchoes
            key="library"
            sessionId={session.id}
            playerName={playerName}
            partnerName={partnerName}
            onComplete={() => completeRoom("library")}
            onBack={goToHallway}
          />
        )}

        {/* Phase: Constellation Canvas */}
        {phase === "constellation" && session && (
          <ConstellationCanvas
            key="constellation"
            sessionId={session.id}
            playerName={playerName}
            partnerName={partnerName}
            onComplete={() => completeRoom("constellation")}
            onBack={goToHallway}
          />
        )}

        {/* Phase: Kintsugi Experience */}
        {phase === "kintsugi" && session && (
          <KintsugiExperience
            key="kintsugi"
            sessionId={session.id}
            role={isPlayer1 ? "partner_a" : "partner_b"}
            playerName={playerName}
            partnerName={partnerName}
            onBack={goToHallway}
            onComplete={() => completeRoom("kintsugi")}
          />
        )}

        {/* Phase: Bedroom / Valentine's Week */}
        {phase === "bedroom" && session && (
          <ValentinesWeek
            key="bedroom-week"
            sessionId={session.id}
            roomCode={session.room_code}
            role={isPlayer1 ? "partner_a" : "partner_b"}
            playerName={playerName}
            partnerName={partnerName}
            onDayChanged={(day) => {
              void setLoveMeter(Math.round((day / 7) * 100))
            }}
            onWeekFinished={() => {
              void updatePhase("words")
            }}
          />
        )}

        {/* Phase: Words & Wishes */}
        {phase === "words" && session && (
          <WordsAndWishes
            key="words"
            onComplete={() => {
              void updatePhase("celebration")
            }}
          />
        )}

        {/* Phase: Celebration */}
        {phase === "celebration" && session && (
          <Celebration
            key="celebration"
            player1Name={player1}
            player2Name={player2}
            loveMeter={session.love_meter}
          />
        )}
      </AnimatePresence>
    </main>
  )
}
