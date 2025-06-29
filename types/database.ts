export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string
          name: string
          description: string | null
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          owner_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      workspace_members: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          role: "owner" | "admin" | "member"
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          role?: "owner" | "admin" | "member"
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          role?: "owner" | "admin" | "member"
          created_at?: string
        }
      }
      sprints: {
        Row: {
          id: string
          workspace_id: string
          name: string
          description: string | null
          type: "priority" | "backlog" | "custom"
          position: number
          is_active: boolean
          layout: "single" | "two-column"
          start_date: string | null
          end_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          description?: string | null
          type?: "priority" | "backlog" | "custom"
          position?: number
          is_active?: boolean
          layout?: "single" | "two-column"
          start_date?: string | null
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          description?: string | null
          type?: "priority" | "backlog" | "custom"
          position?: number
          is_active?: boolean
          layout?: "single" | "two-column"
          start_date?: string | null
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      stories: {
        Row: {
          id: string
          sprint_id: string
          number: string
          title: string
          description: string | null
          prompt: string | null
          tags: string[]
          status: "open" | "in-progress" | "completed"
          priority: "low" | "medium" | "high"
          assignee: string | null
          estimated_hours: number | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sprint_id: string
          number: string
          title: string
          description?: string | null
          prompt?: string | null
          tags?: string[]
          status?: "open" | "in-progress" | "completed"
          priority?: "low" | "medium" | "high"
          assignee?: string | null
          estimated_hours?: number | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sprint_id?: string
          number?: string
          title?: string
          description?: string | null
          prompt?: string | null
          tags?: string[]
          status?: "open" | "in-progress" | "completed"
          priority?: "low" | "medium" | "high"
          assignee?: string | null
          estimated_hours?: number | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          openai_api_key: string | null
          story_prefix: string
          auto_save_interval: number
          theme: "light" | "dark" | "system"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          openai_api_key?: string | null
          story_prefix?: string
          auto_save_interval?: number
          theme?: "light" | "dark" | "system"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          openai_api_key?: string | null
          story_prefix?: string
          auto_save_interval?: number
          theme?: "light" | "dark" | "system"
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
