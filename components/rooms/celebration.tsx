"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Heart } from "lucide-react"

type CelebrationProps = {
  player1Name: string
  player2Name: string
  loveMeter: number
}

function Confetti({ canvasRef }: { canvasRef: React.RefObject<HTMLCanvasElement | null> }) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const colors = [
      "hsl(350, 65%, 65%)",
      "hsl(30, 70%, 55%)",
      "hsl(45, 80%, 65%)",
      "hsl(280, 60%, 65%)",
      "hsl(350, 65%, 75%)",
    ]

    type Particle = {
      x: number
      y: number
      vx: number
      vy: number
      size: number
      color: string
      rotation: number
      rotationSpeed: number
      opacity: number
    }

    const particles: Particle[] = []

    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 3 + 1,
        size: Math.random() * 8 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
      })
    }

    let animationId: number

    function animate() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.03
        p.rotation += p.rotationSpeed
        p.opacity = Math.max(0, p.opacity - 0.002)

        if (p.y > canvas.height + 20) {
          p.y = -10
          p.x = Math.random() * canvas.width
          p.vy = Math.random() * 3 + 1
          p.opacity = 1
        }

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.globalAlpha = p.opacity
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
        ctx.restore()
      }

      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationId)
  }, [canvasRef])

  return null
}

export function Celebration({ player1Name, player2Name, loveMeter }: CelebrationProps) {
  const confettiRef = useRef<HTMLCanvasElement>(null)
  const [showMessage, setShowMessage] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowMessage(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-dvh px-4 overflow-hidden">
      <canvas
        ref={confettiRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 60 }}
        aria-hidden="true"
      />
      <Confetti canvasRef={confettiRef} />

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
        className="flex flex-col items-center gap-8 max-w-md w-full text-center"
      >
        {/* Pulsing hearts */}
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="relative"
        >
          <Heart className="w-24 h-24 text-primary" fill="hsl(var(--primary))" />
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div
              className="w-32 h-32 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, hsl(350, 65%, 65%, 0.3) 0%, transparent 70%)",
              }}
            />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h1 className="font-serif text-4xl md:text-5xl text-foreground text-glow mb-4">
            You made it together
          </h1>
          <p className="text-muted-foreground text-lg mb-2">
            {player1Name} & {player2Name}
          </p>
        </motion.div>

        {showMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-card border border-border rounded-xl p-6 box-glow">
              <p className="font-serif text-xl text-foreground leading-relaxed italic">
                {
                  "\"Distance means so little when someone means so much. Tonight you proved that love isn't measured in miles -- it's measured in the moments you choose each other.\""
                }
              </p>
            </div>

            <div className="flex items-center justify-center gap-3">
              <span className="text-sm text-muted-foreground">Love Meter</span>
              <div className="w-32 h-3 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
                />
              </div>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.5 }}
                className="text-primary font-medium"
              >
                100%
              </motion.span>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3 }}
              className="text-muted-foreground text-sm"
            >
              This experience was built with love, just for the two of you.
            </motion.p>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
