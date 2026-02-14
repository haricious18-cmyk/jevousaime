"use client"

import { useEffect, useRef } from "react"
import type { Day6Data, Role } from "@/components/rooms/valentines-week/types"

type Day6Props = {
  role: Role
  playerName: string
  partnerName: string
  day6: Day6Data
  setDay6: (d: Day6Data) => void
  saveDay6: (d: Day6Data) => Promise<void>
  paused: boolean
}

export function Day6View({ role, playerName, partnerName, day6, setDay6, saveDay6, paused }: Day6Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const isA = role === "partner_a"

  const update = async (patch: Partial<Day6Data>) => {
    const next = { ...day6, ...patch }
    setDay6(next)
    await saveDay6(next)
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play().catch(() => {})
      }
      await update(isA ? { cameraA: true } : { cameraB: true })
    } catch {
      // no-op
    }
  }

  const stopCamera = () => {
    const trackStream = videoRef.current?.srcObject as MediaStream | null
    trackStream?.getTracks().forEach((t) => t.stop())
    if (videoRef.current) videoRef.current.srcObject = null
  }

  useEffect(() => stopCamera, [])

  const kiss = async () => {
    await update(isA ? { kissA: true } : { kissB: true })
  }

  return (
    <div className="relative z-10 min-h-dvh px-4 py-16">
      <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-card/80 p-6 space-y-4 text-center">
        <h2 className="font-serif text-3xl text-foreground">Day 6: Kiss Day (Feb 13)</h2>
        <p className="text-muted-foreground text-sm">Open your camera and blow a kiss to each other. Keep it sweet.</p>

        <div className="mx-auto h-64 w-full max-w-xl rounded-xl border border-rose-300 bg-rose-50 grid place-items-center overflow-hidden">
          <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
          {!(isA ? day6.cameraA : day6.cameraB) && (
            <button
              onClick={() => void startCamera()}
              disabled={paused}
              className="absolute rounded-lg bg-rose-500 px-4 py-2 text-white shadow"
            >
              Start camera
            </button>
          )}
        </div>

        <div className="flex justify-center gap-3 text-sm text-muted-foreground">
          <span>You: {isA ? (day6.cameraA ? "Camera on" : "Camera off") : day6.cameraB ? "Camera on" : "Camera off"}</span>
          <span>Partner: {isA ? (day6.cameraB ? "Camera on" : "Camera off") : day6.cameraA ? "Camera on" : "Camera off"}</span>
        </div>

        <button
          onClick={() => void kiss()}
          disabled={(isA ? day6.kissA : day6.kissB) || paused}
          className="rounded-lg bg-primary px-5 py-2 text-primary-foreground disabled:opacity-60"
        >
          {isA ? (day6.kissA ? "Kiss sent" : "Send kiss") : day6.kissB ? "Kiss sent" : "Send kiss"}
        </button>

        <p className="text-sm text-muted-foreground">
          Need both kisses to move to Valentine&apos;s Day. {playerName}:{" "}
          {isA ? (day6.kissA ? "done" : "pending") : day6.kissB ? "done" : "pending"}. {partnerName}:{" "}
          {isA ? (day6.kissB ? "done" : "pending") : day6.kissA ? "done" : "pending"}.
        </p>
      </div>
    </div>
  )
}
