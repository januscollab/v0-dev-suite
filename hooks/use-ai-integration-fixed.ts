"use client"

import { useState, useCallback } from "react"

export function useAIIntegration(apiKey?: string) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateStoryContent = useCallback(
    async (mode: "enhance" | "generate", input: { title?: string; prompt: string }) => {
      if (!apiKey) {
        throw new Error("OpenAI API key not configured")
      }

      setIsGenerating(true)
      setError(null)

      try {
        const systemPrompt = `You are a seasoned full-stack developer and technical architect advising a business owner. Your role is to:

1. Transform business requirements into proper user stories using the format: "As a [user type], I want to [goal] so that [benefit]"
2. Create detailed technical implementation descriptions that are machine-targeted and actionable for developers
3. Focus on practical, implementable solutions with specific technologies and approaches
4. Consider scalability, security, and best practices in your recommendations

When generating stories:
- Title: Always use proper user story format starting with "As a..."
- Description: Provide detailed technical implementation steps, specific technologies, code patterns, and architectural considerations
- Think like you're briefing a development team on exactly what to build and how

Format your response as:
Title: [User story in proper format]
Description: [Detailed technical implementation with specific steps, technologies, and considerations]`

        const userPrompt =
          mode === "enhance"
            ? `Business Requirement: "${input.prompt}"
${input.title ? `Current Title: "${input.title}"` : ""}

Transform this into a proper user story title and create a detailed technical implementation description that a development team can follow.`
            : `Business Requirement: "${input.prompt}"

Create a complete user story with proper format and detailed technical implementation description.`

        // Use fetch instead of AI SDK for better compatibility
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
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

        // Parse the response to extract title and description
        const lines = text.split("\n").filter((line) => line.trim())
        let title = input.title || ""
        let description = ""

        for (const line of lines) {
          if (line.toLowerCase().startsWith("title:")) {
            title = line.split(":").slice(1).join(":").trim()
          } else if (line.toLowerCase().startsWith("description:")) {
            description = line.split(":").slice(1).join(":").trim()
          }
        }

        // If parsing fails, use fallback logic
        if (!title && !description) {
          const sentences = text.split(".").filter((s) => s.trim())
          title = sentences[0]?.trim() || input.title || "Generated Story"
          description = sentences.slice(1).join(".").trim() || text.trim()
        }

        // Ensure title follows user story format
        if (title && !title.toLowerCase().startsWith("as a")) {
          title = `As a user, I want to ${title.toLowerCase()}`
        }

        // Generate tags based on content
        const tags = generateTags(title + " " + description)

        return { title, description, tags }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to generate content"
        setError(errorMessage)
        throw new Error(errorMessage)
      } finally {
        setIsGenerating(false)
      }
    },
    [apiKey],
  )

  const generateBoltPrompt = useCallback((sprintName: string, stories: any[]) => {
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
    generateStoryContent,
    generateBoltPrompt,
    isGenerating,
    error,
  }
}

function generateTags(content: string): string[] {
  const keywords = [
    "ui",
    "ux",
    "frontend",
    "backend",
    "api",
    "database",
    "auth",
    "security",
    "performance",
    "mobile",
    "responsive",
    "accessibility",
    "testing",
    "bug",
    "feature",
    "enhancement",
    "refactor",
    "documentation",
    "integration",
    "react",
    "nextjs",
    "typescript",
    "tailwind",
    "prisma",
    "supabase",
    "authentication",
    "authorization",
    "deployment",
    "devops",
    "monitoring",
  ]

  const contentLower = content.toLowerCase()
  return keywords.filter((keyword) => contentLower.includes(keyword))
}
