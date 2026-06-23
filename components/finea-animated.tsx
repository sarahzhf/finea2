"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

const IDLE_SEQUENCE = [
  { src: "/icons/fineahi.png",       duration: 2800 },
  { src: "/icons/fineablinkone.png", duration: 220  },
  { src: "/icons/fineahi.png",       duration: 1400 },
  { src: "/icons/finealeft.png",     duration: 900  },
  { src: "/icons/fineahi.png",       duration: 1100 },
  { src: "/icons/finearight.png",    duration: 900  },
  { src: "/icons/fineahi.png",       duration: 1800 },
  { src: "/icons/fineasmile.png",    duration: 1400 },
  { src: "/icons/fineahi.png",       duration: 1000 },
]

const TALK_SEQUENCE = [
  { src: "/icons/fineatalk.png",     duration: 220  },
  { src: "/icons/fineahi.png",       duration: 160  },
  { src: "/icons/fineatalk.png",     duration: 200  },
  { src: "/icons/fineahi.png",       duration: 180  },
  { src: "/icons/fineatalk.png",     duration: 240  },
  { src: "/icons/fineasmile.png",    duration: 350  },
]

interface FineaAnimatedProps {
  size?: number
  talking?: boolean
  loop?: boolean
}

export default function FineaAnimated({ size = 40, talking = false, loop = true }: FineaAnimatedProps) {
  const [frameIdx, setFrameIdx] = useState(0)
  const sequence = talking ? TALK_SEQUENCE : IDLE_SEQUENCE

  useEffect(() => {
    setFrameIdx(0)
  }, [talking])

  useEffect(() => {
    const frame = sequence[frameIdx]
    if (!frame) { setFrameIdx(0); return }
    const timer = setTimeout(() => {
      const next = frameIdx + 1
      if (next >= sequence.length) {
        if (loop) setFrameIdx(0)
      } else {
        setFrameIdx(next)
      }
    }, frame.duration)
    return () => clearTimeout(timer)
  }, [frameIdx, sequence, loop])

  const src = sequence[frameIdx]?.src ?? "/icons/fineahi.png"

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={src}
        initial={{ opacity: 0.7, scale: 0.95 }}
        animate={{ opacity: 1,   scale: 1    }}
        exit={{    opacity: 0.7, scale: 0.95 }}
        transition={{ duration: 0.08 }}
        style={{ width: size, height: size, flexShrink: 0 }}
      >
        <Image
          src={src}
          alt="Finéa"
          width={size}
          height={size}
          style={{ objectFit: "contain", width: size, height: size }}
        />
      </motion.div>
    </AnimatePresence>
  )
}
