"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { Story, Sprint, Settings } from "@/types"
import { useEnhancedPersistence } from "./use-enhanced-persistence"
import { toast } from "@/hooks/use-toast"

const DEFAULT_SETTINGS: Settings = {
  storyPrefix: "TUNE",
  autoSaveInterval: 10000, // 10 seconds for better data safety
  theme: "system",
}

const DEFAULT_SPRINTS: Sprint[] = [
  {
    id: "priority",
    name: "Priority Sprint",
    type: "priority",
    position: 0,
    isActive: true,
    stories: [],
    createdAt: new Date(),
    layout: "single",
  },
  {
    id: "backlog",
    name: "Backlog",
    type: "backlog",
    position: 999,
    isActive: true,
    stories: [],
    createdAt: new Date(),
    layout: "two-column",
  },
]

export function useScrumDataEnhanced() {
  const [sprints, setSprints] = useState<Sprint[]>(DEFAULT_SPRINTS)
  const [archivedSprints, setArchivedSprints] = useState<Sprint[]>([])
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [storyCounter, setStoryCounter] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const { saveData, loadData, exportData, importData, getStorageInfo } = useEnhancedPersistence()
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>()
  const isInitializedRef = useRef(false)

  // Auto-save function with debouncing
  const triggerAutoSave = useCallback(async () => {
    if (!isInitializedRef.current) return

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    // Set new timeout
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveData(sprints, archivedSprints, settings, storyCounter)
        setLastSaved(new Date())
        console.log("Auto-save completed")
      } catch (error) {
        console.error("Auto-save failed:", error)
        toast({
          title: "Auto-save failed",
          description: "Your data might not be saved. Please try manually saving.",
          variant: "destructive",
        })
      }
    }, 1000) // 1 second debounce
  }, [sprints, archivedSprints, settings, storyCounter, saveData])

  // Load data on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true)
        const savedData = await loadData()

        if (savedData) {
          setSprints(savedData.sprints.length > 0 ? savedData.sprints : DEFAULT_SPRINTS)
          setArchivedSprints(savedData.archivedSprints || [])
          setSettings({ ...DEFAULT_SETTINGS, ...savedData.settings })
          setStoryCounter(savedData.storyCounter || 1)
          setLastSaved(new Date(savedData.timestamp))

          toast({
            title: "Data loaded successfully",
            description: `Restored ${savedData.sprints.reduce((acc, s) => acc + s.stories.length, 0)} stories across ${savedData.sprints.length} sprints`,
          })
        } else {
          // No saved data, use defaults
          setSprints(DEFAULT_SPRINTS)
          setArchivedSprints([])
          setSettings(DEFAULT_SETTINGS)
          setStoryCounter(1)

          toast({
            title: "Welcome to Scrum Master!",
            description: "Starting with a fresh board. Your data will be automatically saved.",
          })
        }

        isInitializedRef.current = true
      } catch (error) {
        console.error("Failed to initialize data:", error)
        toast({
          title: "Failed to load data",
          description: "Starting with default configuration. Please check your browser storage settings.",
          variant: "destructive",
        })
        isInitializedRef.current = true
      } finally {
        setIsLoading(false)
      }
    }

    initializeData()
  }, [loadData])

  // Auto-save when data changes
  useEffect(() => {
    if (isInitializedRef.current) {
      triggerAutoSave()
    }
  }, [triggerAutoSave])

  // Manual save function
  const manualSave = useCallback(async () => {
    try {
      await saveData(sprints, archivedSprints, settings, storyCounter)
      setLastSaved(new Date())
      toast({
        title: "Data saved successfully",
        description: "All your changes have been saved.",
      })
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save your data. Please try again.",
        variant: "destructive",
      })
    }
  }, [sprints, archivedSprints, settings, storyCounter, saveData])

  // Export function
  const handleExport = useCallback(() => {
    try {
      const exportedData = exportData(sprints, archivedSprints, settings, storyCounter)
      const blob = new Blob([exportedData], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `scrum-master-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Data exported",
        description: "Your backup file has been downloaded.",
      })
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export your data.",
        variant: "destructive",
      })
    }
  }, [sprints, archivedSprints, settings, storyCounter, exportData])

  // Import function
  const handleImport = useCallback(
    (file: File) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const importedData = importData(content)

          if (importedData) {
            setSprints(importedData.sprints)
            setArchivedSprints(importedData.archivedSprints || [])
            setSettings({ ...DEFAULT_SETTINGS, ...importedData.settings })
            setStoryCounter(importedData.storyCounter || 1)

            toast({
              title: "Data imported successfully",
              description: `Imported ${importedData.sprints.reduce((acc, s) => acc + s.stories.length, 0)} stories`,
            })
          } else {
            throw new Error("Invalid file format")
          }
        } catch (error) {
          toast({
            title: "Import failed",
            description: "The file format is invalid or corrupted.",
            variant: "destructive",
          })
        }
      }
      reader.readAsText(file)
    },
    [importData],
  )

  const generateStoryNumber = useCallback(() => {
    const number = `${settings.storyPrefix}-${storyCounter.toString().padStart(3, "0")}`
    setStoryCounter((prev) => prev + 1)
    return number
  }, [settings.storyPrefix, storyCounter])

  const addStory = useCallback(
    (sprintId: string, storyData: Omit<Story, "id" | "number" | "createdAt" | "updatedAt" | "sprintId">) => {
      const newStory: Story = {
        ...storyData,
        id: crypto.randomUUID(),
        number: generateStoryNumber(),
        sprintId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      setSprints((prev) =>
        prev.map((sprint) => (sprint.id === sprintId ? { ...sprint, stories: [...sprint.stories, newStory] } : sprint)),
      )

      return newStory
    },
    [generateStoryNumber],
  )

  const updateStory = useCallback((storyId: string, updates: Partial<Story>) => {
    setSprints((prev) =>
      prev.map((sprint) => ({
        ...sprint,
        stories: sprint.stories.map((story) =>
          story.id === storyId ? { ...story, ...updates, updatedAt: new Date() } : story,
        ),
      })),
    )
  }, [])

  const moveStory = useCallback((storyId: string, targetSprintId: string) => {
    setSprints((prev) => {
      const story = prev.flatMap((s) => s.stories).find((s) => s.id === storyId)
      if (!story) return prev

      return prev.map((sprint) => ({
        ...sprint,
        stories:
          sprint.id === targetSprintId
            ? [...sprint.stories, { ...story, sprintId: targetSprintId, updatedAt: new Date() }]
            : sprint.stories.filter((s) => s.id !== storyId),
      }))
    })
  }, [])

  const addSprint = useCallback((sprintData: Omit<Sprint, "id" | "createdAt" | "stories">) => {
    const newSprint: Sprint = {
      ...sprintData,
      id: crypto.randomUUID(),
      stories: [],
      createdAt: new Date(),
    }

    setSprints((prev) => [...prev, newSprint].sort((a, b) => a.position - b.position))
    return newSprint
  }, [])

  const updateSprint = useCallback((sprintId: string, updates: Partial<Sprint>) => {
    setSprints((prev) => prev.map((sprint) => (sprint.id === sprintId ? { ...sprint, ...updates } : sprint)))
  }, [])

  const deleteSprint = useCallback((sprintId: string, moveStoriesToSprintId?: string) => {
    setSprints((prev) => {
      const sprintToDelete = prev.find((s) => s.id === sprintId)
      if (!sprintToDelete) return prev

      let updatedSprints = prev.filter((s) => s.id !== sprintId)

      if (moveStoriesToSprintId && sprintToDelete.stories.length > 0) {
        updatedSprints = updatedSprints.map((sprint) =>
          sprint.id === moveStoriesToSprintId
            ? { ...sprint, stories: [...sprint.stories, ...sprintToDelete.stories] }
            : sprint,
        )
      }

      return updatedSprints
    })
  }, [])

  const reorderSprints = useCallback((newSprintOrder: Sprint[]) => {
    const updatedSprints = newSprintOrder.map((sprint, index) => ({
      ...sprint,
      position: sprint.type === "priority" ? 0 : sprint.type === "backlog" ? 999 : index + 1,
    }))
    setSprints(updatedSprints)
  }, [])

  const archiveSprint = useCallback((sprintId: string) => {
    setSprints((prev) => {
      const sprintToArchive = prev.find((s) => s.id === sprintId)
      if (!sprintToArchive) return prev

      setArchivedSprints((archived) => [...archived, { ...sprintToArchive, isActive: false }])
      return prev.filter((s) => s.id !== sprintId)
    })
  }, [])

  const restoreSprint = useCallback((sprintId: string) => {
    setArchivedSprints((prev) => {
      const sprintToRestore = prev.find((s) => s.id === sprintId)
      if (!sprintToRestore) return prev

      setSprints((active) =>
        [...active, { ...sprintToRestore, isActive: true }].sort((a, b) => a.position - b.position),
      )
      return prev.filter((s) => s.id !== sprintId)
    })
  }, [])

  const getAllStories = useCallback(() => {
    return sprints.flatMap((sprint) => sprint.stories)
  }, [sprints])

  const getSprintProgress = useCallback(
    (sprintId: string) => {
      const sprint = sprints.find((s) => s.id === sprintId)
      if (!sprint || sprint.stories.length === 0) return 0

      const completedStories = sprint.stories.filter((s) => s.status === "completed").length
      return Math.round((completedStories / sprint.stories.length) * 100)
    },
    [sprints],
  )

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...updates }))
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])

  return {
    sprints,
    archivedSprints,
    settings,
    isLoading,
    lastSaved,
    addStory,
    updateStory,
    moveStory,
    addSprint,
    updateSprint,
    deleteSprint,
    reorderSprints,
    archiveSprint,
    restoreSprint,
    getAllStories,
    getSprintProgress,
    setSettings: updateSettings,
    manualSave,
    handleExport,
    handleImport,
    getStorageInfo,
  }
}
