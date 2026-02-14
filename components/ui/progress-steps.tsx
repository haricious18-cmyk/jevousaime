import React from "react"

export default function ProgressSteps({
  steps,
  current,
}: {
  steps: string[]
  current: string
}) {
  const idx = steps.indexOf(current)
  return (
    <nav aria-label="Room progress" className="w-full max-w-4xl mx-auto px-6 py-3">
      <ol className="flex items-center gap-3 text-sm" role="list">
        {steps.map((s, i) => {
          const done = i < idx
          const active = s === current
          return (
            <li key={s} className="flex items-center gap-3">
              <div
                aria-current={active ? "step" : undefined}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${done ? "bg-primary text-white" : active ? "bg-white text-primary font-semibold" : "bg-white/10 text-white/60"}`}
              >
                {i + 1}
              </div>
              <span className={`hidden md:inline ${active ? "text-primary font-medium" : "text-muted-foreground"}`}>{s}</span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
