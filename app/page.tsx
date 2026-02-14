"use client"

import dynamic from "next/dynamic"
import { useEffect, useState, useCallback, useRef } from "react"
import { AnimatePresence } from "framer-motion"
import { Starfield } from "@/components/starfield"
import { FloatingParticles } from "@/components/floating-particles"
import { Lobby } from "@/components/lobby"
import { DoorGatekeeper } from "@/components/door-gatekeeper"
import { RoomSelector } from "@/components/room-selector"
import { StatusBar } from "@/components/status-bar"
import ProgressSteps from "@/components/ui/progress-steps"
import AudioProvider, { useAudio } from "@/components/audio-provider"

// lazy-load heavier room components to reduce initial bundle
const LibraryOfEchoes = dynamic(() => import("@/components/rooms/library-of-echoes").then(m => m.LibraryOfEchoes), { ssr: false })
const ConstellationCanvas = dynamic(() => import("@/components/rooms/constellation-canvas").then(m => m.ConstellationCanvas), { ssr: false })
const KintsugiExperience = dynamic(() => import("@/components/rooms/KintsugiExperience"), { ssr: false })
const WordsAndWishes = dynamic(() => import("@/components/rooms/words-and-wishes"), { ssr: false })
const TheEnd = dynamic(() => import("@/components/rooms/the-end"), { ssr: false })
const Celebration = dynamic(() => import("@/components/rooms/celebration").then(m => m.Celebration), { ssr: false })

import { useSession, type GamePhase } from "@/hooks/use-session"
import { createClient } from "@/lib/supabase/client"

const ROOM_SEQUENCE = ["library", "constellation", "kintsugi", "words"] as const
const ROOM_SET = new Set<string>(ROOM_SEQUENCE)
const VALID_PHASES = new Set<string>([
  function AudioToggle() {
    // lightweight toggle that connects to AudioProvider if present
    try {
      const { muted, setMuted } = useAudio()
      return (
        <button
          onClick={() => setMuted(!muted)}
          aria-pressed={muted}
          className="rounded-full bg-white/10 px-3 py-2 text-sm"
        >
          {muted ? "Unmute" : "Mute"}
        </button>
      )
    } catch {
      return null
    }
  }
  "lobby",
  "waiting",
  "door",
  ...ROOM_SEQUENCE,
  "the_end",
  "celebration",
])

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
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null)
  const supabase = createClient()
  const TOTAL_ROOMS = ROOM_SEQUENCE.length
  const completedRoomSet = new Set(completedRooms)
  const nextUnlockedIndex = ROOM_SEQUENCE.findIndex((room) => !completedRoomSet.has(room))
  const nextUnlockedRoom =
    nextUnlockedIndex === -1 ? null : (ROOM_SEQUENCE[nextUnlockedIndex] as GamePhase)

  useEffect(() => {
    const audio = backgroundAudioRef.current
    if (!audio) return

    audio.volume = 0.7
    void audio.play().catch(() => {})

    const resumePlayback = () => {
      void audio.play().catch(() => {})
    }

    window.addEventListener("pointerdown", resumePlayback, { once: true })
    window.addEventListener("keydown", resumePlayback, { once: true })

    return () => {
      window.removeEventListener("pointerdown", resumePlayback)
      window.removeEventListener("keydown", resumePlayback)
    }
  }, [])

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
        setCompletedRooms(data.map((r) => r.room_name).filter((roomName) => ROOM_SET.has(roomName)))
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
          if (newProgress.completed && ROOM_SET.has(newProgress.room_name)) {
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

      const roomIndex = ROOM_SEQUENCE.indexOf(roomName as (typeof ROOM_SEQUENCE)[number])
      const nextRoom = roomIndex >= 0 && roomIndex < ROOM_SEQUENCE.length - 1 ? ROOM_SEQUENCE[roomIndex + 1] : null

      if (nextCompleted.length >= TOTAL_ROOMS) {
        await setLoveMeter(100)
        await updatePhase("the_end")
        return
      }

      await updateLoveMeter(Math.ceil(100 / TOTAL_ROOMS))
      if (nextRoom) {
        await updatePhase(nextRoom)
      } else {
        await updatePhase("lobby")
      }
    },
    [session?.id, supabase, completedRooms, setLoveMeter, updateLoveMeter, updatePhase, TOTAL_ROOMS, ROOM_SEQUENCE]
  )

  const handleSelectRoom = useCallback(
    async (room: GamePhase) => {
      if (!nextUnlockedRoom) {
        await updatePhase("the_end")
        return
      }
      if (room !== nextUnlockedRoom) return
      await updatePhase(room)
    },
    [nextUnlockedRoom, updatePhase]
  )

  const phase = (session?.current_phase || "lobby") as GamePhase

  useEffect(() => {
    if (session?.current_phase && !VALID_PHASES.has(session.current_phase)) {
      void updatePhase("lobby")
    }
  }, [session?.current_phase, updatePhase])

  useEffect(() => {
    if (!session?.id) return
    if (session.love_meter < 100) return
    if (session.current_phase === "the_end") return
    void updatePhase("the_end")
  }, [session?.id, session?.love_meter, session?.current_phase, updatePhase])

  useEffect(() => {
    if (!session?.id) return
    if (nextUnlockedRoom !== null) return
    if (session.current_phase === "the_end") return
    void setLoveMeter(100)
    void updatePhase("the_end")
  }, [session?.id, session?.current_phase, nextUnlockedRoom, setLoveMeter, updatePhase])

  const goToHallway = useCallback(async () => {
    await updatePhase("lobby")
  }, [updatePhase])

  const player1 = session?.player1_name || ""
  const player2 = session?.player2_name || ""
  const partnerName = isPlayer1 ? player2 : player1

  const isInHallway = !!session && !!session.player2_name && phase === "lobby"
  const showStatusBar =
    !!session && !!session.player2_name && phase !== "waiting" && phase !== "door"
  return (
    <AudioProvider>
      <main className="relative min-h-dvh">
        <audio ref={backgroundAudioRef} src="/music.mp3" loop preload="auto" className="hidden" />
      <Starfield />
      <FloatingParticles count={15} />

        <div className="absolute top-4 right-4 z-50">
          <AudioToggle />
        </div>

      {showStatusBar && (
        <StatusBar
          player1Name={player1}
          player2Name={player2}
          loveMeter={session.love_meter}
          currentRoom={isInHallway ? "hallway" : phase}
        />
      )}

      <AnimatePresence mode="wait">
        <ProgressSteps steps={ROOM_SEQUENCE as unknown as string[]} current={phase} />
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
            unlockedRoomId={nextUnlockedRoom}
            onSelectRoom={handleSelectRoom}
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

        {/* Phase: Words & Wishes */}
        {phase === "words" && session && (
          <WordsAndWishes
            key="words"
            sessionId={session.id}
            role={isPlayer1 ? "partner_a" : "partner_b"}
            playerName={playerName}
            partnerName={partnerName}
            onComplete={() => {
              void completeRoom("words")
            }}
          />
        )}

        {/* Phase: The End */}
        {(phase === "the_end" || phase === "celebration") && session && (
          <TheEnd
            key="the_end"
            player1Name={player1}
            player2Name={player2}
            loveMeter={session.love_meter}
            onComplete={() => updatePhase("celebration")}
          />
        )}
      </AnimatePresence>
    </main>
  )
}
