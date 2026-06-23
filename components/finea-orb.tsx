"use client"

import { motion, useAnimationFrame } from "framer-motion"
import { useRef, useState } from "react"
import FineaAnimated from "./finea-animated"

interface FineaOrbProps {
  size?: number
  active?: boolean
}

export default function FineaOrb({ size = 68, active = false }: FineaOrbProps) {
  const [tick, setTick] = useState(0)
  const t = useRef(0)

  // Animation fluide continue
  useAnimationFrame((time) => {
    t.current = time / 1000
    setTick(t.current)
  })

  const T = tick

  // Blobs de plasma qui tournent et pulsent
  const blobs = [
    { r: size * 0.28, speed: 0.38, offset: 0,            color: active ? "#FFE566" : "#F5D657", opacity: 0.9,  scale: 1.0  },
    { r: size * 0.22, speed: 0.55, offset: Math.PI * 0.7, color: active ? "#FFD700" : "#E8C040", opacity: 0.75, scale: 1.15 },
    { r: size * 0.18, speed: 0.70, offset: Math.PI * 1.4, color: "#FFFBE8",                      opacity: 0.55, scale: 0.9  },
    { r: size * 0.20, speed: 0.28, offset: Math.PI * 0.3, color: active ? "#FFC300" : "#C49A00", opacity: 0.65, scale: 1.1  },
    { r: size * 0.14, speed: 0.90, offset: Math.PI * 1.1, color: "#FFFFFF",                      opacity: 0.40, scale: 0.85 },
  ]

  const cx = size / 2
  const cy = size / 2
  const outerR = size / 2 - 2

  // Pulse principal
  const pulse = 1 + Math.sin(T * (active ? 2.8 : 1.6)) * (active ? 0.06 : 0.025)

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >

      {/* ── Sphère SVG ── */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: `scale(${pulse})`, transition: "transform 0.05s linear" }}
      >
        <defs>
          {/* Gradient de base */}
          <radialGradient id="orb-base" cx="38%" cy="32%" r="65%">
            <stop offset="0%"   stopColor="#FFF5A0" stopOpacity="1"   />
            <stop offset="35%"  stopColor="#F5D657" stopOpacity="1"   />
            <stop offset="70%"  stopColor="#C49A00" stopOpacity="1"   />
            <stop offset="100%" stopColor="#7A5C00" stopOpacity="1"   />
          </radialGradient>
          {/* Glassmorphism interne */}
          <radialGradient id="orb-glass" cx="30%" cy="25%" r="55%">
            <stop offset="0%"   stopColor="white"   stopOpacity="0.35" />
            <stop offset="60%"  stopColor="white"   stopOpacity="0.04" />
            <stop offset="100%" stopColor="white"   stopOpacity="0"    />
          </radialGradient>
          {/* Shadow bas */}
          <radialGradient id="orb-shadow" cx="50%" cy="80%" r="50%">
            <stop offset="0%"   stopColor="#3D2800" stopOpacity="0.6"  />
            <stop offset="100%" stopColor="#3D2800" stopOpacity="0"    />
          </radialGradient>
          {/* Clip sphère */}
          <clipPath id="orb-clip">
            <circle cx={cx} cy={cy} r={outerR} />
          </clipPath>
          {/* Blur pour blobs */}
          <filter id="blob-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={size * 0.07} />
          </filter>
          <filter id="blob-blur-sm" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={size * 0.04} />
          </filter>
        </defs>

        {/* Blobs plasma flottants — sans fond, sans clip */}
        <g>
          {blobs.map((b, i) => {
            const angle = T * b.speed + b.offset
            const bx = cx + Math.cos(angle) * b.r
            const by = cy + Math.sin(angle * 0.8) * b.r * 0.75
            const bs = b.scale * (1 + Math.sin(T * b.speed * 2.1 + i) * 0.12)
            const br = (size * 0.28) * bs
            return (
              <circle
                key={i}
                cx={bx}
                cy={by}
                r={br}
                fill={b.color}
                opacity={b.opacity}
                filter={i < 3 ? "url(#blob-blur)" : "url(#blob-blur-sm)"}
              />
            )
          })}

          {/* Reflet central brillant */}
          <circle
            cx={cx + Math.sin(T * 0.6) * size * 0.06}
            cy={cy - size * 0.06 + Math.cos(T * 0.5) * size * 0.04}
            r={size * 0.12}
            fill="white"
            opacity={0.55 + Math.sin(T * (active ? 3 : 1.8)) * 0.2}
            filter="url(#blob-blur-sm)"
          />
        </g>


      </svg>

      {/* ── Finéa animée par-dessus les blobs ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <FineaAnimated size={Math.round(size * 0.72)} talking={active} />
      </div>

    </div>
  )
}
