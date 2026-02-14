"use client"

import React, { createContext, useContext, useMemo, useState } from "react"

type AudioContextType = {
  muted: boolean
  setMuted: (v: boolean) => void
  volume: number
  setVolume: (v: number) => void
}

const AudioContext = createContext<AudioContextType | null>(null)

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(0.7)

  const value = useMemo(() => ({ muted, setMuted, volume, setVolume }), [muted, volume])

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
}

export function useAudio() {
  const ctx = useContext(AudioContext)
  if (!ctx) throw new Error("useAudio must be used within AudioProvider")
  return ctx
}

export default AudioProvider
