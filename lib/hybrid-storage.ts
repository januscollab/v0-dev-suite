import { getSupabaseClient, isSupabaseAvailable } from "./supabase"
import type { Sprint, Story, Settings } from "@/types"
import type { Database } from "@/types/database"

type SupabaseSprint = Database["public"]["Tables"]["sprints"]["Row"]
type SupabaseStory = Database["public"]["Tables"]["stories"]["Row"]
type SupabaseSettings = Database["public"]["Tables"]["user_settings"]["Row"]

export class HybridStorage {
  private supabase = getSupabaseClient()
  private isOnline = true
  private syncQueue: Array<{ action: string; data: any }> = []
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
      if (this.supabaseAvailable) {
        this.processSyncQueue()
      }
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

  // Get current workspace ID
  private async getCurrentWorkspaceId(): Promise<string | null> {
    if (!this.supabase) return null

    const {
      data: { user },
    } = await this.supabase.auth.getUser()
    if (!user) return null

    const { data: workspaces } = await this.supabase
      .from("workspaces")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1)
      .single()

    return workspaces?.id || null
  }

  // Load data from storage - prioritize localStorage for immediate loading
  async loadData(): Promise<{ sprints: Sprint[]; archivedSprints: Sprint[]; settings: Settings } | null> {
    console.log("🔄 Loading data from storage...")

    // First try to load from localStorage for immediate display
    const localData = this.loadFromLocalStorage()
    console.log("📱 Local data loaded:", localData ? "Found" : "Not found")

    console.log("📊 Load Strategy:", {
      supabaseAvailable: this.supabaseAvailable,
      isOnline: this.isOnline,
      loadingFrom:
        this.supabaseAvailable && this.isOnline ? "Supabase (with localStorage fallback)" : "localStorage only",
    })

    // If Supabase not available or offline, use local storage only
    if (!this.supabaseAvailable || !this.isOnline || !this.supabase) {
      console.log("🔌 Using local storage only (Supabase unavailable or offline)")
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

      const workspaceId = await this.getCurrentWorkspaceId()
      if (!workspaceId) {
        console.log("🏢 No workspace found, creating default workspace")
        await this.createDefaultWorkspace(user.id)
        return localData // Return local data while workspace is being created
      }

      console.log("☁️ Loading from Supabase...")

      // Load sprints and stories from Supabase
      const { data: sprintsData, error: sprintsError } = await this.supabase
        .from("sprints")
        .select(`
          *,
          stories (*)
        `)
        .eq("workspace_id", workspaceId)
        .eq("is_active", true)

      if (sprintsError) throw sprintsError

      // Load archived sprints
      const { data: archivedSprintsData, error: archivedError } = await this.supabase
        .from("sprints")
        .select(`
          *,
          stories (*)
        `)
        .eq("workspace_id", workspaceId)
        .eq("is_active", false)

      if (archivedError) throw archivedError

      // Load user settings
      const { data: settingsData, error: settingsError } = await this.supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (settingsError && settingsError.code !== "PGRST116") {
        throw settingsError
      }

      const sprints = (sprintsData || []).map((sprint) => this.convertSupabaseSprintToApp(sprint, sprint.stories || []))

      const archivedSprints = (archivedSprintsData || []).map((sprint) =>
        this.convertSupabaseSprintToApp(sprint, sprint.stories || []),
      )

      const settings = settingsData
        ? this.convertSupabaseSettingsToApp(settingsData)
        : { storyPrefix: "TUNE", autoSaveInterval: 30000, theme: "system" as const }

      const cloudData = { sprints, archivedSprints, settings }

      console.log("☁️ Supabase data loaded successfully:", {
        sprints: sprints.length,
        stories: sprints.reduce((acc, s) => acc + s.stories.length, 0),
        archived: archivedSprints.length,
      })

      // Cache in localStorage for next time
      this.saveToLocalStorage(cloudData)

      return cloudData
    } catch (error) {
      console.error("❌ Failed to load from Supabase, using localStorage:", error)
      return localData
    }
  }

  // Save data to both localStorage and Supabase
  async saveData(sprints: Sprint[], archivedSprints: Sprint[], settings: Settings): Promise<void> {
    console.log("💾 Saving data...", {
      sprints: sprints.length,
      stories: sprints.reduce((acc, s) => acc + s.stories.length, 0),
      archived: archivedSprints.length,
    })

    // Always save to localStorage first for immediate persistence
    this.saveToLocalStorage({ sprints, archivedSprints, settings })

    console.log("💾 Data Strategy Status:", {
      supabaseAvailable: this.supabaseAvailable,
      isOnline: this.isOnline,
      strategy: this.supabaseAvailable && this.isOnline ? "Supabase + localStorage" : "localStorage only",
    })

    // If Supabase not available, just save locally
    if (!this.supabaseAvailable || !this.supabase) {
      console.log("📱 Supabase not available, data saved locally only")
      return
    }

    if (!this.isOnline) {
      this.queueForSync({ action: "saveData", data: { sprints, archivedSprints, settings } })
      console.log("📡 Offline - queued for sync")
      return
    }

    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser()
      if (!user) {
        console.log("👤 No authenticated user, data saved locally only")
        return
      }

      const workspaceId = await this.getCurrentWorkspaceId()
      if (!workspaceId) {
        console.log("🏢 No workspace found, data saved locally only")
        return
      }

      console.log("☁️ Saving to Supabase...")

      // Save settings first
      await this.supabase.from("user_settings").upsert({
        user_id: user.id,
        openai_api_key: settings.openaiApiKey || null,
        story_prefix: settings.storyPrefix,
        auto_save_interval: settings.autoSaveInterval,
        theme: settings.theme,
      })

      // Clear existing data to avoid conflicts
      const allSprintIds = [...sprints, ...archivedSprints].map((s) => s.id)

      if (allSprintIds.length > 0) {
        // Delete existing stories first
        await this.supabase.from("stories").delete().in("sprint_id", allSprintIds)

        // Delete existing sprints
        await this.supabase.from("sprints").delete().in("id", allSprintIds)
      }

      // Save all sprints (active and archived)
      const allSprints = [...sprints, ...archivedSprints]

      for (const sprint of allSprints) {
        console.log(`💾 Saving sprint: ${sprint.name} (${sprint.stories.length} stories)`)

        // Insert sprint
        const { error: sprintError } = await this.supabase.from("sprints").insert({
          id: sprint.id,
          workspace_id: workspaceId,
          name: sprint.name,
          description: sprint.description || null,
          type: sprint.type,
          position: sprint.position,
          is_active: sprint.isActive,
          layout: sprint.layout,
          start_date: sprint.startDate?.toISOString() || null,
          end_date: sprint.endDate?.toISOString() || null,
        })

        if (sprintError) {
          console.error("❌ Failed to save sprint:", sprint.name, sprintError)
          continue
        }

        // Insert stories for this sprint
        if (sprint.stories.length > 0) {
          const { error: storiesError } = await this.supabase.from("stories").insert(
            sprint.stories.map((story) => ({
              id: story.id,
              sprint_id: sprint.id,
              number: story.number,
              title: story.title,
              description: story.description || null,
              prompt: story.prompt || null,
              tags: story.tags,
              status: story.status,
              priority: story.priority,
              assignee: story.assignee || null,
              estimated_hours: story.estimatedHours || null,
              completed_at: story.completedAt?.toISOString() || null,
            })),
          )

          if (storiesError) {
            console.error("❌ Failed to save stories for sprint:", sprint.name, storiesError)
          } else {
            console.log(`✅ Saved ${sprint.stories.length} stories for sprint: ${sprint.name}`)
          }
        }
      }

      console.log("✅ Data synced to Supabase successfully")
    } catch (error) {
      console.error("❌ Failed to save to Supabase:", error)
      this.queueForSync({ action: "saveData", data: { sprints, archivedSprints, settings } })
    }
  }

  // Create default workspace for new users
  private async createDefaultWorkspace(userId: string): Promise<void> {
    if (!this.supabase) return

    const { error } = await this.supabase.from("workspaces").insert({
      name: "My Workspace",
      description: "Default workspace",
      owner_id: userId,
    })

    if (error) {
      console.error("❌ Failed to create default workspace:", error)
    } else {
      console.log("✅ Created default workspace")
    }
  }

  // Local storage methods with enhanced logging
  private saveToLocalStorage(data: { sprints: Sprint[]; archivedSprints: Sprint[]; settings: Settings }): void {
    try {
      const sprintsJson = JSON.stringify(data.sprints)
      const archivedJson = JSON.stringify(data.archivedSprints)
      const settingsJson = JSON.stringify(data.settings)

      localStorage.setItem("scrum-sprints", sprintsJson)
      localStorage.setItem("scrum-archived-sprints", archivedJson)
      localStorage.setItem("scrum-settings", settingsJson)
      localStorage.setItem("scrum-last-saved", new Date().toISOString())

      console.log("📱 Data saved to localStorage:", {
        sprints: data.sprints.length,
        stories: data.sprints.reduce((acc, s) => acc + s.stories.length, 0),
        archived: data.archivedSprints.length,
        size: `${Math.round((sprintsJson.length + archivedJson.length + settingsJson.length) / 1024)}KB`,
      })
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

      console.log("📱 Data loaded from localStorage:", {
        sprintsCount: sprints.length,
        archivedCount: archivedSprints.length,
        totalStories: sprints.reduce((acc, s) => acc + s.stories.length, 0),
      })

      return { sprints, archivedSprints, settings }
    } catch (error) {
      console.error("❌ Failed to load from localStorage:", error)
      return null
    }
  }

  // Sync queue management
  private queueForSync(item: { action: string; data: any }): void {
    if (this.supabaseAvailable) {
      this.syncQueue.push(item)
      console.log("📡 Queued for sync:", item.action)
    }
  }

  private async processSyncQueue(): Promise<void> {
    if (!this.supabaseAvailable) return

    console.log("📡 Processing sync queue:", this.syncQueue.length, "items")

    while (this.syncQueue.length > 0 && this.isOnline) {
      const item = this.syncQueue.shift()
      if (item) {
        try {
          if (item.action === "saveData") {
            await this.saveData(item.data.sprints, item.data.archivedSprints, item.data.settings)
          }
        } catch (error) {
          console.error("❌ Failed to process sync queue item:", error)
          // Re-queue if failed
          this.syncQueue.unshift(item)
          break
        }
      }
    }
  }

  // Get connection status
  getConnectionStatus(): { isOnline: boolean; queueLength: number; supabaseAvailable: boolean } {
    return {
      isOnline: this.isOnline,
      queueLength: this.syncQueue.length,
      supabaseAvailable: this.supabaseAvailable,
    }
  }

  // Get storage info
  async getStorageInfo(): Promise<{ size: number; lastBackup: Date | null }> {
    try {
      const data = await this.loadData()
      const size = JSON.stringify(data).length
      const lastSaved = localStorage.getItem("scrum-last-saved")
      return {
        size,
        lastBackup: lastSaved ? new Date(lastSaved) : null,
      }
    } catch {
      return { size: 0, lastBackup: null }
    }
  }

  getDataStrategy(): { primary: string; backup: string; status: string } {
    if (this.supabaseAvailable && this.isOnline) {
      return {
        primary: "Supabase",
        backup: "localStorage",
        status: "Hybrid mode active",
      }
    } else if (this.supabaseAvailable && !this.isOnline) {
      return {
        primary: "localStorage",
        backup: "Supabase (queued)",
        status: "Offline mode - will sync when online",
      }
    } else {
      return {
        primary: "localStorage",
        backup: "None",
        status: "Local-only mode - Supabase not configured",
      }
    }
  }
}
