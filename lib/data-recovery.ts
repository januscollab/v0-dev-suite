import type { Sprint, Settings } from "@/types"

interface BackupData {
  sprints: Sprint[]
  archivedSprints: Sprint[]
  settings: Settings
  timestamp: string
  version: string
}

export class DataRecovery {
  private static readonly BACKUP_PREFIX = "scrum-backup-"
  private static readonly MAX_BACKUPS = 5

  static createBackup(sprints: Sprint[], archivedSprints: Sprint[], settings: Settings): void {
    try {
      const backup: BackupData = {
        sprints,
        archivedSprints,
        settings,
        timestamp: new Date().toISOString(),
        version: "1.0",
      }

      const backupKey = `${this.BACKUP_PREFIX}${Date.now()}`
      localStorage.setItem(backupKey, JSON.stringify(backup))

      // Clean up old backups
      this.cleanupOldBackups()

      console.log("📦 Backup created:", backupKey)
    } catch (error) {
      console.error("❌ Failed to create backup:", error)
    }
  }

  static listBackups(): Array<{ key: string; timestamp: string; size: string }> {
    const backups: Array<{ key: string; timestamp: string; size: string }> = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(this.BACKUP_PREFIX)) {
        try {
          const data = localStorage.getItem(key)
          if (data) {
            const backup: BackupData = JSON.parse(data)
            backups.push({
              key,
              timestamp: backup.timestamp,
              size: `${Math.round(data.length / 1024)}KB`,
            })
          }
        } catch (error) {
          console.error("Failed to parse backup:", key, error)
        }
      }
    }

    return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  static restoreFromBackup(backupKey: string): BackupData | null {
    try {
      const data = localStorage.getItem(backupKey)
      if (!data) {
        console.error("Backup not found:", backupKey)
        return null
      }

      const backup: BackupData = JSON.parse(data)

      // Validate backup structure
      if (!backup.sprints || !Array.isArray(backup.sprints)) {
        throw new Error("Invalid backup format: missing sprints")
      }

      console.log("🔄 Restored from backup:", backupKey)
      return backup
    } catch (error) {
      console.error("❌ Failed to restore backup:", error)
      return null
    }
  }

  static emergencyRecovery(): BackupData | null {
    console.log("🚨 Starting emergency recovery...")

    // Try to find the most recent backup
    const backups = this.listBackups()
    if (backups.length > 0) {
      console.log("📦 Found", backups.length, "backups")
      return this.restoreFromBackup(backups[0].key)
    }

    // Try to recover from any scrum-related localStorage keys
    const recoveredData = this.recoverFromLocalStorage()
    if (recoveredData) {
      console.log("🔄 Recovered data from localStorage fragments")
      return recoveredData
    }

    console.log("❌ No recoverable data found")
    return null
  }

  private static recoverFromLocalStorage(): BackupData | null {
    try {
      const sprintsData = localStorage.getItem("scrum-sprints")
      const archivedData = localStorage.getItem("scrum-archived-sprints")
      const settingsData = localStorage.getItem("scrum-settings")

      if (sprintsData) {
        const sprints = JSON.parse(sprintsData)
        const archivedSprints = archivedData ? JSON.parse(archivedData) : []
        const settings = settingsData
          ? JSON.parse(settingsData)
          : {
              storyPrefix: "TUNE",
              autoSaveInterval: 30000,
              theme: "system",
            }

        return {
          sprints,
          archivedSprints,
          settings,
          timestamp: new Date().toISOString(),
          version: "1.0",
        }
      }
    } catch (error) {
      console.error("Failed to recover from localStorage:", error)
    }

    return null
  }

  private static cleanupOldBackups(): void {
    const backups = this.listBackups()

    if (backups.length > this.MAX_BACKUPS) {
      const toDelete = backups.slice(this.MAX_BACKUPS)
      toDelete.forEach((backup) => {
        localStorage.removeItem(backup.key)
        console.log("🗑️ Deleted old backup:", backup.key)
      })
    }
  }

  static clearAllBackups(): void {
    const backups = this.listBackups()
    backups.forEach((backup) => {
      localStorage.removeItem(backup.key)
    })
    console.log("🗑️ Cleared all backups")
  }

  static exportBackup(backupKey: string): void {
    const backup = this.restoreFromBackup(backupKey)
    if (!backup) return

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `scrum-backup-${backup.timestamp.split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}
