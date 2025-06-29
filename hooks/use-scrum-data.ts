"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { storage } from "@/lib/storage"
import type { Sprint, Story, Settings, StoryFormData, ConnectionStatus, StorageInfo } from "@/types"
import { toast } from "@/hooks/use-toast"

const DEFAULT_SETTINGS: Settings = {
  storyPrefix: "TUNE",
  autoSaveInterval: 30000, // 30 seconds fallback
  theme: "system",
}

const DEFAULT_SPRINTS: Sprint[] = [
  {
    id: "priority-sprint",
    name: "Priority Sprint",
    type: "priority",
    position: 0,
    isActive: true,
    layout: "single",
    stories: [],
    createdAt: new Date(),
  },
  {
    id: "backlog-sprint",
    name: "Backlog Sprint",
    type: "backlog",
    position: 999,
    isActive: true,
    layout: "two-column",
    stories: [],
    createdAt: new Date(),
  },
]

export function useScrumData() {
  const [sprints, setSprints] = useState<Sprint[]>(DEFAULT_SPRINTS)
  const [archivedSprints, setArchivedSprints] = useState<Sprint[]>([])
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [connectionStatus] = useState<ConnectionStatus>({
    isOnline: true,
    queueLength: 0,
    supabaseAvailable: false, // Always false - no Supabase
  })

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>()
  const fallbackSaveTimeoutRef = useRef<NodeJS.Timeout>()
  const hasInitialized = useRef(false)

  // Initialize data on mount
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true
      loadData()
    }
  }, [])

  // Auto-save on every change + fallback timer
  useEffect(() => {
    if (!isLoading && hasInitialized.current) {
      // Clear existing timeouts
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      if (fallbackSaveTimeoutRef.current) {
        clearTimeout(fallbackSaveTimeoutRef.current)
      }

      // Immediate save (debounced by 1 second)
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveData()
      }, 1000)

      // Fallback save every 30 seconds
      fallbackSaveTimeoutRef.current = setTimeout(() => {
        saveData()
        console.log("🔄 Fallback auto-save triggered")
      }, settings.autoSaveInterval)

      return () => {
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current)
        }
        if (fallbackSaveTimeoutRef.current) {
          clearTimeout(fallbackSaveTimeoutRef.current)
        }
      }
    }
  }, [sprints, archivedSprints, settings, isLoading])

  const loadData = async () => {
    try {
      setIsLoading(true)
      console.log("🔄 Loading scrum data...")

      const data = await storage.load()

      if (data && data.sprints.length > 0) {
        console.log("✅ Loaded existing data:", {
          sprints: data.sprints.length,
          archived: data.archivedSprints.length,
          totalStories: data.sprints.reduce((acc, s) => acc + s.stories.length, 0),
        })

        setSprints(data.sprints)
        setArchivedSprints(data.archivedSprints)
        setSettingsState({ ...DEFAULT_SETTINGS, ...data.settings })
        setLastSaved(data.lastSaved ? new Date(data.lastSaved) : null)
      } else {
        console.log("🆕 No existing data, using defaults")
        setSprints(DEFAULT_SPRINTS)
        setArchivedSprints([])
        setSettingsState(DEFAULT_SETTINGS)

        // Save defaults immediately
        await storage.save(DEFAULT_SPRINTS, [], DEFAULT_SETTINGS)
        setLastSaved(new Date())
      }
    } catch (error) {
      console.error("❌ Failed to load data:", error)
      toast({
        title: "Load Error",
        description: "Failed to load data. Using default configuration.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const saveData = async () => {
    try {
      console.log("💾 Auto-saving data...")
      await storage.save(sprints, archivedSprints, settings)
      setLastSaved(new Date())
      console.log("✅ Auto-save completed")
    } catch (error) {
      console.error("❌ Auto-save failed:", error)
    }
  }

  // Force immediate save (for modal closes and settings changes)
  const forceSave = useCallback(async () => {
    try {
      console.log("💾 Force saving data...")
      await storage.save(sprints, archivedSprints, settings)
      setLastSaved(new Date())
      console.log("✅ Force save completed")
    } catch (error) {
      console.error("❌ Force save failed:", error)
    }
  }, [sprints, archivedSprints, settings])

  // Generate next story number
  const generateStoryNumber = useCallback(() => {
    const allStories = [...sprints, ...archivedSprints].flatMap((sprint) => sprint.stories)
    const existingNumbers = allStories
      .map((story) => story.number)
      .filter((number) => number.startsWith(settings.storyPrefix))
      .map((number) => {
        const match = number.match(new RegExp(`${settings.storyPrefix}-(\\d+)`))
        return match ? Number.parseInt(match[1], 10) : 0
      })

    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1
    return `${settings.storyPrefix}-${nextNumber.toString().padStart(3, "0")}`
  }, [sprints, archivedSprints, settings.storyPrefix])

  // Add story
  const addStory = useCallback(
    (sprintId: string, storyData: StoryFormData) => {
      console.log("➕ Adding story to sprint:", sprintId, storyData.title)

      const newStory: Story = {
        id: crypto.randomUUID(),
        number: generateStoryNumber(),
        title: storyData.title,
        prompt: storyData.prompt,
        description: storyData.description,
        tags: storyData.tags || [],
        status: "open",
        priority: (storyData.priority as "low" | "medium" | "high") || "medium",
        estimatedHours: storyData.estimatedHours,
        assignee: storyData.assignee,
        sprintId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      setSprints((prev) => {
        const updated = prev.map((sprint) =>
          sprint.id === sprintId ? { ...sprint, stories: [...sprint.stories, newStory] } : sprint,
        )
        console.log("✅ Story added:", newStory.number)
        return updated
      })

      return newStory
    },
    [generateStoryNumber],
  )

  // Update story
  const updateStory = useCallback((storyId: string, updates: Partial<Story>) => {
    console.log("📝 Updating story:", storyId, updates)

    const updateInSprints = (sprintList: Sprint[]) =>
      sprintList.map((sprint) => ({
        ...sprint,
        stories: sprint.stories.map((story) =>
          story.id === storyId ? { ...story, ...updates, updatedAt: new Date() } : story,
        ),
      }))

    setSprints((prev) => updateInSprints(prev))
    setArchivedSprints((prev) => updateInSprints(prev))

    console.log("✅ Story updated:", storyId)
  }, [])

  // Archive stories
  const archiveStories = useCallback((storyIds: string[]) => {
    console.log("📦 Archiving stories:", storyIds)

    const storiesToArchive: Story[] = []

    setSprints((prev) =>
      prev.map((sprint) => {
        const remainingStories = sprint.stories.filter((story) => {
          if (storyIds.includes(story.id)) {
            storiesToArchive.push({
              ...story,
              status: "completed",
              completedAt: story.completedAt || new Date(),
              updatedAt: new Date(),
            })
            return false
          }
          return true
        })

        return { ...sprint, stories: remainingStories }
      }),
    )

    if (storiesToArchive.length > 0) {
      const archivedSprintId = `archived-${Date.now()}`
      const archivedSprint: Sprint = {
        id: archivedSprintId,
        name: `Archived Stories - ${new Date().toLocaleDateString()}`,
        type: "custom",
        position: 0,
        isActive: false,
        layout: "single",
        stories: storiesToArchive,
        createdAt: new Date(),
      }

      setArchivedSprints((prev) => [archivedSprint, ...prev])
      console.log("✅ Archived", storiesToArchive.length, "stories")
    }

    return storiesToArchive.length
  }, [])

  // Delete story
  const deleteStory = useCallback((storyId: string) => {
    console.log("🗑️ Deleting story:", storyId)

    const updateInSprints = (sprintList: Sprint[]) =>
      sprintList.map((sprint) => ({
        ...sprint,
        stories: sprint.stories.filter((story) => story.id !== storyId),
      }))

    setSprints((prev) => updateInSprints(prev))
    setArchivedSprints((prev) => updateInSprints(prev))

    console.log("✅ Story deleted:", storyId)
  }, [])

  // Move story between sprints
  const moveStory = useCallback((storyId: string, targetSprintId: string) => {
    console.log("🔄 Moving story:", storyId, "to sprint:", targetSprintId)

    let storyToMove: Story | null = null

    setSprints((prev) =>
      prev.map((sprint) => {
        const storyIndex = sprint.stories.findIndex((s) => s.id === storyId)
        if (storyIndex !== -1) {
          storyToMove = { ...sprint.stories[storyIndex], sprintId: targetSprintId, updatedAt: new Date() }
          return {
            ...sprint,
            stories: sprint.stories.filter((s) => s.id !== storyId),
          }
        }
        return sprint
      }),
    )

    if (storyToMove) {
      setSprints((prev) =>
        prev.map((sprint) =>
          sprint.id === targetSprintId ? { ...sprint, stories: [...sprint.stories, storyToMove!] } : sprint,
        ),
      )
      console.log("✅ Story moved:", storyId)
    }
  }, [])

  // Add sprint
  const addSprint = useCallback(
    (sprintData: { name: string; description?: string; position?: number }) => {
      console.log("➕ Adding sprint:", sprintData.name)

      const newSprint: Sprint = {
        id: crypto.randomUUID(),
        name: sprintData.name,
        description: sprintData.description,
        type: "custom",
        position: sprintData.position || sprints.length,
        isActive: true,
        layout: "single",
        stories: [],
        createdAt: new Date(),
      }

      setSprints((prev) => [...prev, newSprint])
      console.log("✅ Sprint added:", newSprint.name)

      return newSprint
    },
    [sprints.length],
  )

  // Update sprint
  const updateSprint = useCallback((sprintId: string, updates: Partial<Sprint>) => {
    console.log("📝 Updating sprint:", sprintId, updates)

    setSprints((prev) => prev.map((sprint) => (sprint.id === sprintId ? { ...sprint, ...updates } : sprint)))

    console.log("✅ Sprint updated:", sprintId)
  }, [])

  // Delete sprint
  const deleteSprint = useCallback(
    (sprintId: string) => {
      const sprintToDelete = sprints.find((s) => s.id === sprintId)

      if (!sprintToDelete || sprintToDelete.type === "priority" || sprintToDelete.type === "backlog") {
        toast({
          title: "Cannot Delete",
          description: "Priority and Backlog sprints cannot be deleted.",
          variant: "destructive",
        })
        return
      }

      console.log("🗑️ Deleting sprint:", sprintToDelete.name)

      const backlogSprint = sprints.find((s) => s.type === "backlog")
      if (backlogSprint && sprintToDelete.stories.length > 0) {
        setSprints((prev) =>
          prev.map((sprint) => {
            if (sprint.id === backlogSprint.id) {
              return {
                ...sprint,
                stories: [
                  ...sprint.stories,
                  ...sprintToDelete.stories.map((story) => ({
                    ...story,
                    sprintId: backlogSprint.id,
                    updatedAt: new Date(),
                  })),
                ],
              }
            }
            return sprint
          }),
        )
      }

      setSprints((prev) => prev.filter((sprint) => sprint.id !== sprintId))
      console.log("✅ Sprint deleted:", sprintToDelete.name)
    },
    [sprints],
  )

  // Archive sprint
  const archiveSprint = useCallback(
    (sprintId: string) => {
      const sprintToArchive = sprints.find((s) => s.id === sprintId)
      if (!sprintToArchive) return

      if (sprintToArchive.type === "priority" || sprintToArchive.type === "backlog") {
        toast({
          title: "Cannot Archive",
          description: "Priority and Backlog sprints cannot be archived.",
          variant: "destructive",
        })
        return
      }

      console.log("📦 Archiving sprint:", sprintToArchive.name)

      const archivedSprint = {
        ...sprintToArchive,
        isActive: false,
        stories: sprintToArchive.stories.map((story) => ({
          ...story,
          status: "completed" as const,
          completedAt: story.completedAt || new Date(),
          updatedAt: new Date(),
        })),
      }

      setSprints((prev) => prev.filter((sprint) => sprint.id !== sprintId))
      setArchivedSprints((prev) => [archivedSprint, ...prev])

      console.log("✅ Sprint archived:", sprintToArchive.name)
    },
    [sprints],
  )

  // Restore sprint
  const restoreSprint = useCallback(
    (sprintId: string) => {
      const sprintToRestore = archivedSprints.find((s) => s.id === sprintId)
      if (!sprintToRestore) return

      console.log("🔄 Restoring sprint:", sprintToRestore.name)

      const restoredSprint = {
        ...sprintToRestore,
        isActive: true,
        position: sprints.length,
      }

      setArchivedSprints((prev) => prev.filter((sprint) => sprint.id !== sprintId))
      setSprints((prev) => [...prev, restoredSprint])

      console.log("✅ Sprint restored:", sprintToRestore.name)
    },
    [archivedSprints, sprints.length],
  )

  // Reorder sprints
  const reorderSprints = useCallback((sprintIds: string[]) => {
    console.log("🔄 Reordering sprints:", sprintIds)

    setSprints((prev) => {
      const reordered = sprintIds
        .map((id, index) => {
          const sprint = prev.find((s) => s.id === id)
          return sprint ? { ...sprint, position: index } : null
        })
        .filter(Boolean) as Sprint[]

      return reordered
    })

    console.log("✅ Sprints reordered")
  }, [])

  // Get all stories
  const getAllStories = useCallback(() => {
    return sprints.flatMap((sprint) => sprint.stories)
  }, [sprints])

  // Get sprint progress
  const getSprintProgress = useCallback(
    (sprintId: string) => {
      const sprint = sprints.find((s) => s.id === sprintId)
      if (!sprint) return { toDo: 0, inProgress: 0, done: 0 }

      return {
        toDo: sprint.stories.filter((s) => s.status === "open").length,
        inProgress: sprint.stories.filter((s) => s.status === "in-progress").length,
        done: sprint.stories.filter((s) => s.status === "completed").length,
      }
    },
    [sprints],
  )

  // Update settings with immediate save
  const setSettings = useCallback(
    (newSettings: Partial<Settings>) => {
      console.log("⚙️ Updating settings:", newSettings)

      setSettingsState((prev) => {
        const updated = { ...prev, ...newSettings }
        // Force immediate save when settings change
        setTimeout(() => forceSave(), 100)
        return updated
      })
    },
    [forceSave],
  )

  // Get storage info
  const getStorageInfo = useCallback((): StorageInfo => {
    const info = storage.getStorageInfo()
    return {
      size: info.size,
      lastBackup: info.lastSaved,
    }
  }, [])

  // Export data
  const exportData = useCallback(() => {
    try {
      const data = storage.exportData()
      const blob = new Blob([data], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `scrum-board-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Export Complete",
        description: "Your data has been exported successfully.",
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      })
    }
  }, [])

  // Import data
  const importData = useCallback(async (file: File) => {
    try {
      const text = await file.text()
      const data = await storage.importData(text)

      setSprints(data.sprints)
      setArchivedSprints(data.archivedSprints)
      setSettingsState(data.settings)
      setLastSaved(new Date(data.lastSaved))

      toast({
        title: "Import Complete",
        description: "Your data has been imported successfully.",
      })
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to import data. Please check the file format.",
        variant: "destructive",
      })
      throw error
    }
  }, [])

  return {
    sprints,
    archivedSprints,
    settings,
    isLoading,
    lastSaved,
    connectionStatus,
    addStory,
    updateStory,
    deleteStory,
    moveStory,
    archiveStories,
    addSprint,
    updateSprint,
    deleteSprint,
    archiveSprint,
    restoreSprint,
    reorderSprints,
    getAllStories,
    getSprintProgress,
    setSettings,
    getStorageInfo,
    exportData,
    importData,
    forceSave, // Export force save for modal closes
    // Recovery methods
    listBackups: () => storage.listBackups(),
    restoreFromBackup: async (backupId: string) => {
      const data = await storage.restoreFromBackup(backupId)
      setSprints(data.sprints)
      setArchivedSprints(data.archivedSprints)
      setSettingsState(data.settings)
      setLastSaved(new Date(data.lastSaved))
    },
  }
}
