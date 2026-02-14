"use client"

import type { Day7Data } from "@/components/rooms/valentines-week/types"

type Day7Props = {
  playerName: string
  partnerName: string
  promiseA: string
  promiseB: string
  day7: Day7Data
  setDay7: (d: Day7Data) => void
  saveDay7: (d: Day7Data) => Promise<void>
}

export function Day7View({
  playerName,
  partnerName,
  promiseA,
  promiseB,
  day7,
  setDay7,
  saveDay7,
}: Day7Props) {
  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) => {
    const words = text.split(" ")
    let line = ""
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " "
      const metrics = ctx.measureText(testLine)
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, y)
        line = words[n] + " "
        y += lineHeight
      } else {
        line = testLine
      }
    }
    ctx.fillText(line, x, y)
  }

  const download = async () => {
    const width = 1080
    const height = 1350
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const grad = ctx.createLinearGradient(0, 0, width, height)
    grad.addColorStop(0, "#fff7e6")
    grad.addColorStop(1, "#ffe4ec")
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)

    ctx.fillStyle = "#b45309"
    ctx.font = "48px Georgia"
    ctx.fillText("Love Letter", 60, 100)

    ctx.fillStyle = "#7c2d12"
    ctx.font = "28px Georgia"
    ctx.fillText(`From ${playerName} & ${partnerName}`, 60, 150)

    ctx.font = "24px 'Helvetica Neue', sans-serif"
    ctx.fillStyle = "#1f2937"
    let y = 210
    const lineHeight = 34

    const writeBlock = (title: string, lines: string[]) => {
      ctx.font = "26px Georgia"
      ctx.fillStyle = "#b91c1c"
      ctx.fillText(title, 60, y)
      y += lineHeight
      ctx.font = "22px 'Helvetica Neue', sans-serif"
      ctx.fillStyle = "#111827"
      if (lines.length === 0) {
        ctx.fillText("- (blank) -", 80, y)
        y += lineHeight
      } else {
        lines.forEach((ln) => {
          wrapText(ctx, ln, 80, y, width - 120, lineHeight)
          y += lineHeight * Math.max(1, Math.ceil(ctx.measureText(ln).width / (width - 120)))
        })
      }
      y += lineHeight * 0.5
    }

    writeBlock("Promise A", promiseA ? [promiseA] : [])
    writeBlock("Promise B", promiseB ? [promiseB] : [])

    const url = canvas.toDataURL("image/png")
    const a = document.createElement("a")
    a.href = url
    a.download = "love-letter.png"
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)

    const next = { ...day7, finished: true }
    setDay7(next)
    await saveDay7(next)
  }

  return (
    <div className="relative z-10 min-h-dvh px-4 py-16">
      <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-card/80 p-6 space-y-4 text-center">
        <h2 className="font-serif text-3xl text-foreground">Day 7: Valentine&apos;s Day (Feb 14)</h2>
        <p className="text-muted-foreground text-sm">The Grand Door opens.</p>

        <div className="h-48 rounded-xl border border-amber-300 bg-gradient-to-br from-amber-100 to-rose-100 grid place-items-center">
          <p className="font-serif text-2xl text-amber-700">Love Letter</p>
        </div>

        <div className="rounded-lg border border-border bg-secondary/30 p-3 text-left text-sm">
          <p className="font-medium mb-2">Promises</p>
          <p className="mb-1">A: {promiseA || "-"}</p>
          <p>B: {promiseB || "-"}</p>
        </div>

        <button onClick={() => void download()} className="rounded-lg bg-primary px-5 py-2 text-primary-foreground">
          Download Love Letter
        </button>
        {day7.finished && <p className="text-green-600 text-sm">Saved. Congratulations!</p>}
      </div>
    </div>
  )
}
