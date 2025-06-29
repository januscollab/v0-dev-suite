import type { Sprint, Settings } from "@/types"

export interface StorageData {
  sprints: Sprint[]
  archivedSprints: Sprint[]
  settings: Settings
  lastSaved: string
  version: string
}

export class Storage {
  private readonly STORAGE_KEY = "scrum-master-data"
  private readonly BACKUP_KEY = "scrum-master-backups"
  private readonly MAX_BACKUPS = 10

  // Auto-save with backup creation
  async save(sprints: Sprint[], archivedSprints: Sprint[], settings: Settings): Promise<void> {
    try {
      const data: StorageData = {
        sprints,
        archivedSprints,
        settings,
        lastSaved: new Date().toISOString(),
        version: "1.0",
      }

      // Create backup before saving
      this.createBackup()

      // Save current data
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))

      console.log("✅ Data auto-saved:", {
        sprints: sprints.length,
        stories: sprints.reduce((acc, s) => acc + s.stories.length, 0),
        archived: archivedSprints.length,
        size: `${Math.round(JSON.stringify(data).length / 1024)}KB`,
      })
    } catch (error) {
      console.error("❌ Auto-save failed:", error)
      throw error
    }
  }

  // Load data with automatic recovery
  async load(): Promise<StorageData | null> {
    try {
      const dataStr = localStorage.getItem(this.STORAGE_KEY)
      if (!dataStr) {
        console.log("📱 No saved data found")
        return null
      }

      const data = JSON.parse(dataStr) as StorageData

      // Convert date strings back to Date objects
      const processedData: StorageData = {
        ...data,
        sprints: data.sprints.map(this.processSprint),
        archivedSprints: data.archivedSprints.map(this.processSprint),
      }

      console.log("📱 Data loaded successfully:", {
        sprints: processedData.sprints.length,
        archived: processedData.archivedSprints.length,
        totalStories: processedData.sprints.reduce((acc, s) => acc + s.stories.length, 0),
      })

      return processedData
    } catch (error) {
      console.error("❌ Failed to load data:", error)
      return this.attemptRecovery()
    }
  }

  // Process sprint data to convert date strings to Date objects
  private processSprint(sprint: any): Sprint {
    return {
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
    }
  }

  // Create backup of current data
  private createBackup(): void {
    try {
      const currentData = localStorage.getItem(this.STORAGE_KEY)
      if (!currentData) return

      const backups = this.getBackups()
      const newBackup = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        data: currentData,
      }

      backups.unshift(newBackup)

      // Keep only recent backups
      if (backups.length > this.MAX_BACKUPS) {
        backups.splice(this.MAX_BACKUPS)
      }

      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backups))
      console.log(`📦 Backup created (${backups.length}/${this.MAX_BACKUPS})`)
    } catch (error) {
      console.error("❌ Backup creation failed:", error)
    }
  }

  // Get all backups
  private getBackups(): Array<{ id: string; timestamp: string; data: string }> {
    try {
      const backupsStr = localStorage.getItem(this.BACKUP_KEY)
      return backupsStr ? JSON.parse(backupsStr) : []
    } catch {
      return []
    }
  }

  // Attempt recovery from backups
  private attemptRecovery(): StorageData | null {
    console.log("🔄 Attempting data recovery...")

    const backups = this.getBackups()

    for (const backup of backups) {
      try {
        const data = JSON.parse(backup.data) as StorageData
        console.log(`✅ Recovered from backup: ${backup.timestamp}`)

        // Restore the backup as current data
        localStorage.setItem(this.STORAGE_KEY, backup.data)

        return {
          ...data,
          sprints: data.sprints.map(this.processSprint),
          archivedSprints: data.archivedSprints.map(this.processSprint),
        }
      } catch (error) {
        console.log(`❌ Backup ${backup.id} corrupted, trying next...`)
        continue
      }
    }

    console.log("❌ All recovery attempts failed")
    return null
  }

  // Export data for manual backup
  exportData(): string {
    const data = localStorage.getItem(this.STORAGE_KEY)
    if (!data) throw new Error("No data to export")

    const exportData = {
      ...JSON.parse(data),
      exportedAt: new Date().toISOString(),
      exportVersion: "1.0",
    }

    return JSON.stringify(exportData, null, 2)
  }

  // Import data from file
  async importData(jsonData: string): Promise<StorageData> {
    try {
      const data = JSON.parse(jsonData)

      if (!data.sprints || !Array.isArray(data.sprints)) {
        throw new Error("Invalid data format")
      }

      // Create backup before importing
      this.createBackup()

      const importData: StorageData = {
        sprints: data.sprints,
        archivedSprints: data.archivedSprints || [],
        settings: data.settings || { storyPrefix: "TUNE", autoSaveInterval: 30000, theme: "system" },
        lastSaved: new Date().toISOString(),
        version: "1.0",
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(importData))

      console.log("✅ Data imported successfully")
      return {
        ...importData,
        sprints: importData.sprints.map(this.processSprint),
        archivedSprints: importData.archivedSprints.map(this.processSprint),
      }
    } catch (error) {
      console.error("❌ Import failed:", error)
      throw new Error("Invalid file format or corrupted data")
    }
  }

  // Get storage statistics
  getStorageInfo(): { size: number; lastSaved: Date | null; backupCount: number } {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      const backups = this.getBackups()

      let lastSaved: Date | null = null
      if (data) {
        try {
          const parsed = JSON.parse(data)
          lastSaved = parsed.lastSaved ? new Date(parsed.lastSaved) : null
        } catch {
          // Ignore parsing errors for lastSaved
        }
      }

      return {
        size: data ? data.length : 0,
        lastSaved,
        backupCount: backups.length,
      }
    } catch {
      return { size: 0, lastSaved: null, backupCount: 0 }
    }
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
  async restoreFromBackup(backupId: string): Promise<StorageData> {
    const backups = this.getBackups()
    const backup = backups.find((b) => b.id === backupId)

    if (!backup) {
      throw new Error("Backup not found")
    }

    try {
      const data = JSON.parse(backup.data) as StorageData
      localStorage.setItem(this.STORAGE_KEY, backup.data)
      console.log(`✅ Restored from backup: ${backup.timestamp}`)

      return {
        ...data,
        sprints: data.sprints.map(this.processSprint),
        archivedSprints: data.archivedSprints.map(this.processSprint),
      }
    } catch (error) {
      throw new Error("Backup is corrupted")
    }
  }

  // Clear all data
  clearAllData(): void {
    localStorage.removeItem(this.STORAGE_KEY)
    localStorage.removeItem(this.BACKUP_KEY)
    console.log("🗑️ All data cleared")
  }
}

// Export singleton instance
export const storage = new Storage()
