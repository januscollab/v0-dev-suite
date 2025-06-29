"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"

interface AccessibilitySettings {
  reducedMotion: boolean
  highContrast: boolean
  fontSize: "small" | "medium" | "large"
  focusVisible: boolean
}

interface AccessibilityContextType {
  settings: AccessibilitySettings
  updateSettings: (updates: Partial<AccessibilitySettings>) => void
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null)

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    reducedMotion: false,
    highContrast: false,
    fontSize: "medium",
    focusVisible: true,
  })

  useEffect(() => {
    // Check for system preferences
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const prefersHighContrast = window.matchMedia("(prefers-contrast: high)").matches

    setSettings((prev) => ({
      ...prev,
      reducedMotion: prefersReducedMotion,
      highContrast: prefersHighContrast,
    }))

    // Load saved preferences
    const saved = localStorage.getItem("accessibility-settings")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setSettings((prev) => ({ ...prev, ...parsed }))
      } catch (error) {
        console.error("Failed to load accessibility settings:", error)
      }
    }
  }, [])

  useEffect(() => {
    // Apply settings to document
    const root = document.documentElement

    // Reduced motion
    if (settings.reducedMotion) {
      root.style.setProperty("--animation-duration", "0.01ms")
      root.style.setProperty("--transition-duration", "0.01ms")
    } else {
      root.style.removeProperty("--animation-duration")
      root.style.removeProperty("--transition-duration")
    }

    // High contrast
    if (settings.highContrast) {
      root.classList.add("high-contrast")
    } else {
      root.classList.remove("high-contrast")
    }

    // Font size
    root.classList.remove("font-small", "font-medium", "font-large")
    root.classList.add(`font-${settings.fontSize}`)

    // Focus visible
    if (settings.focusVisible) {
      root.classList.add("focus-visible")
    } else {
      root.classList.remove("focus-visible")
    }

    // Save to localStorage
    localStorage.setItem("accessibility-settings", JSON.stringify(settings))
  }, [settings])

  const updateSettings = (updates: Partial<AccessibilitySettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }))
  }

  return <AccessibilityContext.Provider value={{ settings, updateSettings }}>{children}</AccessibilityContext.Provider>
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error("useAccessibility must be used within AccessibilityProvider")
  }
  return context
}

// Accessibility helper components
export function SkipLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-[#FC8019] text-white px-4 py-2 rounded-lg z-50 focus:outline-none focus:ring-2 focus:ring-white"
    >
      {children}
    </a>
  )
}

export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>
}

export function LiveRegion({
  children,
  politeness = "polite",
}: {
  children: React.ReactNode
  politeness?: "polite" | "assertive" | "off"
}) {
  return (
    <div aria-live={politeness} aria-atomic="true" className="sr-only">
      {children}
    </div>
  )
}
