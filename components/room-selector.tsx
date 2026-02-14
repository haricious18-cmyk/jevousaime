"use client"

import { motion } from "framer-motion"
import { BookOpen, Stars, Check, Sparkles, PenLine } from "lucide-react"
import type { GamePhase } from "@/hooks/use-session"

type RoomSelectorProps = {
  completedRooms: string[]
  unlockedRoomId: GamePhase | null
  onSelectRoom: (phase: GamePhase) => void
  hiddenRooms?: string[]
}

const rooms = [
  {
    id: "library" as GamePhase,
    name: "Library of Echoes",
    description: "Answer intimate questions together and discover shared truths.",
    icon: BookOpen,
    color: "text-primary",
    bg: "bg-primary/10",
    borderColor: "border-primary/30",
  },
  {
    id: "constellation" as GamePhase,
    name: "Constellation Canvas",
    description: "Place stars in the night sky and name your own constellation.",
    icon: Stars,
    color: "text-accent",
    bg: "bg-accent/10",
    borderColor: "border-accent/30",
  },
  {
    id: "kintsugi" as GamePhase,
    name: "The Golden Repair",
    description: "Heal the cracks together and turn distance into gold.",
    icon: Sparkles,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    borderColor: "border-amber-400/30",
  },
  {
    id: "words" as GamePhase,
    name: "Words & Wishes",
    description: "Write from your heart and reveal your partner's letter when time is up.",
    icon: PenLine,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    borderColor: "border-rose-500/30",
  },
]

export function RoomSelector({ completedRooms, unlockedRoomId, onSelectRoom }: RoomSelectorProps) {
  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-dvh px-4 pt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full"
      >
        <div className="text-center mb-8">
          <h2 className="font-serif text-3xl text-foreground text-glow mb-2">The Hallway</h2>
          <p className="text-muted-foreground">Choose a room to explore together.</p>
        </div>

        <div className="flex flex-col gap-4">
          {(() => {
            const hiddenSet = new Set(hiddenRooms ?? [])
            const visibleRooms = rooms.filter((r) => !hiddenSet.has(r.id))
            return visibleRooms.map((room, i) => {
            const isCompleted = completedRooms.includes(room.id)
            const isLocked = !isCompleted && unlockedRoomId !== room.id
            const Icon = room.icon

            return (
              <motion.button
                key={room.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
                onClick={() => onSelectRoom(room.id)}
                disabled={isCompleted || isLocked}
                className={`flex items-start gap-4 p-5 rounded-xl border ${room.borderColor} ${room.bg} text-left transition-all hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100`}
              >
                <div className={`p-3 rounded-lg ${room.bg} ${room.color} shrink-0`}>
                  {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className={`font-serif text-xl ${room.color} mb-1`}>
                    {room.name}
                    {isCompleted && (
                      <span className="text-sm text-muted-foreground ml-2 font-sans">Completed</span>
                    )}
                    {isLocked && (
                      <span className="text-sm text-muted-foreground ml-2 font-sans">Locked</span>
                    )}
                  </h3>
                  <p className="text-muted-foreground text-sm">{room.description}</p>
                </div>
              </motion.button>
            )
          })
          })()}
        </div>
      </motion.div>
    </div>
  )
}
