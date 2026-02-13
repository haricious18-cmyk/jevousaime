"use client"

import { motion } from "framer-motion"
import { Heart } from "lucide-react"

interface StatusBarProps {
  partnerName?: string
  partnerOnline: boolean
  loveMeter: number // 0-100
  roomCode?: string
  stage?: number
}

export function StatusBar({
  partnerName = "Your Partner",
  partnerOnline,
  loveMeter,
  roomCode,
  stage = 0,
}: StatusBarProps) {
  const stageNames = [
    "The Door",
    "The Library",
    "The Heartbeat",
    "The Compass",
    "Celebration",
  ]

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="status-bar shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: Partner Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{
                scale: partnerOnline ? [1, 1.2, 1] : 1,
              }}
              transition={{
                duration: 1.5,
                repeat: partnerOnline ? Infinity : 0,
              }}
              className={`w-3 h-3 rounded-full ${
                partnerOnline ? "bg-primary" : "bg-gray-300"
              }`}
            />
            <span className="text-sm font-medium text-gray-700">
              {partnerName}
            </span>
            <span className="text-xs text-gray-500">
              {partnerOnline ? "Online" : "Offline"}
            </span>
          </div>

          {roomCode && (
            <div className="hidden md:flex items-center gap-2 text-xs text-gray-500 border-l border-gray-200 pl-4">
              <span className="font-mono">Room: {roomCode}</span>
            </div>
          )}
        </div>

        {/* Center: Stage Indicator */}
        <div className="hidden sm:flex items-center gap-3">
          <span className="text-xs font-medium text-gray-600">
            {stageNames[stage] || "Journey"}
          </span>
          <div className="w-32 h-1 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-red-600"
              initial={{ width: 0 }}
              animate={{ width: `${(stage / stageNames.length) * 100}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Right: Love Meter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{
                scale: loveMeter > 0 ? [1, 1.1, 1] : 1,
              }}
              transition={{
                duration: 0.8,
                repeat: loveMeter > 0 ? Infinity : 0,
              }}
            >
              <Heart
                className="w-5 h-5"
                style={{
                  fill: `hsl(358 82% 59%)`,
                  color: `hsl(358 82% 59%)`,
                }}
              />
            </motion.div>

            <div className="flex items-center gap-2">
              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-pink-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${loveMeter}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <span className="text-xs font-medium text-gray-600 w-6">
                {loveMeter}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
