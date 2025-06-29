"use client"

import { useState, useCallback } from "react"
import type { Sprint, Story, Settings, StorageInfo, ConnectionStatus } from "@/types"

// Mock data for demonstration
const mockSprints: Sprint[] = [
  {
    id: "priority-1",
    name: "Priority Sprint",
    type: "priority",
    position: 0,
    isActive: true,
    stories: [
      {
        id: "story-1",
        number: "TUNE-001",
        title: "User Authentication System",
        description: "Implement secure user login and registration",
        tags: ["auth", "security"],
        status: "open",
        priority: "high",
        createdAt: new Date("2025-06-28"),
        updatedAt: new Date("2025-06-28"),
        sprintId: "priority-1",
      },
      {
        id: "story-2",
        number: "TUNE-002",
        title: "Password Reset Flow",
        description: "Allow users to reset their passwords via email",
        tags: ["auth", "email"],
        status: "completed",
        priority: "medium",
        createdAt: new Date("2025-06-27"),
        updatedAt: new Date("2025-06-27"),
        completedAt: new Date("2025-06-27"),
        sprintId: "priority-1",
      },
      {
        id: "story-3",
        number: "TUNE-003",
        title: "Dashboard Layout Design",
        description: "Create responsive dashboard layout",
        tags: ["ui", "design"],
        status: "open",
        priority: "medium",
        createdAt: new Date("2025-06-28"),
        updatedAt: new Date("2025-06-28"),
        sprintId: "priority-1",
      },
      {
        id: "story-4",
        number: "TUNE-004",
        title: "API Integration Setup",
        description: "Set up API endpoints and integration",
        tags: ["api", "backend"],
        status: "open",
        priority: "high",
        createdAt: new Date("2025-06-28"),
        updatedAt: new Date("2025-06-28"),
        sprintId: "priority-1",
      },
      {
        id: "story-5",
        number: "TUNE-005",
        title: "Mobile Responsive Updates",
        description: "Ensure mobile compatibility",
        tags: ["mobile", "responsive"],
        status: "open",
        priority: "low",
        createdAt: new Date("2025-06-28"),
        updatedAt: new Date("2025-06-28"),
        sprintId: "priority-1",
      },
    ],
    createdAt: new Date("2025-06-25"),
    layout: "single",
  },
  {
    id: "development-1",
    name: "Development Sprint",
    type: "custom",
    position: 1,
    isActive: true,
    stories: [
      {
        id: "story-6",
        number: "TUNE-006",
        title: "Database Schema Migration",
        description: "Update database schema for new features",
        tags: ["database", "migration"],
        status: "open",
        priority: "high",
        createdAt: new Date("2025-06-28"),
        updatedAt: new Date("2025-06-28"),
        sprintId: "development-1",
      },
      {
        id: "story-7",
        number: "TUNE-007",
        title: "Search Functionality",
        description: "Implement advanced search features",
        tags: ["search", "feature"],
        status: "open",
        priority: "medium",
        createdAt: new Date("2025-06-28"),
        updatedAt: new Date("2025-06-28"),
        sprintId: "development-1",
      },
      {
        id: "story-8",
        number: "TUNE-008",
        title: "Unit Test Coverage",
        description: "Increase test coverage to 90%",
        tags: ["testing", "quality"],
        status: "completed",
        priority: "medium",
        createdAt: new Date("2025-06-26"),
        updatedAt: new Date("2025-06-26"),
        completedAt: new Date("2025-06-26"),
        sprintId: "development-1",
      },
      {
        id: "story-9",
        number: "TUNE-009",
        title: "Performance Optimization",
        description: "Optimize application performance",
        tags: ["performance", "optimization"],
        status: "open",
        priority: "medium",
        createdAt: new Date("2025-06-28"),
        updatedAt: new Date("2025-06-28"),
        sprintId: "development-1",
      },
      {
        id: "story-10",
        number: "TUNE-010",
        title: "Error Handling Framework",
        description: "Implement comprehensive error handling",
        tags: ["error", "framework"],
        status: "open",
        priority: "low",
        createdAt: new Date("2025-06-28"),
        updatedAt: new Date("2025-06-28"),
        sprintId: "development-1",
      },
    ],
    createdAt: new Date("2025-06-25"),
    layout: "single",
  },
  {
    id: "backlog-1",
    name: "Backlog - Future Enhancements",
    type: "backlog",
    position: 999,
    isActive: true,
    stories: [
      {
        id: "story-11",
        number: "TUNE-011",
        title: "Social Media Integration",
        description: "Connect with social media platforms",
        tags: ["social", "integration"],
        status: "open",
        priority: "low",
        createdAt: new Date("2025-06-28"),
        updatedAt: new Date("2025-06-28"),
        sprintId: "backlog-1",
      },
      {
        id: "story-12",
        number: "TUNE-012",
        title: "Advanced Analytics Dashboard",
        description: "Create detailed analytics views",
        tags: ["analytics", "dashboard"],
        status: "open",
        priority: "low",
        createdAt: new Date("2025-06-28"),
        updatedAt: new Date("2025-06-28"),
        sprintId: "backlog-1",
      },
      {
        id: "story-13",
        number: "TUNE-013",
        title: "Multi-language Support",
        description: "Add internationalization support",
        tags: ["i18n", "localization"],
        status: "open",
        priority: "low",
        createdAt: new Date("2025-06-28"),
        updatedAt: new Date("2025-06-28"),
        sprintId: "backlog-1",
      },
      {
        id: "story-14",
        number: "TUNE-014",
        title: "Dark Mode Theme",
        description: "Implement dark mode UI theme",
        tags: ["theme", "ui"],
        status: "open",
        priority: "low",
        createdAt: new Date("2025-06-28"),
        updatedAt: new Date("2025-06-28"),
        sprintId: "backlog-1",
      },
      {
        id: "story-15",
        number: "TUNE-015",
        title: "Email Notification System",
        description: "Send automated email notifications",
        tags: ["email", "notifications"],
        status: "open",
        priority: "low",
        createdAt: new Date("2025-06-28"),
        updatedAt: new Date("2025-06-28"),
        sprintId: "backlog-1",
      },
      {
        id: "story-16",
        number: "TUNE-016",
        title: "Advanced Search Filters",
        description: "Add complex search filtering options",
        tags: ["search", "filters"],
        status: "open",
        priority: "low",
        createdAt: new Date("2025-06-28"),
        updatedAt: new Date("2025-06-28"),
        sprintId: "backlog-1",
      },
      {
        id: "story-17",
        number: "TUNE-017",
        title: "File Upload Enhancement",
        description: "Improve file upload functionality",
        tags: ["upload", "files"],
        status: "open",
        priority: "low",
        createdAt: new Date("2025-06-28"),
        updatedAt: new Date("2025-06-28"),
        sprintId: "backlog-1",
      },
      {
        id: "story-18",
        number: "TUNE-018",
        title: "Real-time Collaboration",
        description: "Enable real-time collaborative editing",
        tags: ["collaboration", "realtime"],
        status: "open",
        priority: "low",
        createdAt: new Date("2025-06-28"),
        updatedAt: new Date("2025-06-28"),
        sprintId: "backlog-1",
      },
      {
        id: "story-19",
        number: "TUNE-019",
        title: "API Rate Limiting",
        description: "Implement API rate limiting",
        tags: ["api", "security"],
        status: "open",
        priority: "low",
        createdAt: new Date("2025-06-28"),
        updatedAt: new Date("2025-06-28"),
        sprintId: "backlog-1",
      },
      {
        id: "story-20",
        number: "TUNE-020",
        title: "Advanced Security Features",
        description: "Enhance application security",
        tags: ["security", "advanced"],
        status: "open",
        priority: "low",
        createdAt: new Date("2025-06-28"),
        updatedAt: new Date("2025-06-28"),
        sprintId: "backlog-1",
      },
    ],
    createdAt: new Date("2025-06-25"),
    layout: "two-column",
  },
]

const defaultSettings: Settings = {
  storyPrefix: "TUNE",
  autoSaveInterval: 30000,
  openaiApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || "",
  theme: "light",
}

export function useHybridScrumData() {
  const [sprints, setSprints] = useState<Sprint[]>(mockSprints)
  const [archivedSprints, setArchivedSprints] = useState<Sprint[]>([])
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(new Date())
  const [connectionStatus] = useState<ConnectionStatus>({
    isOnline: true,
    queueLength: 0,
    supabaseAvailable: false,
  })

  const generateStoryNumber = useCallback((prefix: string) => {
    const allStories = getAllStories()
    const existingNumbers = allStories
      .map((s) => s.number)
      .filter((num) => num.startsWith(prefix))
      .map((num) => Number.parseInt(num.split("-")[1]))
      .filter((num) => !isNaN(num))

    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1
    return `${prefix}-${nextNumber.toString().padStart(3, "0")}`
  }, [])

  const getAllStories = useCallback(() => {
    return sprints.flatMap((sprint) => sprint.stories)
  }, [sprints])

  const addStory = useCallback(
    (sprintId: string, storyData: any) => {
      const newStory: Story = {
        id: `story-${Date.now()}`,
        number: generateStoryNumber(settings.storyPrefix),
        title: storyData.title,
        description: storyData.description || "",
        tags: storyData.tags || [],
        status: "open",
        priority: storyData.priority || "medium",
        createdAt: new Date(),
        updatedAt: new Date(),
        sprintId,
        assignee: storyData.assignee,
        estimatedHours: storyData.estimatedHours,
      }

      setSprints((prev) =>
        prev.map((sprint) => (sprint.id === sprintId ? { ...sprint, stories: [...sprint.stories, newStory] } : sprint)),
      )

      setLastSaved(new Date())
      return newStory
    },
    [generateStoryNumber, settings.storyPrefix],
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
    setLastSaved(new Date())
  }, [])

  const deleteStory = useCallback((storyId: string) => {
    setSprints((prev) =>
      prev.map((sprint) => ({
        ...sprint,
        stories: sprint.stories.filter((story) => story.id !== storyId),
      })),
    )
    setLastSaved(new Date())
  }, [])

  const moveStory = useCallback(
    (storyId: string, targetSprintId: string) => {
      setSprints((prev) => {
        const story = getAllStories().find((s) => s.id === storyId)
        if (!story) return prev

        return prev.map((sprint) => {
          if (sprint.id === story.sprintId) {
            return {
              ...sprint,
              stories: sprint.stories.filter((s) => s.id !== storyId),
            }
          }
          if (sprint.id === targetSprintId) {
            return {
              ...sprint,
              stories: [...sprint.stories, { ...story, sprintId: targetSprintId }],
            }
          }
          return sprint
        })
      })
      setLastSaved(new Date())
    },
    [getAllStories],
  )

  const addSprint = useCallback((sprintData: any) => {
    const newSprint: Sprint = {
      id: `sprint-${Date.now()}`,
      name: sprintData.name,
      description: sprintData.description,
      type: "custom",
      position: sprintData.position || Date.now(),
      isActive: true,
      stories: [],
      createdAt: new Date(),
      layout: sprintData.layout || "single",
    }

    setSprints((prev) => [...prev, newSprint])
    setLastSaved(new Date())
    return newSprint
  }, [])

  const updateSprint = useCallback((sprintId: string, updates: Partial<Sprint>) => {
    setSprints((prev) => prev.map((sprint) => (sprint.id === sprintId ? { ...sprint, ...updates } : sprint)))
    setLastSaved(new Date())
  }, [])

  const deleteSprint = useCallback((sprintId: string, moveStoriesToSprintId?: string) => {
    setSprints((prev) => {
      const sprintToDelete = prev.find((s) => s.id === sprintId)
      if (!sprintToDelete) return prev

      let updatedSprints = prev.filter((s) => s.id !== sprintId)

      if (moveStoriesToSprintId && sprintToDelete.stories.length > 0) {
        updatedSprints = updatedSprints.map((sprint) =>
          sprint.id === moveStoriesToSprintId
            ? {
                ...sprint,
                stories: [
                  ...sprint.stories,
                  ...sprintToDelete.stories.map((story) => ({
                    ...story,
                    sprintId: moveStoriesToSprintId,
                  })),
                ],
              }
            : sprint,
        )
      }

      return updatedSprints
    })
    setLastSaved(new Date())
  }, [])

  const archiveSprint = useCallback((sprintId: string) => {
    setSprints((prev) => {
      const sprintToArchive = prev.find((s) => s.id === sprintId)
      if (!sprintToArchive) return prev

      setArchivedSprints((archived) => [...archived, sprintToArchive])
      return prev.filter((s) => s.id !== sprintId)
    })
    setLastSaved(new Date())
  }, [])

  const restoreSprint = useCallback((sprintId: string) => {
    setArchivedSprints((prev) => {
      const sprintToRestore = prev.find((s) => s.id === sprintId)
      if (!sprintToRestore) return prev

      setSprints((sprints) => [...sprints, sprintToRestore])
      return prev.filter((s) => s.id !== sprintId)
    })
    setLastSaved(new Date())
  }, [])

  const reorderSprints = useCallback((sprintIds: string[]) => {
    setSprints((prev) => {
      const sprintMap = new Map(prev.map((s) => [s.id, s]))
      return sprintIds
        .map((id, index) => {
          const sprint = sprintMap.get(id)
          return sprint ? { ...sprint, position: index } : null
        })
        .filter(Boolean) as Sprint[]
    })
    setLastSaved(new Date())
  }, [])

  const getSprintProgress = useCallback(
    (sprintId: string) => {
      const sprint = sprints.find((s) => s.id === sprintId)
      if (!sprint || sprint.stories.length === 0) return 0

      const completedStories = sprint.stories.filter((s) => s.status === "completed").length
      return Math.round((completedStories / sprint.stories.length) * 100)
    },
    [sprints],
  )

  const manualSave = useCallback(async () => {
    setLastSaved(new Date())
  }, [])

  const getStorageInfo = useCallback((): StorageInfo => {
    const dataSize = JSON.stringify({ sprints, archivedSprints, settings }).length
    return {
      size: dataSize,
      lastBackup: lastSaved,
    }
  }, [sprints, archivedSprints, settings, lastSaved])

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
  }
}
