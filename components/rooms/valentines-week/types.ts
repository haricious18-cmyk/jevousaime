"use client"

export type Role = "partner_a" | "partner_b"

export type ValentinesWeekProps = {
  sessionId: string
  roomCode: string
  role: Role
  playerName: string
  partnerName: string
  onDayChanged?: (day: number) => void
  onWeekFinished?: () => void
}

export type Day1Data = {
  question: string
  revealed: boolean
  accepted: boolean
}

export type Day2Data = {
  darkMemory: string
  milkMemory: string
  dateA: string
  dateB: string
  matched: boolean
}

export type Day3Data = {
  progress: number
  cursorA: { x: number; y: number } | null
  cursorB: { x: number; y: number } | null
  holdingA: boolean
  holdingB: boolean
}

export type Day4Data = {
  handA: number
  handB: number
  locked: boolean
  promiseA: string
  promiseB: string
}

export type Day5Data = {
  shownAt: number | null
  done: boolean
}

export type Day6Data = {
  cameraA: boolean
  cameraB: boolean
  kissA: boolean
  kissB: boolean
}

export type Day7Data = {
  finished: boolean
}

export const emptyDay1: Day1Data = { question: "", revealed: false, accepted: false }
export const emptyDay2: Day2Data = {
  darkMemory: "",
  milkMemory: "",
  dateA: "",
  dateB: "",
  matched: false,
}
export const emptyDay3: Day3Data = {
  progress: 0,
  cursorA: null,
  cursorB: null,
  holdingA: false,
  holdingB: false,
}
export const emptyDay4: Day4Data = {
  handA: -140,
  handB: 140,
  locked: false,
  promiseA: "",
  promiseB: "",
}
export const emptyDay5: Day5Data = {
  shownAt: null,
  done: false,
}
export const emptyDay6: Day6Data = {
  cameraA: false,
  cameraB: false,
  kissA: false,
  kissB: false,
}
export const emptyDay7: Day7Data = { finished: false }
