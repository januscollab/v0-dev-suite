"use client"

import { useCallback } from "react"
import type { Settings } from "@/types"

interface GeneratedStory {
  title: string
  description: string
  tags: string[]
}

interface GeneratedPrompt {
  prompt: string
  sections: {
    overview: string
    features: string[]
    technicalRequirements: string[]
    acceptanceCriteria: string[]
  }
}

export function useAIIntegration(settings?: Settings) {
  const isAvailable = Boolean(process.env.NEXT_PUBLIC_OPENAI_API_KEY)

  const testConnection = useCallback(async (): Promise<boolean> => {
    if (!isAvailable) return false

    try {
      const response = await fetch("/api/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      return response.ok
    } catch (error) {
      console.error("AI connection test failed:", error)
      return false
    }
  }, [isAvailable])

  const generateStoryFromPrompt = useCallback(
    async (prompt: string): Promise<GeneratedStory> => {
      if (!isAvailable) {
        throw new Error("OpenAI API key not configured")
      }

      try {
        const response = await fetch("/api/ai/generate-story", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        })

        if (!response.ok) {
          throw new Error("Failed to generate story")
        }

        const data = await response.json()
        return data
      } catch (error) {
        console.error("Story generation failed:", error)
        throw new Error("Failed to generate story")
      }
    },
    [isAvailable],
  )

  const generateDevelopmentPrompt = useCallback(
    async (stories: any[], sprintName: string): Promise<GeneratedPrompt> => {
      if (!isAvailable) {
        throw new Error("OpenAI API key not configured")
      }

      try {
        const response = await fetch("/api/ai/generate-prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stories, sprintName }),
        })

        if (!response.ok) {
          throw new Error("Failed to generate development prompt")
        }

        const data = await response.json()
        return data
      } catch (error) {
        console.error("Development prompt generation failed:", error)
        throw new Error("Failed to generate development prompt")
      }
    },
    [isAvailable],
  )

  return {
    isAvailable,
    testConnection,
    generateStoryFromPrompt,
    generateDevelopmentPrompt,
  }
}
