"use client"

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { Heart, Sparkles, Download, Printer } from "lucide-react"
import { useEffect, useState, useRef, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import html2canvas from "html2canvas"

type TheEndProps = {
  onComplete?: () => void
  sessionId?: string
  player1Name?: string
  player2Name?: string
}

export default function WordsAndWishes({ onComplete, sessionId, player1Name = "", player2Name = "" }: TheEndProps) {
  const [showFullNote, setShowFullNote] = useState(false)
  const [letterA, setLetterA] = useState("")
  const [letterB, setLetterB] = useState("")
  const [loading, setLoading] = useState(!!sessionId)
  const supabase = useMemo(() => createClient(), [])
  const cardRef = useRef<HTMLDivElement>(null)
  
  // Mouse movement logic for 3D Card Effect
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseX = useSpring(x, { stiffness: 500, damping: 50 })
  const mouseY = useSpring(y, { stiffness: 500, damping: 50 })

  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["7deg", "-7deg"])
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-7deg", "7deg"])

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5
    x.set(xPct)
    y.set(yPct)
  }

  function handleMouseLeave() {
    x.set(0)
    y.set(0)
  }

  useEffect(() => {
    const timer = setTimeout(() => setShowFullNote(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  // Load letters from database
  useEffect(() => {
    if (!sessionId) {
      setLoading(false)
      return
    }

    const loadLetters = async () => {
      try {
        const { data: rows } = await supabase
          .from("room_progress")
          .select("room_name,data")
          .eq("session_id", sessionId)
          .in("room_name", ["words_letter_partner_a", "words_letter_partner_b"])

        if (rows) {
          const aRow = rows.find((r) => r.room_name === "words_letter_partner_a")
          const bRow = rows.find((r) => r.room_name === "words_letter_partner_b")
          setLetterA((aRow?.data as { text?: string })?.text ?? "")
          setLetterB((bRow?.data as { text?: string })?.text ?? "")
        }
      } catch (err) {
        console.error("Failed to load letters:", err)
      } finally {
        setLoading(false)
      }
    }

    loadLetters()
  }, [sessionId, supabase])

  const downloadAsImage = async () => {
    if (!cardRef.current) return
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
      })
      const link = document.createElement("a")
      link.href = canvas.toDataURL("image/png")
      link.download = `${player1Name}_and_${player2Name}_love_card.png`
      link.click()
    } catch (err) {
      console.error("Failed to download image:", err)
    }
  }

  const printCard = () => {
    if (!cardRef.current) return
    const printWindow = window.open("", "", "width=800,height=1000")
    if (!printWindow) return
    
    const printContent = cardRef.current.innerHTML
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Love Card - ${player1Name} & ${player2Name}</title>
          <style>
            body { font-family: 'Georgia', serif; margin: 20px; color: #333; }
            .card { max-width: 700px; padding: 40px; border: 2px solid #e63946; border-radius: 10px; }
            h2 { font-size: 24px; color: #e63946; margin-bottom: 20px; }
            .letter { margin-bottom: 30px; padding: 20px; background: #f5f5f5; border-radius: 5px; }
            .letter p { line-height: 1.8; white-space: pre-wrap; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Words & Wishes</h2>
            <h3>${player1Name}'s Letter</h3>
            <div class="letter"><p>${letterA || "No letter written"}</p></div>
            <h3>${player2Name}'s Letter</h3>
            <div class="letter"><p>${letterB || "No letter written"}</p></div>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 1,
        ease: [0.22, 1, 0.36, 1], // Custom bezier for smooth snapping
      },
    },
  }

  // More hearts for a denser background
  const floatingHearts = Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    delay: Math.random() * 5,
    duration: 6 + Math.random() * 4,
    xStart: Math.random() * 100,
    scale: 0.5 + Math.random() * 0.8,
  }))

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white via-cream to-blush/20 overflow-hidden relative perspective-1000">
      
      {/* Enhanced Floating Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {floatingHearts.map((heart) => (
          <motion.div
            key={heart.id}
            className="absolute"
            initial={{ 
              opacity: 0, 
              y: "110vh", 
              x: `${heart.xStart}vw`,
              scale: heart.scale 
            }}
            animate={{
              opacity: [0, 0.4, 0],
              y: "-10vh",
              // Swaying motion
              x: [`${heart.xStart}vw`, `${heart.xStart + 5}vw`, `${heart.xStart - 5}vw`, `${heart.xStart}vw`],
            }}
            transition={{
              duration: heart.duration,
              delay: heart.delay,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <Heart className="w-6 h-6 fill-primary/20 text-primary/30" />
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 flex flex-col items-center justify-center min-h-screen">
        
        {/* Opening Header Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center mb-12"
        >
          <motion.div variants={itemVariants} className="mb-6 relative">
            <div className="relative inline-block">
              {/* Outer Glow Ring */}
              <motion.div 
                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
              />
              <motion.div
                whileHover={{ scale: 1.2, rotate: 10 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Heart className="w-16 h-16 text-primary mx-auto fill-primary drop-shadow-lg" />
              </motion.div>
            </div>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="font-playfair text-5xl md:text-6xl text-primary mb-4 drop-shadow-sm"
          >
            My Words & Wishes
          </motion.h1>

          <motion.div variants={itemVariants} className="flex items-center justify-center gap-2 text-xl text-primary/70 font-inter italic">
            <span className="h-[1px] w-8 bg-primary/40 inline-block"></span>
            <p>A final thought for you</p>
            <span className="h-[1px] w-8 bg-primary/40 inline-block"></span>
          </motion.div>
        </motion.div>

        {/* 3D Interactive Note Card */}
        {showFullNote && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotateX: 20 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
            transition={{ type: "spring", duration: 1.5 }}
            className="w-full max-w-2xl perspective-1000 mb-12"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ perspective: 1000 }}
          >
            <motion.div
              style={{ 
                rotateX, 
                rotateY,
                transformStyle: "preserve-3d" 
              }}
              className="relative bg-white/70 backdrop-blur-md border border-white/50 rounded-2xl p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.1)]"
            >
              {/* Glossy reflection gradient */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none" />

              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-8 relative z-10"
              >
                {/* Main paragraph with highlighted text */}
                <motion.div variants={itemVariants} className="relative">
                   <Sparkles className="absolute -left-8 -top-4 text-primary/40 w-6 h-6 animate-pulse" />
                   <p className="text-lg md:text-xl text-primary/90 leading-loose font-inter">
                    If you're looking for the word that means caring about someone beyond all rationality and wanting them to have everything they want no matter how much it destroys you,{" "}
                    <motion.span 
                      initial={{ backgroundSize: "0% 100%" }}
                      animate={{ backgroundSize: "100% 100%" }}
                      transition={{ delay: 1, duration: 1 }}
                      className="text-primary font-bold bg-gradient-to-r from-primary/10 to-primary/10 bg-no-repeat bg-bottom px-1 rounded"
                    >
                      it's love.
                    </motion.span>
                  </p>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-6">
                  <p className="text-base text-primary/70 leading-relaxed font-inter">
                    Love is undefinable. It's relative. For few it's at first sight, for few it's not just a moment.
                  </p>

                  <p className="text-base text-primary/70 leading-relaxed font-inter border-l-2 border-primary/20 pl-4">
                    And when you love someone you just, you don't stop, ever. Even when people roll their eyes and call you crazy. Even then. Especially then.
                  </p>

                  <p className="text-base text-primary/70 leading-relaxed font-inter">
                    You just don't give up. Because if I could just give up, if I could just, you know, take the whole world's advice and move on and find someone else, that wouldn't be love. That would be some other disposable thing that is not worth fighting for.
                  </p>

                  <p className="text-base text-primary/80 font-medium leading-relaxed font-inter italic">
                    But I – that is not what this is.
                  </p>
                </motion.div>

                {/* Tamil blessing with fade-in divider */}
                <motion.div variants={itemVariants} className="pt-6 border-t border-primary/10">
                  <p className="text-2xl md:text-3xl font-playfair text-primary italic mb-2 text-center">
                    Neengaa Ekkathin Kaadhalai Hirdayam Ariyumo!
                  </p>
                  <p className="text-sm text-primary/60 font-inter text-center uppercase tracking-widest">
                    (May your heart know the love you share)
                  </p>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* Letters Display Card */}
        {(letterA || letterB) && showFullNote && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2 }}
            ref={cardRef}
            className="w-full max-w-2xl bg-white border-2 border-primary/20 rounded-2xl p-8 md:p-12 shadow-lg mb-12"
          >
            <h2 className="font-playfair text-3xl text-primary mb-8 text-center">Words & Wishes</h2>
            
            <div className="space-y-8">
              {letterA && (
                <div className="pb-8 border-b border-primary/10">
                  <h3 className="font-playfair text-xl text-primary/80 mb-4">{player1Name}'s Letter</h3>
                  <p className="text-primary/70 leading-relaxed whitespace-pre-wrap">{letterA}</p>
                </div>
              )}
              
              {letterB && (
                <div>
                  <h3 className="font-playfair text-xl text-primary/80 mb-4">{player2Name}'s Letter</h3>
                  <p className="text-primary/70 leading-relaxed whitespace-pre-wrap">{letterB}</p>
                </div>
              )}
            </div>

            {/* Download and Print Buttons */}
            <div className="flex gap-4 mt-8 justify-center flex-wrap">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={downloadAsImage}
                className="flex items-center gap-2 px-6 py-2 bg-primary/10 text-primary border border-primary/30 rounded-lg hover:bg-primary/20 transition"
              >
                <Download className="w-4 h-4" />
                Download as Image
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={printCard}
                className="flex items-center gap-2 px-6 py-2 bg-primary/10 text-primary border border-primary/30 rounded-lg hover:bg-primary/20 transition"
              >
                <Printer className="w-4 h-4" />
                Print Card
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Footer Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.5, type: "spring" }}
          className="text-center relative z-20"
        >
          <motion.div
            className="font-playfair text-4xl md:text-6xl font-bold mb-8 relative"
            animate={{ 
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            style={{
              backgroundImage: "linear-gradient(to right, #E63946, #FF9A9E, #E63946)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            HAPPY VALENTINE'S DAY
          </motion.div>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 4 }}
            className="text-primary/70 font-inter mb-10 text-lg"
          >
            -- hari
          </motion.p>

          <div className="flex gap-4 justify-center items-center">
            {/* Primary Button with Shimmer */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-pink-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  // debug: ensure click is firing and onComplete is invoked
                  // eslint-disable-next-line no-console
                  console.log("Until Next Time clicked", { onComplete })
                  onComplete?.()
                }}
                className="relative px-8 py-4 bg-primary text-white font-playfair text-lg rounded-full shadow-xl overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                />
                <span className="relative flex items-center gap-2">
                  ✨ Until Next Time ✨
                </span>
              </motion.button>
            </div>

            {/* Skip Button removed */}
          </div>
        </motion.div>

        {/* Corner Decorations */}
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-10 right-10 opacity-5"
        >
          <Heart className="w-32 h-32 text-primary" />
        </motion.div>

        <motion.div
          animate={{ rotate: -360, scale: [1, 1.2, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-10 left-10 opacity-5"
        >
          <Heart className="w-40 h-40 text-primary" />
        </motion.div>
      </div>
    </div>
  )
}