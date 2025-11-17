"use client"

import { useEffect, useState } from "react"

interface GaugeProps {
  value: number
  min: number
  max: number
  status: "normal" | "warning" | "critical"
  size?: number
}

export function Gauge({ value, min, max, status, size = 120 }: GaugeProps) {
  const [animatedValue, setAnimatedValue] = useState(min)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    setIsAnimating(true)
    const timer = setTimeout(() => {
      setAnimatedValue(value)
    }, 200)

    const endTimer = setTimeout(() => {
      setIsAnimating(false)
    }, 1200)

    return () => {
      clearTimeout(timer)
      clearTimeout(endTimer)
    }
  }, [value])

  // Calcular o percentual (0-100)
  const percentage = Math.max(0, Math.min(100, ((animatedValue - min) / (max - min)) * 100))

  // Cores baseadas no status
  const getColors = () => {
    switch (status) {
      case "normal":
        return {
          primary: "#10b981", // green-500
          secondary: "#d1fae5", // green-100
          background: "#f0fdf4", // green-50
        }
      case "warning":
        return {
          primary: "#f59e0b", // yellow-500
          secondary: "#fef3c7", // yellow-100
          background: "#fffbeb", // yellow-50
        }
      case "critical":
        return {
          primary: "#ef4444", // red-500
          secondary: "#fecaca", // red-100
          background: "#fef2f2", // red-50
        }
      default:
        return {
          primary: "#6b7280", // gray-500
          secondary: "#e5e7eb", // gray-200
          background: "#f9fafb", // gray-50
        }
    }
  }

  const colors = getColors()
  const radius = (size - 20) / 2
  const centerX = size / 2
  const centerY = size / 2
  const strokeWidth = 8
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}
      >
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke={colors.secondary}
          strokeWidth={strokeWidth}
          className="opacity-30"
        />
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke={colors.primary}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className={`transition-all duration-1000 ease-out ${isAnimating ? "animate-pulse" : ""}`}
          style={{
            filter: `drop-shadow(0 0 6px ${colors.primary}40)`,
          }}
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div
            className={`text-xl font-bold transition-all duration-500 ${isAnimating ? "scale-110" : "scale-100"}`}
            style={{ color: colors.primary }}
          >
            {animatedValue.toFixed(1)}
          </div>
          <div className="text-xs text-muted-foreground font-medium">°C</div>
        </div>
      </div>
    </div>
  )
}
