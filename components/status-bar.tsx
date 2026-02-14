"use client"

import { motion } from "framer-motion"
import { Heart } from "lucide-react"

type StatusBarProps = {
  player1Name: string
  player2Name: string
  loveMeter: number
  currentRoom: string
}

export function StatusBar({ player1Name, player2Name, loveMeter, currentRoom }: StatusBarProps) {
  const roomLabel =
    currentRoom === "library"
      ? "Library of Echoes"
      : currentRoom === "constellation"
        ? "Constellation Canvas"
        : currentRoom === "kintsugi"
          ? "The Golden Repair"
          : currentRoom === "words"
            ? "Words & Wishes"
            : currentRoom === "the_end"
              ? "The End"
            : currentRoom === "hallway"
              ? "The Hallway"
              : ""

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border"
    >
      <div className="flex items-center justify-between px-4 py-2 max-w-3xl mx-auto">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-primary font-medium">{player1Name}</span>
          <Heart className="w-3 h-3 text-primary" fill="hsl(var(--primary))" />
          <span className="text-primary font-medium">{player2Name}</span>
        </div>

        {roomLabel && (
          <span className="text-xs text-muted-foreground hidden sm:block">{roomLabel}</span>
        )}

        <div className="flex items-center gap-2">
          <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${loveMeter}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{loveMeter}%</span>
        </div>
      </div>
    </motion.header>
  )
}
