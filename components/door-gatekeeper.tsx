"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { DoorOpen } from "lucide-react"

type DoorGatekeeperProps = {
  player1Name: string
  player2Name: string
  onEnter: () => void
}

export function DoorGatekeeper({ player1Name, player2Name, onEnter }: DoorGatekeeperProps) {
  const [doorOpen, setDoorOpen] = useState(false)
  const [entered, setEntered] = useState(false)
  const [keyInput, setKeyInput] = useState("")
  const [error, setError] = useState<string | null>(null)

  const SECRET_KEY = "communication"

  const handleUnlock = () => {
    const normalized = keyInput.trim().toLowerCase()
    if (normalized === SECRET_KEY) {
      setError(null)
      setDoorOpen(true)
      setTimeout(() => {
        handleEnter()
      }, 900)
      return
    }
    setError("That key doesn't fit. Follow the hints and try again.")
  }

  const handleEnter = () => {
    setEntered(true)
    setTimeout(onEnter, 1200)
  }

  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-dvh px-4">
      <AnimatePresence mode="wait">
        {entered ? (
          <motion.div
            key="entering"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="flex flex-col items-center gap-6"
          >
            <p className="font-serif text-3xl text-foreground text-glow">
              Welcome inside...
            </p>
          </motion.div>
        ) : !doorOpen ? (
          <motion.div
            key="closed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-8 max-w-md w-full"
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <div className="w-32 h-48 rounded-t-[4rem] bg-secondary border-2 border-border flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
                <div className="w-3 h-3 rounded-full bg-accent absolute right-6 top-1/2" />
              </div>
            </motion.div>

            <div className="text-center">
              <h2 className="font-serif text-3xl text-foreground text-glow mb-2">
                A door stands before you
              </h2>
              <p className="text-muted-foreground">
                {player1Name} and {player2Name} have arrived.
              </p>
            </div>

            <div className="w-full rounded-xl border border-border bg-card/70 backdrop-blur-sm p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Hints</p>
              <p className="text-sm text-foreground/90">
                The key is what keeps a long-distance relationship alive.
              </p>
              <p className="text-sm text-foreground/90">
                It starts with <span className="font-mono">c</span> and means open, honest connection.
              </p>

              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                  placeholder="Enter the key word..."
                  className="flex-1 px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                  autoFocus
                />
                <button
                  onClick={handleUnlock}
                  disabled={!keyInput.trim()}
                  className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50"
                >
                  Unlock
                </button>
              </div>
              {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="open"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-8 max-w-md w-full"
          >
            <motion.div
              initial={{ rotateY: -90 }}
              animate={{ rotateY: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ perspective: 1000 }}
            >
              <DoorOpen className="w-24 h-24 text-accent" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <p className="font-serif text-2xl text-foreground text-glow-amber mb-2">
                {"\"Ah, I've been expecting you two.\""}
              </p>
              <p className="text-muted-foreground text-sm italic mb-4">
                {"\"Beyond this door lie three rooms, each one a world built for the two of you. Complete them all and something wonderful awaits.\""}
              </p>
            </motion.div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              onClick={handleEnter}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-lg bg-accent text-accent-foreground font-medium text-lg box-glow-amber"
            >
              Step inside together
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
