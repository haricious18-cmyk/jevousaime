"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, BookOpen, ArrowLeft, ChevronRight, SkipForward } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

const PROMPTS = [
  "What is a memory of us that always makes you smile?",
  "What do you miss most about being together?",
  "If we could be anywhere in the world right now, where would it be?",
  "What is something I do that makes you feel loved?",
  "What is a dream you have for our future together?",
  "What ordinary moment together are you secretly dreaming about the most?",
  "What's the most ridiculous thing you've done because you missed me?",
  "When do you feel closest to me despite the distance?",
  "How do you think this distance has changed the way we love?",
  "What's the first thing you'd do if I were next to you right now?",
]

type Message = {
  id: string
  sender_name: string
  content: string
  is_prompt: boolean
  created_at: string
}

type MessageRow = {
  id: string
  sender_name?: string | null
  sender?: string | null
  content?: string | null
  is_prompt?: boolean | null
  prompt?: string | null
  created_at: string
}

type LibraryProps = {
  sessionId: string
  playerName: string
  partnerName: string
  onComplete: () => void
  onBack: () => void
}

export function LibraryOfEchoes({ sessionId, playerName, partnerName, onComplete, onBack }: LibraryProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [answeredCount, setAnsweredCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [sendingPrompt, setSendingPrompt] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const supabase = useMemo(() => createClient(), [])

  const REQUIRED_ANSWERS = 3

  const normalizeMessage = useCallback((row: MessageRow): Message => {
    const senderName = row.sender_name ?? row.sender ?? "Unknown"
    const content = row.content ?? row.prompt ?? ""
    const isPrompt =
      typeof row.is_prompt === "boolean"
        ? row.is_prompt
        : senderName === "The Library" || (typeof row.prompt === "string" && row.prompt.length > 0)

    return {
      id: row.id,
      sender_name: senderName,
      content,
      is_prompt: isPrompt,
      created_at: row.created_at,
    }
  }, [])

  const appendMessage = useCallback((msg: Message) => {
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
    if (!msg.is_prompt) {
      setAnsweredCount((prev) => prev + 1)
    }
  }, [])

  const syncMessages = useCallback(async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })

    if (!data) return

    const normalized = (data as MessageRow[]).map(normalizeMessage)
    setMessages(normalized)
    const answered = normalized.filter((m) => !m.is_prompt).length
    setAnsweredCount(answered)
  }, [sessionId, supabase, normalizeMessage])

  // Load existing messages and subscribe to new ones
  useEffect(() => {
    let channel: RealtimeChannel

    void syncMessages()

    channel = supabase
      .channel(`messages-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const newMsg = normalizeMessage(payload.new as MessageRow)
          appendMessage(newMsg)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId, supabase, normalizeMessage, appendMessage, syncMessages])

  // Fallback sync for environments where Realtime is not configured.
  useEffect(() => {
    const interval = setInterval(() => {
      void syncMessages()
    }, 1500)

    return () => clearInterval(interval)
  }, [syncMessages])

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  const sendPrompt = useCallback(async () => {
    const sentPromptCount = messages.filter((m) => m.is_prompt).length
    if (sentPromptCount >= PROMPTS.length || sendingPrompt) return
    setError(null)
    setSendingPrompt(true)

    const prompt = PROMPTS[sentPromptCount]

    const primaryInsert = await supabase
      .from("messages")
      .insert({
        session_id: sessionId,
        sender_name: "The Library",
        content: prompt,
        is_prompt: true,
      })
      .select()
      .single()

    if (!primaryInsert.error && primaryInsert.data) {
      appendMessage(normalizeMessage(primaryInsert.data as MessageRow))
      setSendingPrompt(false)
      return
    }

    const fallbackInsert = await supabase
      .from("messages")
      .insert({
        session_id: sessionId,
        sender: "The Library",
        content: prompt,
        prompt,
      })
      .select()
      .single()

    if (!fallbackInsert.error && fallbackInsert.data) {
      appendMessage(normalizeMessage(fallbackInsert.data as MessageRow))
      setSendingPrompt(false)
      return
    }

    setError("Failed to send prompt. Check messages table schema/policies.")
    setSendingPrompt(false)
  }, [messages, sessionId, supabase, normalizeMessage, appendMessage, sendingPrompt])

  const sendMessage = async () => {
    if (!input.trim()) return
    setError(null)

    const text = input.trim()
    const primaryInsert = await supabase
      .from("messages")
      .insert({
        session_id: sessionId,
        sender_name: playerName,
        content: text,
        is_prompt: false,
      })
      .select()
      .single()

    if (!primaryInsert.error && primaryInsert.data) {
      appendMessage(normalizeMessage(primaryInsert.data as MessageRow))
      setInput("")
      return
    }

    const fallbackInsert = await supabase
      .from("messages")
      .insert({
        session_id: sessionId,
        sender: playerName,
        content: text,
      })
      .select()
      .single()

    if (!fallbackInsert.error && fallbackInsert.data) {
      appendMessage(normalizeMessage(fallbackInsert.data as MessageRow))
      setInput("")
      return
    }

    setError("Failed to send answer. Check messages table schema/policies.")
  }

  const isComplete = answeredCount >= REQUIRED_ANSWERS * 2
  const promptCount = messages.filter((m) => m.is_prompt).length
  const lastPromptIndex = messages.map((m) => m.is_prompt).lastIndexOf(true)
  const answersSinceLastPrompt = messages
    .slice(lastPromptIndex + 1)
    .filter((m) => !m.is_prompt).length
  const canRevealNextQuestion =
    promptCount > 0 && answersSinceLastPrompt >= 2 && promptCount < PROMPTS.length

  return (
    <div className="relative z-10 flex flex-col min-h-dvh pt-14">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background/50 backdrop-blur-sm">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <BookOpen className="w-5 h-5 text-primary" />
        <h2 className="font-serif text-xl text-foreground">Library of Echoes</h2>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.is_prompt ? "justify-center" : msg.sender_name === playerName ? "justify-end" : "justify-start"}`}
            >
              {msg.is_prompt ? (
                <div className="bg-secondary/80 border border-border rounded-xl px-5 py-3 max-w-sm text-center">
                  <p className="text-xs text-muted-foreground mb-1">The Library whispers...</p>
                  <p className="font-serif text-foreground text-lg italic">{msg.content}</p>
                </div>
              ) : (
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    msg.sender_name === playerName
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-secondary text-secondary-foreground rounded-bl-md"
                  }`}
                >
                  <p className="text-xs opacity-70 mb-0.5">{msg.sender_name}</p>
                  <p>{msg.content}</p>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="w-12 h-12 text-primary/40 mb-4" />
            <p className="font-serif text-xl text-foreground/60 mb-2">
              The Library awaits your voices
            </p>
            <p className="text-muted-foreground text-sm max-w-xs">
              Tap the button below to reveal the first question, then both of you answer honestly.
            </p>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-border bg-background/80 backdrop-blur-sm px-4 py-3">
        {error && <p className="text-destructive text-sm mb-2">{error}</p>}
        {isComplete ? (
          <div className="flex gap-2">
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={onComplete}
              className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-medium box-glow hover:opacity-90 transition-opacity"
            >
              Complete this room
            </motion.button>
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={onComplete}
              className="flex-1 py-3 rounded-lg bg-white/20 text-white font-medium hover:bg-white/30 transition-colors flex items-center justify-center gap-2"
              title="Skip this room"
            >
              <SkipForward className="h-4 w-4" />
              Skip
            </motion.button>
          </div>
        ) : promptCount === 0 ? (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => void sendPrompt()}
            disabled={sendingPrompt}
            className="w-full py-3 rounded-lg bg-secondary text-secondary-foreground font-medium border border-primary/30 hover:border-primary/60 transition-colors flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            {sendingPrompt ? "Revealing..." : "Reveal first question"}
          </motion.button>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type your answer..."
              className="flex-1 px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              maxLength={500}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="px-4 py-3 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 transition-opacity"
            >
              <Send className="w-5 h-5" />
            </button>
            {canRevealNextQuestion && (
              <button
                onClick={() => void sendPrompt()}
                disabled={sendingPrompt}
                className="px-3 py-3 rounded-lg bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 transition-colors"
                title="Next question"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
