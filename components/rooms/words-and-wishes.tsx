"use client"

import { motion } from "framer-motion"
import { Heart } from "lucide-react"
import { useEffect, useState } from "react"

export default function WordsAndWishes({ onComplete }: { onComplete?: () => void }) {
  const [showFullNote, setShowFullNote] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowFullNote(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  }

  const paragraphVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 1,
        ease: "easeOut",
      },
    },
  }

  const floatingHearts = Array.from({ length: 5 }).map((_, i) => ({
    id: i,
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 2,
    x: Math.random() * 100 - 50,
  }))

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white via-cream to-blush/20 overflow-hidden relative">
      {/* Floating hearts background */}
      <div className="absolute inset-0 pointer-events-none">
        {floatingHearts.map((heart) => (
          <motion.div
            key={heart.id}
            className="absolute"
            initial={{ opacity: 0, y: 0, x: heart.x }}
            animate={{
              opacity: [0, 0.3, 0],
              y: -window.innerHeight,
              x: heart.x + Math.random() * 50,
            }}
            transition={{
              duration: heart.duration,
              delay: heart.delay,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              left: `${50 + heart.x}%`,
              bottom: 0,
            }}
          >
            <Heart className="w-6 h-6 fill-primary/30 text-primary" />
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 flex flex-col items-center justify-center min-h-screen">
        {/* Opening message */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center mb-12"
        >
          <motion.div variants={itemVariants} className="mb-6">
            <div className="relative inline-block">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              >
                <Heart className="w-16 h-16 text-primary mx-auto fill-primary" />
              </motion.div>
            </div>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="font-playfair text-5xl md:text-6xl text-primary mb-4"
          >
            My Words & Wishes
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-xl text-primary/70 font-inter italic"
          >
            A final thought for you on this day of love
          </motion.p>
        </motion.div>

        {/* Main note - appears after initial animation */}
        {showFullNote && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="space-y-6 mb-12"
          >
            {/* Main paragraph */}
            <motion.div
              variants={paragraphVariants}
              initial="hidden"
              animate="visible"
              className="bg-white/60 backdrop-blur-sm border-2 border-primary/20 rounded-lg p-8 shadow-lg"
            >
              <p className="text-lg text-primary/80 leading-relaxed font-inter">
                If you're looking for the word that means caring about someone beyond all rationality and wanting them to have everything they want no matter how much it destroys you,{" "}
                <span className="text-primary font-bold">it's love.</span>
              </p>
            </motion.div>

            {/* Secondary thoughts */}
            <motion.div
              variants={paragraphVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <p className="text-base text-primary/70 leading-relaxed font-inter">
                Love is undefinable. It's relative. For few it's at first sight, for few it's not just a moment.
              </p>

              <p className="text-base text-primary/70 leading-relaxed font-inter">
                And when you love someone you just, you don't stop, ever. Even when people roll their eyes and call you crazy. Even then. Especially then.
              </p>

              <p className="text-base text-primary/70 leading-relaxed font-inter">
                You just don't give up. Because if I could just give up, if I could just, you know, take the whole world's advice and move on and find someone else, that wouldn't be love. That would be some other disposable thing that is not worth fighting for.
              </p>

              <p className="text-base text-primary/70 leading-relaxed font-inter italic">
                But I – that is not what this is.
              </p>
            </motion.div>

            {/* Tamil blessing */}
            <motion.div
              variants={paragraphVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.6 }}
              className="text-center py-6"
            >
              <p className="text-2xl md:text-3xl font-playfair text-primary italic mb-2">
                Neengaa Ekkathin Kaadhalai Hirdayam Ariyumo!
              </p>
              <p className="text-sm text-primary/60 font-inter">
                (May your heart know the love you share)
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* Valentine's Day message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3 }}
          className="text-center"
        >
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              textShadow: [
                "0 0 0px rgba(230, 57, 70, 0)",
                "0 0 20px rgba(230, 57, 70, 0.3)",
                "0 0 0px rgba(230, 57, 70, 0)",
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
            className="font-playfair text-4xl md:text-5xl text-primary font-bold mb-6"
          >
            HAPPY VALENTINE'S DAY
          </motion.div>

          <p className="text-primary/70 font-inter mb-8">-- Hari</p>

          {/* Completion button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onComplete}
            className="px-8 py-3 bg-gradient-to-r from-primary to-primary/80 text-white font-playfair text-lg rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            ✨ Until Next Time ✨
          </motion.button>
        </motion.div>

        {/* Decorative elements */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-10 right-10 opacity-10"
        >
          <Heart className="w-12 h-12 text-primary" />
        </motion.div>

        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-10 left-10 opacity-10"
        >
          <Heart className="w-12 h-12 text-primary" />
        </motion.div>
      </div>
    </div>
  )
}
