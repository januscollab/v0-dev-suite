"use client"

import { useState, useEffect, useCallback } from "react"
import type { Sprint, Story, Settings, StorageInfo } from "@/types"

const STORAGE_KEYS = {
  SPRINTS: "scrum-sprints",
  STORIES: "scrum-stories",
  SETTINGS: "scrum-settings",
  LAST_SAVED: "scrum-last-saved",
}

const DEFAULT_SETTINGS: Settings = {
  storyPrefix: "TUNE",
  autoSaveInterval: 30000,
  theme: "system",
}

export function useEnhancedPersistence() {
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [stories, setStories] = useState<Story[]>([])
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load data from localStorage
  const loadData = useCallback(() => {
    try {
      const savedSprints = localStorage.getItem(STORAGE_KEYS.SPRINTS)
      const savedStories = localStorage.getItem(STORAGE_KEYS.STORIES)
      const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS)
      const savedLastSaved = localStorage.getItem(STORAGE_KEYS.LAST_SAVED)

      if (savedSprints) {
        const parsedSprints = JSON.parse(savedSprints).map((sprint: any) => ({
          ...sprint,
          createdAt: new Date(sprint.createdAt),
          startDate: sprint.startDate ? new Date(sprint.startDate) : undefined,
          endDate: sprint.endDate ? new Date(sprint.endDate) : undefined,
        }))
        setSprints(parsedSprints)
      } else {
        // Create default sprints
        const defaultSprints: Sprint[] = [
          {
            id: "priority-sprint",
            name: "Priority Sprint",
            type: "priority",
            position: 0,
            isActive: true,
            stories: [],
            createdAt: new Date(),
            layout: "single",
          },
          {
            id: "backlog-sprint",
            name: "Backlog",
            type: "backlog",
            position: 999,
            isActive: true,
            stories: [],
            createdAt: new Date(),
            layout: "two-column",
          },
        ]
        setSprints(defaultSprints)
      }

      if (savedStories) {
        const parsedStories = JSON.parse(savedStories).map((story: any) => ({
          ...story,
          createdAt: new Date(story.createdAt),
          updatedAt: new Date(story.updatedAt),
          completedAt: story.completedAt ? new Date(story.completedAt) : undefined,
          tags: story.tags || [],
        }))
        setStories(parsedStories)
      }

      if (savedSettings) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) })
      }

      if (savedLastSaved) {
        setLastSaved(new Date(savedLastSaved))
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save data to localStorage
  const saveData = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SPRINTS, JSON.stringify(sprints))
      localStorage.setItem(STORAGE_KEYS.STORIES, JSON.stringify(stories))
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
      const now = new Date()
      localStorage.setItem(STORAGE_KEYS.LAST_SAVED, now.toISOString())
      setLastSaved(now)
    } catch (error) {
      console.error("Error saving data:", error)
    }
  }, [sprints, stories, settings])

  // Get storage info
  const getStorageInfo = useCallback((): StorageInfo => {
    try {
      const sprintsSize = localStorage.getItem(STORAGE_KEYS.SPRINTS)?.length || 0
      const storiesSize = localStorage.getItem(STORAGE_KEYS.STORIES)?.length || 0
      const settingsSize = localStorage.getItem(STORAGE_KEYS.SETTINGS)?.length || 0

      return {
        size: sprintsSize + storiesSize + settingsSize,
        lastBackup: lastSaved,
      }
    } catch {
      return { size: 0, lastBackup: null }
    }
  }, [lastSaved])

  // Get last saved date
  const getLastSaved = useCallback(() => {
    return lastSaved
  }, [lastSaved])

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [loadData])

  // Auto-save
  useEffect(() => {
    if (!isLoading) {
      const timeoutId = setTimeout(saveData, 1000)
      return () => clearTimeout(timeoutId)
    }
  }, [sprints, stories, settings, isLoading, saveData])

  return {
    sprints,
    stories,
    settings,
    lastSaved,
    isLoading,
    setSprints,
    setStories,
    setSettings,
    saveData,
    loadData,
    getStorageInfo,
    getLastSaved,
  }
}
