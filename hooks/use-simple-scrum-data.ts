"use client"

import { useState, useEffect, useCallback } from "react"
import { SimpleStorage } from "@/lib/simple-storage"
import type { Sprint, Story, Settings, StoryFormData, ConnectionStatus, StorageInfo } from "@/types"
import { toast } from "@/hooks/use-toast"

const defaultSettings: Settings = {
  storyPrefix: "TUNE",
  autoSaveInterval: 30000,
  theme: "system",
}

// Create a single instance to prevent multiple initializations
let storageInstance: SimpleStorage | null = null

function getStorageInstance() {
  if (!storageInstance) {
    storageInstance = new SimpleStorage()
  }
  return storageInstance
}

export function useSimpleScrumData() {
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [archivedSprints, setArchivedSprints] = useState<Sprint[]>([])
  const [settings, setSettingsState] = useState<Settings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isOnline: true,
    queueLength: 0,
    supabaseAvailable: false,
  })

  const storage = getStorageInstance()

  // Initialize and load data
  useEffect(() => {
    loadData()
  }, [])

  // Auto-save when data changes
  useEffect(() => {
    if (!isLoading) {
      const timeoutId = setTimeout(() => {
        saveData()
      }, 2000)
      return () => clearTimeout(timeoutId)
    }
  }, [sprints, archivedSprints, settings, isLoading])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const data = await storage.loadData()

      if (data && data.sprints.length > 0) {
        setSprints(data.sprints)
        setArchivedSprints(data.archivedSprints)
        setSettingsState({ ...defaultSettings, ...data.settings })
      } else {
        // Create default sprints
        const defaultSprints = [
          {
            id: "priority-sprint",
            name: "Priority Sprint",
            type: "priority" as const,
            position: 0,
            isActive: true,
            layout: "single" as const,
            stories: [],
            createdAt: new Date(),
          },
          {
            id: "backlog-sprint",
            name: "Backlog Sprint",
            type: "backlog" as const,
            position: 999,
            isActive: true,
            layout: "two-column" as const,
            stories: [],
            createdAt: new Date(),
          },
        ]
        setSprints(defaultSprints)
        setArchivedSprints([])
        setSettingsState(defaultSettings)
      }
    } catch (error) {
      console.error("Failed to load data:", error)
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
      await storage.saveData(sprints, archivedSprints, settings)
      setLastSaved(new Date())
    } catch (error) {
      console.error("Failed to save data:", error)
    }
  }

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
        return updated
      })

      return newStory
    },
    [generateStoryNumber],
  )

  // Update story
  const updateStory = useCallback((storyId: string, updates: Partial<Story>) => {
    const updateInSprints = (sprintList: Sprint[]) =>
      sprintList.map((sprint) => ({
        ...sprint,
        stories: sprint.stories.map((story) =>
          story.id === storyId ? { ...story, ...updates, updatedAt: new Date() } : story,
        ),
      }))

    setSprints((prev) => updateInSprints(prev))
    setArchivedSprints((prev) => updateInSprints(prev))
  }, [])

  // Delete story
  const deleteStory = useCallback((storyId: string) => {
    const updateInSprints = (sprintList: Sprint[]) =>
      sprintList.map((sprint) => ({
        ...sprint,
        stories: sprint.stories.filter((story) => story.id !== storyId),
      }))

    setSprints((prev) => updateInSprints(prev))
    setArchivedSprints((prev) => updateInSprints(prev))
  }, [])

  // Move story between sprints
  const moveStory = useCallback((storyId: string, targetSprintId: string) => {
    let storyToMove: Story | null = null

    // Remove story from current sprint
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

    // Add story to target sprint
    if (storyToMove) {
      setSprints((prev) =>
        prev.map((sprint) =>
          sprint.id === targetSprintId ? { ...sprint, stories: [...sprint.stories, storyToMove!] } : sprint,
        ),
      )
    }
  }, [])

  // Add sprint
  const addSprint = useCallback(
    (sprintData: { name: string; description?: string; position?: number }) => {
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
      return newSprint
    },
    [sprints.length],
  )

  // Update sprint
  const updateSprint = useCallback((sprintId: string, updates: Partial<Sprint>) => {
    setSprints((prev) => prev.map((sprint) => (sprint.id === sprintId ? { ...sprint, ...updates } : sprint)))
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

      // Move stories to backlog before deleting sprint
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
    },
    [sprints],
  )

  // Restore sprint
  const restoreSprint = useCallback(
    (sprintId: string) => {
      const sprintToRestore = archivedSprints.find((s) => s.id === sprintId)
      if (!sprintToRestore) return

      const restoredSprint = {
        ...sprintToRestore,
        isActive: true,
        position: sprints.length,
      }

      setArchivedSprints((prev) => prev.filter((sprint) => sprint.id !== sprintId))
      setSprints((prev) => [...prev, restoredSprint])
    },
    [archivedSprints, sprints.length],
  )

  // Reorder sprints
  const reorderSprints = useCallback((sprintIds: string[]) => {
    setSprints((prev) => {
      const reordered = sprintIds
        .map((id, index) => {
          const sprint = prev.find((s) => s.id === id)
          return sprint ? { ...sprint, position: index } : null
        })
        .filter(Boolean) as Sprint[]

      return reordered
    })
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

  // Update settings
  const setSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettingsState((prev) => ({ ...prev, ...newSettings }))
  }, [])

  // Manual save
  const manualSave = useCallback(async () => {
    try {
      await storage.saveData(sprints, archivedSprints, settings)
      setLastSaved(new Date())
      toast({
        title: "Saved!",
        description: "Your data has been saved successfully.",
      })
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save data. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }, [sprints, archivedSprints, settings, storage])

  // Get storage info
  const getStorageInfo = useCallback((): StorageInfo => {
    const dataSize = JSON.stringify({ sprints, archivedSprints, settings }).length
    return {
      size: dataSize,
      lastBackup: lastSaved,
    }
  }, [sprints, archivedSprints, settings, lastSaved])

  // Export data
  const exportData = useCallback(() => {
    const data = {
      sprints,
      archivedSprints,
      settings,
      exportedAt: new Date().toISOString(),
      version: "1.0",
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
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
  }, [sprints, archivedSprints, settings])

  // Import data
  const importData = useCallback(
    async (file: File) => {
      try {
        const text = await file.text()
        const data = JSON.parse(text)

        if (data.sprints && data.settings) {
          setSprints(data.sprints)
          setArchivedSprints(data.archivedSprints || [])
          setSettingsState(data.settings)
          await storage.saveData(data.sprints, data.archivedSprints || [], data.settings)

          toast({
            title: "Import Complete",
            description: "Your data has been imported successfully.",
          })
        } else {
          throw new Error("Invalid file format")
        }
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Failed to import data. Please check the file format.",
          variant: "destructive",
        })
        throw error
      }
    },
    [storage],
  )

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
    addSprint,
    updateSprint,
    deleteSprint,
    archiveSprint,
    restoreSprint,
    reorderSprints,
    getAllStories,
    getSprintProgress,
    setSettings,
    manualSave,
    getStorageInfo,
    exportData,
    importData,
  }
}
