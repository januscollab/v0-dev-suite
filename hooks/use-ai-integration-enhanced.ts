"use client"

import { useState, useCallback } from "react"
import type { Settings } from "@/types"

export function useAIIntegrationEnhanced(settings: Settings) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateStoryFromPrompt = useCallback(
    async (prompt: string) => {
      if (!settings.openaiApiKey) {
        throw new Error("OpenAI API key not configured")
      }

      setIsGenerating(true)
      setError(null)

      try {
        const systemPrompt = `You are a seasoned full-stack developer and technical architect. Transform business requirements into proper user stories and detailed technical implementation descriptions.

Format your response as:
Title: [User story starting with "As a..."]
Description: [Detailed technical implementation]
Tags: [Comma-separated relevant tags]`

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${settings.openaiApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Business Requirement: "${prompt}"` },
            ],
            max_tokens: 800,
            temperature: 0.7,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error?.message || "Failed to generate content")
        }

        const data = await response.json()
        const text = data.choices[0]?.message?.content || ""

        // Parse the response
        const lines = text.split("\n").filter((line) => line.trim())
        let title = ""
        let description = ""
        let tags: string[] = []

        for (const line of lines) {
          if (line.toLowerCase().startsWith("title:")) {
            title = line.split(":").slice(1).join(":").trim()
          } else if (line.toLowerCase().startsWith("description:")) {
            description = line.split(":").slice(1).join(":").trim()
          } else if (line.toLowerCase().startsWith("tags:")) {
            tags = line
              .split(":")[1]
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)
          }
        }

        // Fallback if parsing fails
        if (!title || !description) {
          const sentences = text.split(".").filter((s) => s.trim())
          title = title || sentences[0]?.trim() || "Generated Story"
          description = description || sentences.slice(1).join(".").trim() || text.trim()
        }

        // Ensure proper user story format
        if (title && !title.toLowerCase().startsWith("as a")) {
          title = `As a user, I want to ${title.toLowerCase()}`
        }

        return { title, description, tags }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to generate content"
        setError(errorMessage)
        throw new Error(errorMessage)
      } finally {
        setIsGenerating(false)
      }
    },
    [settings.openaiApiKey],
  )

  const generateDevelopmentPrompt = useCallback((sprintName: string, stories: any[]) => {
    const storyList = stories.map((story) => `[  ] ${story.number}: ${story.title}`).join("\n")

    return `# Development Sprint: ${sprintName}

## User Stories to Implement:

${storyList}

## Development Requirements:
1. **Architecture & Implementation Approach**: Provide detailed technical architecture, tech stack recommendations, and implementation patterns
2. **Code Structure & Organization**: Specify file structure, component hierarchy, and code organization patterns  
3. **Technical Dependencies**: List all required packages, APIs, services, and external integrations
4. **Database & State Management**: Define data models, state management approach, and persistence strategy
5. **Security & Performance Considerations**: Implement authentication, authorization, input validation, and performance optimizations
6. **Testing Strategy**: Unit tests, integration tests, and end-to-end testing approach
7. **Deployment & DevOps**: Build process, environment configuration, and deployment strategy

## Deliverables:
- Production-ready code with comprehensive error handling
- Complete test coverage with automated testing
- Documentation for setup, deployment, and maintenance
- Performance benchmarks and optimization recommendations

## Implementation Report Required:
Please provide a final report in this format for each story:

[✅] TUNE-001: Story Title - COMPLETED
    ✓ Implementation details
    ✓ Testing completed
    ✓ Ready for production

[❌] TUNE-002: Story Title - NOT IMPLEMENTED  
    ✗ Reason: [specific technical challenge/blocker]
    → Next Steps: [concrete actions needed]
    → Timeline: [estimated completion]

[⚠️] TUNE-003: Story Title - PARTIALLY IMPLEMENTED
    ⚠️ Status: [what's done vs what remains]
    → Remaining: [specific tasks]
    → Blockers: [if any]

Please provide a complete, production-ready implementation following modern development best practices.`
  }, [])

  return {
    generateStoryFromPrompt,
    generateDevelopmentPrompt,
    isGenerating,
    error,
  }
}
