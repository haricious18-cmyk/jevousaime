"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Lock, LockOpen } from "lucide-react"
import { useGameSync } from "@/hooks/use-game-sync"

interface TheDoorProps {
  roomId: string
  role: "partner_a" | "partner_b"
  partnerName: string
  onUnlock: () => void
}

export function TheDoor({ roomId, role, partnerName, onUnlock }: TheDoorProps) {
  const { state, updateDoorInput } = useGameSync(roomId, role)
  const [inputValue, setInputValue] = useState("")
  const [isUnlocked, setIsUnlocked] = useState(false)

  const correctKey = "communication"
  const yourInput = role === "partner_a" ? state.doorInput.partner_a : state.doorInput.partner_b
  const partnerInput = role === "partner_a" ? state.doorInput.partner_b : state.doorInput.partner_a

  const yourCorrect = yourInput.toLowerCase() === correctKey
  const partnerCorrect = partnerInput.toLowerCase() === correctKey
  const bothUnlocked = yourCorrect && partnerCorrect

  useEffect(() => {
    updateDoorInput(inputValue)
  }, [inputValue, updateDoorInput])

  useEffect(() => {
    if (bothUnlocked && !isUnlocked) {
      setIsUnlocked(true)
      setTimeout(onUnlock, 1500)
    }
  }, [bothUnlocked, isUnlocked, onUnlock])

  const doorProgress = (Math.max(yourCorrect ? 50 : 0, partnerCorrect ? 50 : 0))

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 flex flex-col items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {isUnlocked ? (
          <motion.div
            key="unlocked"
            initial={{ opacity: 1, scale: 0.9 }}
            animate={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="flex flex-col items-center gap-6"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 0.9] }}
              transition={{ duration: 0.6 }}
            >
              <LockOpen className="w-16 h-16 text-primary" />
            </motion.div>
            <p className="font-serif text-4xl text-primary text-romantic-glow">
              The key fits perfectly...
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="locked"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-8 max-w-2xl w-full"
          >
            {/* Ornate Door */}
            <motion.div
              animate={{ rotateZ: [0, -2, 2, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="relative"
            >
              <div className="w-40 h-56 rounded-2xl bg-gradient-to-br from-secondary to-cream border-4 border-primary flex flex-col items-center justify-center relative shadow-2xl overflow-hidden romantic-glow">
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Lock className="w-12 h-12 text-primary opacity-60" />
                </motion.div>

                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 rounded-full bg-primary" />
              </div>
            </motion.div>

            {/* Header */}
            <div className="text-center">
              <h1 className="font-serif text-4xl text-primary mb-2">
                The Gatekeeper
              </h1>
              <p className="text-lg text-gray-700 mb-4">
                A door stands before you
              </p>
              <p className="text-sm text-gray-600 italic">
                {state.partnerOnline ? "✓ Partner connected" : "Awaiting your partner..."}
              </p>
            </div>

            {/* Input Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="w-full max-w-md space-y-6"
            >
              {/* Instructions */}
              <div className="bg-cream/50 border-2 border-secondary rounded-lg p-4">
                <p className="text-center text-sm text-gray-700 font-medium">
                  "Find the word that connects you both."
                </p>
                <p className="text-center text-xs text-gray-600 mt-2">
                  Type it together in harmony to unlock the door.
                </p>
              </div>

              {/* Your Input */}
              <div>
                <label className="block text-sm font-serif text-primary mb-2">
                  Your Input
                </label>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type the key word..."
                  className="w-full px-4 py-3 rounded-lg border-2 border-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white text-gray-800 placeholder-gray-400 transition-all"
                />
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: inputValue.length / correctKey.length }}
                  className="mt-2 h-1 bg-primary rounded-full origin-left"
                />
              </div>

              {/* Partner's Input (Read-only) */}
              <div>
                <label className="block text-sm font-serif text-gray-500 mb-2">
                  {partnerName}'s Input
                </label>
                <div className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-gray-50 text-gray-600 flex items-center justify-between">
                  <span className="text-gray-600">{partnerInput || "..."}</span>
                  {partnerCorrect && (
                    <motion.span className="text-primary font-bold">✓</motion.span>
                  )}
                </div>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: partnerInput.length / correctKey.length }}
                  className="mt-2 h-1 bg-gray-300 rounded-full origin-left"
                />
              </div>

              {/* Lock Status */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
                  bothUnlocked
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {bothUnlocked ? (
                  <>
                    <LockOpen className="w-5 h-5" />
                    The door is unlocking...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    {Math.round(doorProgress)}% unlocked
                  </>
                )}
              </motion.div>
            </motion.div>

            {/* Hint */}
            <p className="text-center text-xs text-gray-500 italic mt-4">
              Hint: What is the foundation of every great relationship?
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
