"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useGameSync } from "@/hooks/use-game-sync"

interface HeartSyncProps {
  roomId: string
  role: "partner_a" | "partner_b"
  onComplete: () => void
}

export function HeartSync({ roomId, role, onComplete }: HeartSyncProps) {
  const { state, updateHeartbeatState } = useGameSync(roomId, role)
  const [isPressing, setIsPressing] = useState(false)
  const [fillPercentage, setFillPercentage] = useState(0)
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null)
  const fillIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const bothPressing = isPressing && state.heartbeatState.partner_b_pressing
  const targetFillTime = 10000 // 10 seconds

  // Update heart sync state in Supabase
  useEffect(() => {
    updateHeartbeatState(isPressing, fillPercentage)
  }, [isPressing, fillPercentage, updateHeartbeatState])

  // Handle fill progress
  useEffect(() => {
    if (!bothPressing) {
      if (fillPercentage > 0) {
        // Decrease fill when not both pressing
        fillIntervalRef.current = setInterval(() => {
          setFillPercentage(prev => Math.max(0, prev - 2))
        }, 100)
      }
      if (sessionStartTime !== null) {
        setSessionStartTime(null)
      }
      return () => {
        if (fillIntervalRef.current) clearInterval(fillIntervalRef.current)
      }
    }

    // Both pressing - increase fill
    if (sessionStartTime === null) {
      setSessionStartTime(Date.now())
    }

    const startTime = sessionStartTime || Date.now()
    fillIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const percentage = Math.min(100, (elapsed / targetFillTime) * 100)
      setFillPercentage(percentage)

      if (percentage >= 100) {
        clearInterval(fillIntervalRef.current!)
        setTimeout(onComplete, 1500)
      }
    }, 50)

    return () => {
      if (fillIntervalRef.current) clearInterval(fillIntervalRef.current)
    }
  }, [bothPressing, sessionStartTime, fillPercentage, onComplete])

  const handleMouseDown = () => setIsPressing(true)
  const handleMouseUp = () => setIsPressing(false)
  const handleTouchStart = () => setIsPressing(true)
  const handleTouchEnd = () => setIsPressing(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-secondary flex flex-col items-center justify-center p-4 touch-none">
      <div className="max-w-md w-full">
        {/* Title */}
        <h1 className="font-serif text-5xl text-center text-primary mb-2">
          The Heartbeat
        </h1>
        <p className="text-center text-gray-600 mb-12">
          Beat together in perfect rhythm
        </p>

        {/* Connection Status */}
        <div className="grid grid-cols-2 gap-4 mb-12">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: isPressing ? 1.1 : 1 }}
            className="text-center p-4 rounded-lg bg-white/50 backdrop-blur-sm"
          >
            <div
              className={`inline-block w-3 h-3 rounded-full mb-2 transition-colors ${
                isPressing ? "bg-primary" : "bg-gray-300"
              }`}
            />
            <p className="text-sm font-medium text-gray-700">You</p>
            <p className="text-xs text-gray-500">
              {isPressing ? "Pressing" : "Ready"}
            </p>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: state.heartbeatState.partner_b_pressing ? 1.1 : 1 }}
            className="text-center p-4 rounded-lg bg-white/50 backdrop-blur-sm"
          >
            <div
              className={`inline-block w-3 h-3 rounded-full mb-2 transition-colors ${
                state.heartbeatState.partner_b_pressing ? "bg-primary" : "bg-gray-300"
              }`}
            />
            <p className="text-sm font-medium text-gray-700">Partner</p>
            <p className="text-xs text-gray-500">
              {state.heartbeatState.partner_b_pressing ? "Pressing" : "Waiting"}
            </p>
          </motion.div>
        </div>

        {/* Heart SVG Container */}
        <motion.div
          className="relative flex items-center justify-center mb-12 cursor-pointer select-none"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          animate={{
            scale: isPressing ? 1.1 : 1,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <svg
            width="300"
            height="300"
            viewBox="0 0 300 300"
            className="drop-shadow-lg"
          >
            {/* Background heart */}
            <path
              d="M150,270 C60,220 30,170 30,120 C30,80 60,50 95,50 C115,50 135,60 150,75 C165,60 185,50 205,50 C240,50 270,80 270,120 C270,170 240,220 150,270 Z"
              fill="none"
              stroke="hsl(352 100% 88%)"
              strokeWidth="2"
            />

            {/* Filled heart (clipped by percentage) */}
            <defs>
              <clipPath id="heartClip">
                <rect
                  x="30"
                  y={270 - (240 * fillPercentage) / 100}
                  width="240"
                  height={(240 * fillPercentage) / 100}
                />
              </clipPath>
            </defs>

            <path
              d="M150,270 C60,220 30,170 30,120 C30,80 60,50 95,50 C115,50 135,60 150,75 C165,60 185,50 205,50 C240,50 270,80 270,120 C270,170 240,220 150,270 Z"
              fill="hsl(358 82% 59%)"
              clipPath="url(#heartClip)"
            />

            {/* Heart outline */}
            <path
              d="M150,270 C60,220 30,170 30,120 C30,80 60,50 95,50 C115,50 135,60 150,75 C165,60 185,50 205,50 C240,50 270,80 270,120 C270,170 240,220 150,270 Z"
              fill="none"
              stroke="hsl(358 82% 59%)"
              strokeWidth="3"
            />
          </svg>

          {/* Percentage Display */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{
              duration: bothPressing ? 0.5 : 1,
              repeat: Infinity,
            }}
          >
            <span className="font-serif text-4xl font-bold text-primary">
              {Math.round(fillPercentage)}%
            </span>
          </motion.div>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/70 backdrop-blur-sm rounded-lg p-6 text-center"
        >
          <p className="text-gray-700 font-medium mb-2">
            Press and hold together
          </p>
          <p className="text-sm text-gray-600">
            Keep your hearts synchronized for the heart to fill completely. Release to reset.
          </p>
        </motion.div>

        {/* Success Animation */}
        <AnimatePresence>
          {fillPercentage >= 100 && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm pointer-events-none"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 1 }}
                className="font-serif text-6xl"
              >
                💗
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
