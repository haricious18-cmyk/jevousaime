"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Heart, Copy, Check } from "lucide-react"
import type { Session } from "@/hooks/use-session"

type LobbyProps = {
  onCreateSession: (name: string) => Promise<void>
  onJoinSession: (code: string, name: string) => Promise<void>
  session: Session | null
  loading: boolean
  error: string | null
}

export function Lobby({ onCreateSession, onJoinSession, session, loading, error }: LobbyProps) {
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose")
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [copied, setCopied] = useState(false)

  const isWaiting = session?.current_phase === "waiting"

  const handleCreate = async () => {
    if (!name.trim()) return
    await onCreateSession(name.trim())
  }

  const handleJoin = async () => {
    if (!name.trim() || !code.trim()) return
    await onJoinSession(code.trim(), name.trim())
  }

  const copyCode = async () => {
    if (!session?.room_code) return
    await navigator.clipboard.writeText(session.room_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-dvh px-4">
      <AnimatePresence mode="wait">
        {isWaiting ? (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-8 max-w-md w-full"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Heart className="w-12 h-12 text-primary" fill="hsl(var(--primary))" />
            </motion.div>
            <h2 className="font-serif text-3xl text-center text-foreground">
              Waiting for your partner...
            </h2>
            <div className="flex flex-col items-center gap-3">
              <p className="text-muted-foreground text-sm">Share this room code:</p>
              <button
                onClick={copyCode}
                className="flex items-center gap-3 bg-secondary px-6 py-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                <span className="font-mono text-2xl tracking-[0.3em] text-foreground">
                  {session?.room_code}
                </span>
                {copied ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : (
                  <Copy className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
              <span className="text-muted-foreground text-sm">Listening for connection...</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="lobby"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-8 max-w-md w-full"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2, stiffness: 200 }}
            >
              <Heart className="w-16 h-16 text-primary" fill="hsl(var(--primary))" />
            </motion.div>

            <div className="text-center">
              <h1 className="font-serif text-5xl md:text-6xl text-foreground text-glow mb-3">
                Between Us
              </h1>
              <p className="text-muted-foreground text-lg">
                A place for two, no matter how far apart
              </p>
            </div>

            <AnimatePresence mode="wait">
              {mode === "choose" && (
                <motion.div
                  key="choose"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-3 w-full"
                >
                  <button
                    onClick={() => setMode("create")}
                    className="w-full py-4 rounded-lg bg-primary text-primary-foreground font-medium text-lg hover:opacity-90 transition-opacity box-glow"
                  >
                    Create a Room
                  </button>
                  <button
                    onClick={() => setMode("join")}
                    className="w-full py-4 rounded-lg bg-secondary text-secondary-foreground font-medium text-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    Join a Room
                  </button>
                </motion.div>
              )}

              {mode === "create" && (
                <motion.div
                  key="create"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-4 w-full"
                >
                  <label className="text-sm text-muted-foreground" htmlFor="create-name">
                    Your name
                  </label>
                  <input
                    id="create-name"
                    type="text"
                    placeholder="Enter your name..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                    maxLength={20}
                    autoFocus
                  />
                  {error && <p className="text-destructive text-sm">{error}</p>}
                  <button
                    onClick={handleCreate}
                    disabled={loading || !name.trim()}
                    className="w-full py-4 rounded-lg bg-primary text-primary-foreground font-medium text-lg hover:opacity-90 transition-opacity disabled:opacity-50 box-glow"
                  >
                    {loading ? "Creating..." : "Create Room"}
                  </button>
                  <button
                    onClick={() => setMode("choose")}
                    className="text-muted-foreground text-sm hover:text-foreground transition-colors"
                  >
                    Back
                  </button>
                </motion.div>
              )}

              {mode === "join" && (
                <motion.div
                  key="join"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-4 w-full"
                >
                  <div>
                    <label className="text-sm text-muted-foreground" htmlFor="join-name">
                      Your name
                    </label>
                    <input
                      id="join-name"
                      type="text"
                      placeholder="Enter your name..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 mt-1 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                      maxLength={20}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground" htmlFor="join-code">
                      Room code
                    </label>
                    <input
                      id="join-code"
                      type="text"
                      placeholder="Enter room code..."
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                      className="w-full px-4 py-3 mt-1 rounded-lg bg-secondary border border-border text-foreground font-mono tracking-widest placeholder:font-sans placeholder:tracking-normal placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                      maxLength={6}
                    />
                  </div>
                  {error && <p className="text-destructive text-sm">{error}</p>}
                  <button
                    onClick={handleJoin}
                    disabled={loading || !name.trim() || !code.trim()}
                    className="w-full py-4 rounded-lg bg-primary text-primary-foreground font-medium text-lg hover:opacity-90 transition-opacity disabled:opacity-50 box-glow"
                  >
                    {loading ? "Joining..." : "Join Room"}
                  </button>
                  <button
                    onClick={() => setMode("choose")}
                    className="text-muted-foreground text-sm hover:text-foreground transition-colors"
                  >
                    Back
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
