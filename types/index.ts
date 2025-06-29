export interface Story {
  id: string
  number: string // PREFIX-000 format
  title: string
  prompt?: string // Original user input for AI generation
  description: string
  tags: string[]
  status: "open" | "in-progress" | "completed"
  priority: "low" | "medium" | "high"
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  sprintId: string
  assignee?: string
  estimatedHours?: number
}

export interface Sprint {
  id: string
  name: string
  description?: string
  type: "priority" | "backlog" | "custom"
  position: number
  isActive: boolean
  stories: Story[]
  createdAt: Date
  startDate?: Date
  endDate?: Date
  layout: "single" | "two-column"
}

export interface Settings {
  storyPrefix: string
  autoSaveInterval: number
  theme: "light" | "dark" | "system"
}

export interface StoryFormData {
  title: string
  prompt?: string
  description: string
  priority?: string
  tags?: string[]
  estimatedHours?: number
  assignee?: string
}

export interface ConnectionStatus {
  isOnline: boolean
  queueLength: number
  supabaseAvailable: boolean
}

export interface StorageInfo {
  size: number
  lastBackup: Date | null
}
