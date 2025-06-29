"use client"

import { useEffect, useCallback } from "react"

interface KeyboardShortcuts {
  onNewStory: () => void
  onNewSprint: () => void
  onOpenSettings: () => void
  onToggleSearch: () => void
  onToggleArchive: () => void
  onSave: () => void
  onExport: () => void
}

export function useKeyboardShortcuts({
  onNewStory,
  onNewSprint,
  onOpenSettings,
  onToggleSearch,
  onToggleArchive,
  onSave,
  onExport,
}: KeyboardShortcuts) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target as HTMLElement)?.contentEditable === "true"
      ) {
        return
      }

      const isCtrlOrCmd = event.ctrlKey || event.metaKey
      const isShift = event.shiftKey
      const isAlt = event.altKey

      // Ctrl/Cmd + N: New Story
      if (isCtrlOrCmd && !isShift && !isAlt && event.key === "n") {
        event.preventDefault()
        onNewStory()
        return
      }

      // Ctrl/Cmd + Shift + N: New Sprint
      if (isCtrlOrCmd && isShift && !isAlt && event.key === "N") {
        event.preventDefault()
        onNewSprint()
        return
      }

      // Ctrl/Cmd + ,: Settings
      if (isCtrlOrCmd && !isShift && !isAlt && event.key === ",") {
        event.preventDefault()
        onOpenSettings()
        return
      }

      // Ctrl/Cmd + K: Search
      if (isCtrlOrCmd && !isShift && !isAlt && event.key === "k") {
        event.preventDefault()
        onToggleSearch()
        return
      }

      // Ctrl/Cmd + Shift + A: Toggle Archive
      if (isCtrlOrCmd && isShift && !isAlt && event.key === "A") {
        event.preventDefault()
        onToggleArchive()
        return
      }

      // Ctrl/Cmd + S: Save
      if (isCtrlOrCmd && !isShift && !isAlt && event.key === "s") {
        event.preventDefault()
        onSave()
        return
      }

      // Ctrl/Cmd + E: Export
      if (isCtrlOrCmd && !isShift && !isAlt && event.key === "e") {
        event.preventDefault()
        onExport()
        return
      }

      // Escape: Close modals (handled by individual components)
      if (event.key === "Escape") {
        // Let individual components handle this
        return
      }
    },
    [onNewStory, onNewSprint, onOpenSettings, onToggleSearch, onToggleArchive, onSave, onExport],
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  return {
    shortcuts: [
      { key: "Ctrl/Cmd + N", description: "Create new story" },
      { key: "Ctrl/Cmd + Shift + N", description: "Create new sprint" },
      { key: "Ctrl/Cmd + K", description: "Open search" },
      { key: "Ctrl/Cmd + ,", description: "Open settings" },
      { key: "Ctrl/Cmd + Shift + A", description: "Toggle archive view" },
      { key: "Ctrl/Cmd + S", description: "Save manually" },
      { key: "Ctrl/Cmd + E", description: "Export data" },
      { key: "Escape", description: "Close modals" },
    ],
  }
}
