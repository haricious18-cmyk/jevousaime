"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Book } from "lucide-react"
import { useGameSync } from "@/hooks/use-game-sync"

interface LibraryRoomProps {
  roomId: string
  role: "partner_a" | "partner_b"
  onComplete: () => void
}

const MATCHES = [
  { id: "1", partnerALabel: "First Date", partnerBLabel: "Paris" },
  { id: "2", partnerALabel: "Our Song", partnerBLabel: "Perfect" },
  { id: "3", partnerALabel: "Our Movie", partnerBLabel: "La La Land" },
  { id: "4", partnerALabel: "Nickname", partnerBLabel: "Love" },
  { id: "5", partnerALabel: "Our Color", partnerBLabel: "Rose Gold" },
  { id: "6", partnerALabel: "Dream Trip", partnerBLabel: "Italy" },
  {
    id: "7",
    partnerALabel: "What ordinary moment together are you secretly dreaming about the most?",
    partnerBLabel: "What ordinary moment together are you secretly dreaming about the most?",
  },
  {
    id: "8",
    partnerALabel: "What's the most ridiculous thing you've done because you missed me?",
    partnerBLabel: "What's the most ridiculous thing you've done because you missed me?",
  },
  {
    id: "9",
    partnerALabel: "When do you feel closest to me despite the distance?",
    partnerBLabel: "When do you feel closest to me despite the distance?",
  },
  {
    id: "10",
    partnerALabel: "How do you think this distance has changed the way we love?",
    partnerBLabel: "How do you think this distance has changed the way we love?",
  },
  {
    id: "11",
    partnerALabel: "What's the first thing you'd do if I were next to you right now?",
    partnerBLabel: "What's the first thing you'd do if I were next to you right now?",
  },
]

export function LibraryRoom({ roomId, role, onComplete }: LibraryRoomProps) {
  const { state, updateLibraryMatch } = useGameSync(roomId, role)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [matchedCount, setMatchedCount] = useState(0)
  const [isShaking, setIsShaking] = useState(false)

  // Count matched items whenever state updates
  useEffect(() => {
    const matchedBooks = Object.values(state.libraryMatches).filter(Boolean).length
    setMatchedCount(matchedBooks)

    if (matchedBooks === MATCHES.length) {
      setTimeout(onComplete, 1000)
    }
  }, [state.libraryMatches, onComplete])

  const handleBookClick = (bookId: string) => {
    if (state.libraryMatches[bookId]) return // Already matched

    if (selectedId === null) {
      setSelectedId(bookId)
    } else if (selectedId === bookId) {
      setSelectedId(null)
    } else {
      // Check if it's a match
      if (selectedId === bookId) {
        updateLibraryMatch(bookId, true)
        setSelectedId(null)
      } else {
        // Failed match
        setIsShaking(true)
        setTimeout(() => setIsShaking(false), 500)
        setSelectedId(null)
      }
    }
  }

  const getBookLabel = (match: typeof MATCHES[0]) => {
    return role === "partner_a" ? match.partnerALabel : match.partnerBLabel
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-cream p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-12">
        <h1 className="font-serif text-5xl text-primary mb-2">
          The Library of Echoes
        </h1>
        <p className="text-gray-600 text-lg mb-6">
          Find the matching pairs that connect your stories together.
        </p>

        {/* Progress Bar */}
        <div className="flex gap-2">
          {MATCHES.map((match) => (
            <motion.div
              key={match.id}
              className={`h-2 flex-1 rounded-full transition-colors ${
                state.libraryMatches[match.id] ? "bg-primary" : "bg-gray-200"
              }`}
              animate={
                selectedId === match.id
                  ? { scale: 1.05 }
                  : { scale: 1 }
              }
            />
          ))}
        </div>
        <p className="text-sm text-gray-600 mt-3">
          Matched: {matchedCount} / {MATCHES.length}
        </p>
      </div>

      {/* Book Grid */}
      <motion.div
        className={`max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 ${
          isShaking ? "animate-pulse" : ""
        }`}
        animate={
          isShaking ? { x: [0, -10, 10, 0] } : { x: 0 }
        }
        transition={{ duration: 0.3 }}
      >
        {MATCHES.map((match) => {
          const isSelected = selectedId === match.id
          const isMatched = state.libraryMatches[match.id]

          return (
            <motion.button
              key={match.id}
              onClick={() => !isMatched && handleBookClick(match.id)}
              disabled={isMatched}
              className="relative h-40 cursor-pointer group"
              whileHover={!isMatched ? { scale: 1.05 } : {}}
              whileTap={!isMatched ? { scale: 0.95 } : {}}
            >
              <motion.div
                className={`absolute inset-0 rounded-lg overflow-hidden shadow-lg transition-all ${
                  isMatched
                    ? "bg-gradient-to-br from-primary to-red-700 text-white"
                    : isSelected
                    ? "bg-gradient-to-br from-secondary to-pink-200 border-2 border-primary"
                    : "bg-gradient-to-br from-cream to-yellow-50 border-2 border-gray-200"
                }`}
                animate={
                  isMatched ? { rotateY: 360 } : {}
                }
                transition={{ duration: 0.6 }}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Book
                      className={`w-8 h-8 mb-2 ${
                        isMatched ? "text-white" : "text-primary"
                      }`}
                    />
                  </motion.div>

                  <p
                    className={`text-sm font-medium text-balance leading-tight ${
                      isMatched ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {getBookLabel(match)}
                  </p>

                  {isMatched && (
                    <motion.p
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs mt-2 text-white font-bold"
                    >
                      ✓ Matched
                    </motion.p>
                  )}
                </div>

                {/* Selected indicator */}
                {isSelected && !isMatched && (
                  <motion.div
                    className="absolute inset-0 border-4 border-primary rounded-lg"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring" }}
                  />
                )}

                {/* Golden glow on match */}
                {isMatched && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-yellow-200/30 to-transparent rounded-lg"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.div>
            </motion.button>
          )
        })}
      </motion.div>

      {/* Completion Message */}
      <AnimatePresence>
        {matchedCount === MATCHES.length && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md"
            >
              <motion.p
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="font-serif text-3xl text-primary mb-2"
              >
                ✨ Perfect Match ✨
              </motion.p>
              <p className="text-gray-600">
                All your echoes are now connected.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
