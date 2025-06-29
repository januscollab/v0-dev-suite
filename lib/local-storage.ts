import type { Sprint, Settings } from "@/types"

export class LocalStorage {
  private storageKey = "scrum-master-data"
  private backupKey = "scrum-master-backup"
  private maxBackups = 5

  // Save data with automatic backup
  async saveData(sprints: Sprint[], archivedSprints: Sprint[], settings: Settings): Promise<void> {
    try {
      const data = {
        sprints,
        archivedSprints,
        settings,
        lastSaved: new Date().toISOString(),
        version: "1.0",
      }

      // Create backup before saving new data
      this.createBackup()

      // Save current data
      localStorage.setItem(this.storageKey, JSON.stringify(data))
      localStorage.setItem(`${this.storageKey}-timestamp`, new Date().toISOString())

      console.log("✅ Data saved to localStorage:", {
        sprints: sprints.length,
        stories: sprints.reduce((acc, s) => acc + s.stories.length, 0),
        archived: archivedSprints.length,
        size: `${Math.round(JSON.stringify(data).length / 1024)}KB`,
      })
    } catch (error) {
      console.error("❌ Failed to save to localStorage:", error)
      throw error
    }
  }

  // Load data from localStorage
  async loadData(): Promise<{ sprints: Sprint[]; archivedSprints: Sprint[]; settings: Settings } | null> {
    try {
      const dataStr = localStorage.getItem(this.storageKey)
      if (!dataStr) {
        console.log("📱 No local data found")
        return null
      }

      const data = JSON.parse(dataStr)

      // Convert date strings back to Date objects
      const sprints = data.sprints.map((sprint: any) => ({
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

      const archivedSprints = (data.archivedSprints || []).map((sprint: any) => ({
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

      const settings = data.settings || {
        storyPrefix: "TUNE",
        autoSaveInterval: 30000,
        theme: "system",
      }

      console.log("📱 Data loaded from localStorage:", {
        sprints: sprints.length,
        archived: archivedSprints.length,
        totalStories: sprints.reduce((acc: number, s: Sprint) => acc + s.stories.length, 0),
      })

      return { sprints, archivedSprints, settings }
    } catch (error) {
      console.error("❌ Failed to load from localStorage:", error)
      return this.attemptRecovery()
    }
  }

  // Create backup of current data
  private createBackup(): void {
    try {
      const currentData = localStorage.getItem(this.storageKey)
      if (!currentData) return

      const backups = this.getBackups()
      const newBackup = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        data: currentData,
      }

      backups.unshift(newBackup)

      // Keep only the latest backups
      if (backups.length > this.maxBackups) {
        backups.splice(this.maxBackups)
      }

      localStorage.setItem(this.backupKey, JSON.stringify(backups))
      console.log(`📦 Backup created (${backups.length}/${this.maxBackups})`)
    } catch (error) {
      console.error("❌ Failed to create backup:", error)
    }
  }

  // Get all backups
  private getBackups(): Array<{ id: string; timestamp: string; data: string }> {
    try {
      const backupsStr = localStorage.getItem(this.backupKey)
      return backupsStr ? JSON.parse(backupsStr) : []
    } catch {
      return []
    }
  }

  // Attempt to recover from backup
  private attemptRecovery(): { sprints: Sprint[]; archivedSprints: Sprint[]; settings: Settings } | null {
    console.log("🔄 Attempting data recovery from backups...")

    const backups = this.getBackups()

    for (const backup of backups) {
      try {
        const data = JSON.parse(backup.data)
        console.log(`✅ Recovered from backup: ${backup.timestamp}`)

        // Restore the backup as current data
        localStorage.setItem(this.storageKey, backup.data)

        return this.parseBackupData(data)
      } catch (error) {
        console.log(`❌ Backup ${backup.id} corrupted, trying next...`)
        continue
      }
    }

    console.log("❌ All backups failed, returning null")
    return null
  }

  private parseBackupData(data: any): { sprints: Sprint[]; archivedSprints: Sprint[]; settings: Settings } {
    const sprints = (data.sprints || []).map((sprint: any) => ({
      ...sprint,
      createdAt: new Date(sprint.createdAt),
      startDate: sprint.startDate ? new Date(sprint.startDate) : undefined,
      endDate: sprint.endDate ? new Date(sprint.endDate) : undefined,
      stories: (sprint.stories || []).map((story: any) => ({
        ...story,
        createdAt: new Date(story.createdAt),
        updatedAt: new Date(story.updatedAt),
        completedAt: story.completedAt ? new Date(story.completedAt) : undefined,
      })),
    }))

    const archivedSprints = (data.archivedSprints || []).map((sprint: any) => ({
      ...sprint,
      createdAt: new Date(sprint.createdAt),
      startDate: sprint.startDate ? new Date(sprint.startDate) : undefined,
      endDate: sprint.endDate ? new Date(sprint.endDate) : undefined,
      stories: (sprint.stories || []).map((story: any) => ({
        ...story,
        createdAt: new Date(story.createdAt),
        updatedAt: new Date(story.updatedAt),
        completedAt: story.completedAt ? new Date(story.completedAt) : undefined,
      })),
    }))

    const settings = data.settings || {
      storyPrefix: "TUNE",
      autoSaveInterval: 30000,
      theme: "system",
    }

    return { sprints, archivedSprints, settings }
  }

  // Get storage info
  getStorageInfo(): { size: number; lastBackup: Date | null; backupCount: number } {
    try {
      const data = localStorage.getItem(this.storageKey)
      const timestamp = localStorage.getItem(`${this.storageKey}-timestamp`)
      const backups = this.getBackups()

      return {
        size: data ? data.length : 0,
        lastBackup: timestamp ? new Date(timestamp) : null,
        backupCount: backups.length,
      }
    } catch {
      return { size: 0, lastBackup: null, backupCount: 0 }
    }
  }

  // Export data for backup
  exportData(): string {
    const data = localStorage.getItem(this.storageKey)
    if (!data) throw new Error("No data to export")

    const exportData = {
      ...JSON.parse(data),
      exportedAt: new Date().toISOString(),
      exportVersion: "1.0",
    }

    return JSON.stringify(exportData, null, 2)
  }

  // Import data from backup
  async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData)

      if (!data.sprints || !Array.isArray(data.sprints)) {
        throw new Error("Invalid data format: missing sprints array")
      }

      // Create backup before importing
      this.createBackup()

      // Save imported data
      const importData = {
        sprints: data.sprints,
        archivedSprints: data.archivedSprints || [],
        settings: data.settings || { storyPrefix: "TUNE", autoSaveInterval: 30000, theme: "system" },
        lastSaved: new Date().toISOString(),
        version: "1.0",
      }

      localStorage.setItem(this.storageKey, JSON.stringify(importData))
      localStorage.setItem(`${this.storageKey}-timestamp`, new Date().toISOString())

      console.log("✅ Data imported successfully")
    } catch (error) {
      console.error("❌ Failed to import data:", error)
      throw error
    }
  }

  // Clear all data (with confirmation)
  clearAllData(): void {
    localStorage.removeItem(this.storageKey)
    localStorage.removeItem(`${this.storageKey}-timestamp`)
    localStorage.removeItem(this.backupKey)
    console.log("🗑️ All data cleared")
  }

  // List available backups
  listBackups(): Array<{ id: string; timestamp: string; size: number }> {
    return this.getBackups().map((backup) => ({
      id: backup.id,
      timestamp: backup.timestamp,
      size: backup.data.length,
    }))
  }

  // Restore from specific backup
  async restoreFromBackup(backupId: string): Promise<void> {
    const backups = this.getBackups()
    const backup = backups.find((b) => b.id === backupId)

    if (!backup) {
      throw new Error("Backup not found")
    }

    try {
      const data = JSON.parse(backup.data)
      localStorage.setItem(this.storageKey, backup.data)
      localStorage.setItem(`${this.storageKey}-timestamp`, backup.timestamp)
      console.log(`✅ Restored from backup: ${backup.timestamp}`)
    } catch (error) {
      throw new Error("Backup is corrupted")
    }
  }
}

// Export singleton instance
export const localStorage = new LocalStorage()
