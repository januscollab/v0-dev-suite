import { getSupabaseClient, isSupabaseAvailable } from "./supabase"
import type { Sprint, Story, Settings } from "@/types"
import type { Database } from "@/types/database"

type SupabaseSprint = Database["public"]["Tables"]["sprints"]["Row"]
type SupabaseStory = Database["public"]["Tables"]["stories"]["Row"]
type SupabaseSettings = Database["public"]["Tables"]["user_settings"]["Row"]

export class SimpleStorage {
  private supabase = getSupabaseClient()
  private isOnline = true
  private supabaseAvailable = isSupabaseAvailable()

  constructor() {
    this.checkConnection()
    this.setupOfflineHandling()

    if (!this.supabaseAvailable) {
      console.log("Running in local-only mode - Supabase not configured")
    }
  }

  private checkConnection() {
    this.isOnline = typeof window !== "undefined" ? navigator.onLine : true
  }

  private setupOfflineHandling() {
    if (typeof window === "undefined") return

    window.addEventListener("online", () => {
      this.isOnline = true
    })

    window.addEventListener("offline", () => {
      this.isOnline = false
    })
  }

  // Convert Supabase data to app format
  private convertSupabaseSprintToApp(sprint: SupabaseSprint, stories: SupabaseStory[] = []): Sprint {
    return {
      id: sprint.id,
      name: sprint.name,
      description: sprint.description || undefined,
      type: sprint.type,
      position: sprint.position,
      isActive: sprint.is_active,
      layout: sprint.layout,
      stories: stories.map(this.convertSupabaseStoryToApp),
      createdAt: new Date(sprint.created_at),
      startDate: sprint.start_date ? new Date(sprint.start_date) : undefined,
      endDate: sprint.end_date ? new Date(sprint.end_date) : undefined,
    }
  }

  private convertSupabaseStoryToApp(story: SupabaseStory): Story {
    return {
      id: story.id,
      number: story.number,
      title: story.title,
      description: story.description || "",
      prompt: story.prompt || undefined,
      tags: story.tags || [],
      status: story.status,
      priority: story.priority,
      assignee: story.assignee || undefined,
      estimatedHours: story.estimated_hours || undefined,
      sprintId: story.sprint_id,
      createdAt: new Date(story.created_at),
      updatedAt: new Date(story.updated_at),
      completedAt: story.completed_at ? new Date(story.completed_at) : undefined,
    }
  }

  private convertSupabaseSettingsToApp(settings: SupabaseSettings): Settings {
    return {
      openaiApiKey: settings.openai_api_key || undefined,
      storyPrefix: settings.story_prefix,
      autoSaveInterval: settings.auto_save_interval,
      theme: settings.theme,
    }
  }

  // Load data from storage
  async loadData(): Promise<{ sprints: Sprint[]; archivedSprints: Sprint[]; settings: Settings } | null> {
    console.log("🔄 Loading data from storage...")

    // First try localStorage for immediate display
    const localData = this.loadFromLocalStorage()
    console.log("📱 Local data loaded:", localData ? "Found" : "Not found")

    // If Supabase not available or offline, use local storage only
    if (!this.supabaseAvailable || !this.isOnline || !this.supabase) {
      console.log("🔌 Using local storage only")
      return localData
    }

    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser()

      if (!user) {
        console.log("👤 No authenticated user, using local storage")
        return localData
      }

      // For simplicity, we'll just use localStorage for now
      // In a full implementation, you'd sync with Supabase here
      console.log("☁️ Supabase available but using localStorage for simplicity")
      return localData
    } catch (error) {
      console.error("❌ Failed to load from Supabase, using localStorage:", error)
      return localData
    }
  }

  // Save data to storage
  async saveData(sprints: Sprint[], archivedSprints: Sprint[], settings: Settings): Promise<void> {
    console.log("💾 Saving data...")

    // Always save to localStorage first
    this.saveToLocalStorage({ sprints, archivedSprints, settings })

    // If Supabase not available, just save locally
    if (!this.supabaseAvailable || !this.supabase) {
      console.log("📱 Supabase not available, data saved locally only")
      return
    }

    if (!this.isOnline) {
      console.log("📡 Offline - data saved locally only")
      return
    }

    try {
      // For simplicity, we'll just use localStorage for now
      // In a full implementation, you'd sync with Supabase here
      console.log("☁️ Supabase available but using localStorage for simplicity")
    } catch (error) {
      console.error("❌ Failed to save to Supabase:", error)
    }
  }

  // Local storage methods
  private saveToLocalStorage(data: { sprints: Sprint[]; archivedSprints: Sprint[]; settings: Settings }): void {
    try {
      localStorage.setItem("scrum-sprints", JSON.stringify(data.sprints))
      localStorage.setItem("scrum-archived-sprints", JSON.stringify(data.archivedSprints))
      localStorage.setItem("scrum-settings", JSON.stringify(data.settings))
      localStorage.setItem("scrum-last-saved", new Date().toISOString())

      console.log("📱 Data saved to localStorage")
    } catch (error) {
      console.error("❌ Failed to save to localStorage:", error)
    }
  }

  private loadFromLocalStorage(): { sprints: Sprint[]; archivedSprints: Sprint[]; settings: Settings } | null {
    try {
      const sprintsData = localStorage.getItem("scrum-sprints")
      const archivedSprintsData = localStorage.getItem("scrum-archived-sprints")
      const settingsData = localStorage.getItem("scrum-settings")

      if (!sprintsData) {
        console.log("📱 No local data found")
        return null
      }

      const sprints = JSON.parse(sprintsData).map((sprint: any) => ({
        ...sprint,
        createdAt: new Date(sprint.createdAt),
        startDate: sprint.startDate ? new Date(sprint.startDate) : undefined,
        endDate: sprint.endDate ? new Date(sprint.endDate) : undefined,
        stories: sprint.stories.map((story: any) => ({
          ...story,
          createdAt: new Date(story.createdAt),
          updatedAt: new Date(story.updatedAt),
          completedAt: story.completedAt ? new Date(story.completedAt) : undefined,
        })),
      }))

      const archivedSprints = archivedSprintsData
        ? JSON.parse(archivedSprintsData).map((sprint: any) => ({
            ...sprint,
            createdAt: new Date(sprint.createdAt),
            startDate: sprint.startDate ? new Date(sprint.startDate) : undefined,
            endDate: sprint.endDate ? new Date(sprint.endDate) : undefined,
            stories: sprint.stories.map((story: any) => ({
              ...story,
              createdAt: new Date(story.createdAt),
              updatedAt: new Date(story.updatedAt),
              completedAt: story.completedAt ? new Date(story.completedAt) : undefined,
            })),
          }))
        : []

      const settings = settingsData
        ? JSON.parse(settingsData)
        : { storyPrefix: "TUNE", autoSaveInterval: 30000, theme: "system" }

      console.log("📱 Data loaded from localStorage")
      return { sprints, archivedSprints, settings }
    } catch (error) {
      console.error("❌ Failed to load from localStorage:", error)
      return null
    }
  }

  // Get connection status
  getConnectionStatus(): { isOnline: boolean; queueLength: number; supabaseAvailable: boolean } {
    return {
      isOnline: this.isOnline,
      queueLength: 0,
      supabaseAvailable: this.supabaseAvailable,
    }
  }
}
