"use client"
import { motion } from "framer-motion"

interface MascoProps {
  size?: number
  glow?: boolean
  animate?: boolean
}

export default function Mascotte({ size = 40, glow = false, animate = false }: MascoProps) {
  const glowStyle = glow
    ? { filter: `drop-shadow(0 0 10px #eccc68aa) drop-shadow(0 0 24px #eccc6855)` }
    : undefined

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      style={glowStyle}
      animate={animate ? { y: [0, -4, 0] } : undefined}
      transition={animate ? { duration: 2.5, repeat: Infinity, ease: "easeInOut" } : undefined}
    >
      {/* Shadow */}
      <ellipse cx="32" cy="61" rx="12" ry="3" fill="rgba(0,0,0,0.3)" />

      {/* Body */}
      <ellipse cx="32" cy="44" rx="14" ry="12" fill="#eccc68" />

      {/* Collar shimmer */}
      <ellipse cx="32" cy="33" rx="9" ry="3" fill="#b8973a" opacity="0.6" />

      {/* Head */}
      <circle cx="32" cy="22" r="15" fill="#eccc68" />

      {/* Head sheen */}
      <ellipse cx="27" cy="14" rx="5" ry="3" fill="white" opacity="0.12" transform="rotate(-20 27 14)" />

      {/* Eyes whites */}
      <circle cx="26.5" cy="21" r="4" fill="white" />
      <circle cx="37.5" cy="21" r="4" fill="white" />

      {/* Pupils */}
      <circle cx="27.5" cy="22" r="2.5" fill="#0a0f1a" />
      <circle cx="38.5" cy="22" r="2.5" fill="#0a0f1a" />

      {/* Eye shine */}
      <circle cx="28.3" cy="21" r="0.9" fill="white" />
      <circle cx="39.3" cy="21" r="0.9" fill="white" />

      {/* Cheeks */}
      <circle cx="21" cy="26" r="3.5" fill="#f0b429" opacity="0.45" />
      <circle cx="43" cy="26" r="3.5" fill="#f0b429" opacity="0.45" />

      {/* Smile */}
      <path d="M26 27.5 Q32 32.5 38 27.5" stroke="#7a5c00" strokeWidth="1.6" strokeLinecap="round" fill="none" />

      {/* Headphone band */}
      <path d="M17 20 Q17 6 32 6 Q47 6 47 20" stroke="#8a6a00" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* Headphone pads */}
      <rect x="12" y="17" width="7" height="9" rx="3.5" fill="#7a5c00" />
      <rect x="45" y="17" width="7" height="9" rx="3.5" fill="#7a5c00" />
      <rect x="13.5" y="18.5" width="4" height="6" rx="2" fill="#eccc68" opacity="0.4" />
      <rect x="46.5" y="18.5" width="4" height="6" rx="2" fill="#eccc68" opacity="0.4" />

      {/* Arms */}
      <ellipse cx="19" cy="46" rx="4.5" ry="8" fill="#eccc68" transform="rotate(-20 19 46)" />
      <ellipse cx="45" cy="46" rx="4.5" ry="8" fill="#eccc68" transform="rotate(20 45 46)" />

      {/* Belly dot */}
      <circle cx="32" cy="46" r="4" fill="#b8973a" opacity="0.5" />
    </motion.svg>
  )
}
