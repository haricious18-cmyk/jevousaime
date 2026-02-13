"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Compass } from "lucide-react"
import { useGameSync } from "@/hooks/use-game-sync"

interface ValuesCompassProps {
  roomId: string
  role: "partner_a" | "partner_b"
  onComplete: () => void
}

const VALUES = [
  { id: "adventure", label: "Adventure", color: "#E63946", angle: 0 },
  { id: "family", label: "Family", color: "#FFB3C7", angle: 120 },
  { id: "security", label: "Security", color: "#FFFDD0", angle: 240 },
]

export function ValuesCompass({
  roomId,
  role,
  onComplete,
}: ValuesCompassProps) {
  const { state, updateCompassSelection } = useGameSync(roomId, role)
  const [selectedValue, setSelectedValue] = useState<string | null>(null)
  const [isLockedIn, setIsLockedIn] = useState(false)
  const [needleAngle, setNeedleAngle] = useState(0)
  const [showReveal, setShowReveal] = useState(false)

  const yourValue =
    role === "partner_a"
      ? state.compassSelections.partner_a
      : state.compassSelections.partner_b
  const partnerValue =
    role === "partner_a"
      ? state.compassSelections.partner_b
      : state.compassSelections.partner_a
  const partnerLockedIn =
    role === "partner_a"
      ? state.compassSelections.partner_b !== null
      : state.compassSelections.partner_a !== null

  // Check if both locked
  useEffect(() => {
    if (isLockedIn && partnerLockedIn && state.compassSelections.both_locked) {
      setTimeout(() => setShowReveal(true), 800)
      setTimeout(onComplete, 3500)
    }
  }, [isLockedIn, partnerLockedIn, state.compassSelections.both_locked, onComplete])

  const handleValueSelect = (value: string, angle: number) => {
    if (!isLockedIn) {
      setSelectedValue(value)
      setNeedleAngle(angle)
      updateCompassSelection(value, false)
    }
  }

  const handleLockIn = () => {
    if (selectedValue && !isLockedIn) {
      setIsLockedIn(true)
      updateCompassSelection(selectedValue, true)
    }
  }

  const selectedLabel = selectedValue
    ? VALUES.find((v) => v.id === selectedValue)?.label
    : null
  const partnerSelectedLabel = partnerValue
    ? VALUES.find((v) => v.id === partnerValue)?.label
    : null
  const overlap = selectedValue === partnerValue

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-cream flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <h1 className="font-serif text-5xl text-center text-primary mb-2">
          The Values Compass
        </h1>
        <p className="text-center text-gray-600 mb-12">
          Where do your hearts truly point?
        </p>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-secondary/30 rounded-lg p-6 mb-12 text-center"
        >
          <p className="text-gray-700 font-medium mb-2">
            Select the value that matters most to you
          </p>
          <p className="text-sm text-gray-600">
            Your partner can't see your choice yet. Choose, then lock in together.
          </p>
        </motion.div>

        {/* Compass Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Your Compass */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col items-center"
          >
            <p className="text-sm font-serif text-primary mb-6">Your Compass</p>

            <div className="relative w-64 h-64 mb-6">
              {/* Compass Rose */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 200 200"
              >
                {/* Background circle */}
                <circle
                  cx="100"
                  cy="100"
                  r="95"
                  fill="#FFFDD0"
                  stroke="#E63946"
                  strokeWidth="2"
                />

                {/* Cardinal directions */}
                <text
                  x="100"
                  y="30"
                  textAnchor="middle"
                  className="fill-gray-600 text-sm font-bold"
                >
                  N
                </text>
                <text
                  x="170"
                  y="105"
                  textAnchor="start"
                  className="fill-gray-600 text-sm font-bold"
                >
                  E
                </text>
                <text
                  x="100"
                  y="180"
                  textAnchor="middle"
                  className="fill-gray-600 text-sm font-bold"
                >
                  S
                </text>
                <text
                  x="30"
                  y="105"
                  textAnchor="end"
                  className="fill-gray-600 text-sm font-bold"
                >
                  W
                </text>

                {/* Cross lines */}
                <line x1="100" y1="20" x2="100" y2="180" stroke="#E63946" strokeWidth="1" opacity="0.3" />
                <line x1="20" y1="100" x2="180" y2="100" stroke="#E63946" strokeWidth="1" opacity="0.3" />
              </svg>

              {/* Value buttons positioned on compass rose */}
              {VALUES.map((value) => {
                const isSelected = selectedValue === value.id
                const rad = (value.angle * Math.PI) / 180
                const x = Math.cos(rad - Math.PI / 2) * 70 + 128
                const y = Math.sin(rad - Math.PI / 2) * 70 + 128

                return (
                  <motion.button
                    key={value.id}
                    onClick={() => handleValueSelect(value.id, value.angle)}
                    disabled={isLockedIn}
                    className="absolute w-16 h-16 rounded-full flex items-center justify-center font-serif font-bold text-white shadow-lg transition-all"
                    style={{
                      left: x - 32,
                      top: y - 32,
                      background: value.color,
                    }}
                    animate={{
                      scale: isSelected ? 1.15 : 1,
                      boxShadow: isSelected
                        ? "0 0 30px rgba(230, 57, 70, 0.5)"
                        : "0 4px 15px rgba(0, 0, 0, 0.1)",
                    }}
                    whileHover={!isLockedIn ? { scale: 1.1 } : {}}
                    whileTap={!isLockedIn ? { scale: 0.95 } : {}}
                  >
                    <span className="text-xs text-center">
                      {value.label}
                    </span>
                  </motion.button>
                )
              })}

              {/* Needle */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{ rotate: needleAngle }}
                transition={{ type: "spring", stiffness: 100 }}
              >
                <div className="w-1 h-20 bg-primary rounded-full absolute bottom-1/2" />
              </motion.div>

              {/* Center point */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-primary shadow-lg" />
              </div>
            </div>

            {/* Selection Display */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              {selectedLabel ? (
                <div>
                  <p className="text-gray-600 text-sm mb-2">Your choice</p>
                  <p className="font-serif text-2xl text-primary mb-4">
                    {selectedLabel}
                  </p>
                  <motion.button
                    onClick={handleLockIn}
                    disabled={isLockedIn}
                    className={`px-8 py-3 rounded-lg font-medium transition-all ${
                      isLockedIn
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-primary text-white hover:shadow-lg"
                    }`}
                    whileHover={!isLockedIn ? { scale: 1.05 } : {}}
                    whileTap={!isLockedIn ? { scale: 0.95 } : {}}
                  >
                    {isLockedIn ? "✓ Locked In" : "Lock In"}
                  </motion.button>
                </div>
              ) : (
                <p className="text-gray-500 italic">Select a value...</p>
              )}
            </motion.div>
          </motion.div>

          {/* Partner's Hidden Choice */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col items-center"
          >
            <p className="text-sm font-serif text-gray-500 mb-6">
              Partner's Compass
            </p>

            <div className="relative w-64 h-64 mb-6">
              {/* Hidden effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-transparent to-gray-100/50 flex items-center justify-center">
                {partnerLockedIn ? (
                  <motion.p
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="font-serif text-2xl text-primary"
                  >
                    ✓
                  </motion.p>
                ) : (
                  <p className="text-gray-500 font-serif text-2xl">?</p>
                )}
              </div>
            </div>

            {/* Partner Status */}
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-2">
                Partner's status
              </p>
              <p
                className={`font-serif text-lg ${
                  partnerLockedIn ? "text-primary" : "text-gray-400"
                }`}
              >
                {partnerLockedIn ? "Locked in" : "Waiting..."}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Reveal Section */}
        <AnimatePresence>
          {showReveal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl p-8 text-center mb-8"
            >
              <p className="text-gray-600 text-sm mb-4">
                Your Values Align At
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-secondary/30 rounded-lg p-4"
                >
                  <p className="text-xs text-gray-500 mb-1">
                    Your Choice
                  </p>
                  <p className="font-serif text-xl text-primary">
                    {selectedLabel}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-secondary/30 rounded-lg p-4"
                >
                  <p className="text-xs text-gray-500 mb-1">
                    Partner's Choice
                  </p>
                  <p className="font-serif text-xl text-primary">
                    {partnerSelectedLabel}
                  </p>
                </motion.div>
              </div>

              {overlap ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-3xl mb-4"
                >
                  💕
                </motion.div>
              ) : null}

              <p
                className={`font-serif text-2xl ${
                  overlap
                    ? "text-primary"
                    : "text-gray-600"
                }`}
              >
                {overlap
                  ? "You share the same priority!"
                  : "Your values beautifully complement each other."}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status Bar */}
        <div className="flex justify-center gap-8">
          <div className="text-center">
            <div
              className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                isLockedIn ? "bg-primary" : "bg-gray-300"
              }`}
            />
            <p className="text-xs text-gray-600">You</p>
          </div>
          <div className="text-center">
            <div
              className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                partnerLockedIn ? "bg-primary" : "bg-gray-300"
              }`}
            />
            <p className="text-xs text-gray-600">Partner</p>
          </div>
        </div>
      </div>
    </div>
  )
}
