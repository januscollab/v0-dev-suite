"use client"

import { useState, useEffect } from "react"
import { CheckCircle, Clock, AlertCircle } from "lucide-react"

interface SyncStatusIndicatorProps {
  lastSaved?: Date | null
  autoSaveInterval?: number
}

export function SyncStatusIndicator({ lastSaved, autoSaveInterval = 30000 }: SyncStatusIndicatorProps) {
  const [timeAgo, setTimeAgo] = useState<string>("")
  const [status, setStatus] = useState<"saved" | "saving" | "error">("saved")

  useEffect(() => {
    if (!lastSaved) return

    const updateTimeAgo = () => {
      const now = new Date()
      const diffMs = now.getTime() - lastSaved.getTime()
      const diffSeconds = Math.floor(diffMs / 1000)
      const diffMinutes = Math.floor(diffSeconds / 60)

      if (diffSeconds < 60) {
        setTimeAgo(`${diffSeconds}s ago`)
      } else if (diffMinutes < 60) {
        setTimeAgo(`${diffMinutes}m ago`)
      } else {
        const diffHours = Math.floor(diffMinutes / 60)
        setTimeAgo(`${diffHours}h ago`)
      }

      // Set status based on time since last save
      if (diffMs > autoSaveInterval * 2) {
        setStatus("error")
      } else {
        setStatus("saved")
      }
    }

    updateTimeAgo()
    const interval = setInterval(updateTimeAgo, 1000)

    return () => clearInterval(interval)
  }, [lastSaved, autoSaveInterval])

  const getStatusIcon = () => {
    switch (status) {
      case "saved":
        return <CheckCircle size={14} className="text-[#60B246]" />
      case "saving":
        return <Clock size={14} className="text-[#FC8019] animate-pulse" />
      case "error":
        return <AlertCircle size={14} className="text-[#F44336]" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case "saved":
        return lastSaved ? `Auto-saved ${timeAgo}` : "Auto-save ready"
      case "saving":
        return "Auto-saving..."
      case "error":
        return "Auto-save delayed"
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case "saved":
        return "text-[#60B246]"
      case "saving":
        return "text-[#FC8019]"
      case "error":
        return "text-[#F44336]"
    }
  }

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-white/80 backdrop-blur-sm rounded-full border border-[#E0E0E0] shadow-sm">
      {getStatusIcon()}
      <span className={`text-[11px] font-medium ${getStatusColor()}`}>{getStatusText()}</span>
    </div>
  )
}
