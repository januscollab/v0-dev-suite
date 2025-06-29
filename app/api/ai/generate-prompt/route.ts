import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { stories, sprintName } = await request.json()

    if (!stories || !Array.isArray(stories)) {
      return NextResponse.json({ error: "Stories array is required" }, { status: 400 })
    }

    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 400 })
    }

    // Format stories for the prompt
    const formattedStories = stories
      .map((story, index) => {
        return `${story.number}: ${story.title}
Description: ${story.description || "No description provided"}
Priority: ${story.priority || "medium"}
Tags: ${story.tags?.join(", ") || "none"}
Status: ${story.status || "open"}`
      })
      .join("\n\n")

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert software architect and project manager. Create a comprehensive development prompt for bolt.new that includes:

1. Project overview and goals
2. Technical requirements and architecture
3. Implementation approach
4. Success metrics and acceptance criteria
5. Potential challenges and solutions

Format your response as JSON with this structure:
{
  "prompt": "Complete bolt.new prompt text",
  "sections": {
    "overview": "Project overview",
    "features": ["feature1", "feature2"],
    "technicalRequirements": ["req1", "req2"],
    "acceptanceCriteria": ["criteria1", "criteria2"]
  }
}

Make the prompt actionable and specific for bolt.new development.`,
          },
          {
            role: "user",
            content: `Create a development prompt for "${sprintName}" with these stories:

${formattedStories}

Generate a comprehensive bolt.new prompt that covers all these stories and provides clear implementation guidance.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    })

    if (!response.ok) {
      throw new Error("OpenAI API request failed")
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error("No content received from OpenAI")
    }

    try {
      const parsed = JSON.parse(content)
      return NextResponse.json(parsed)
    } catch {
      // Fallback if JSON parsing fails
      const fallbackPrompt = `Build the following features for ${sprintName}:

${formattedStories}

Please provide:
1. Implementation approach and architecture
2. Technical considerations and dependencies  
3. Success metrics and acceptance criteria
4. Potential challenges and solutions
5. Code quality and testing recommendations`

      return NextResponse.json({
        prompt: fallbackPrompt,
        sections: {
          overview: `Development sprint: ${sprintName}`,
          features: stories.map((s: any) => s.title),
          technicalRequirements: ["Modern web technologies", "Responsive design", "Clean code practices"],
          acceptanceCriteria: ["All features implemented", "Tests passing", "Documentation updated"],
        },
      })
    }
  } catch (error) {
    console.error("Prompt generation error:", error)
    return NextResponse.json({ error: "Failed to generate development prompt" }, { status: 500 })
  }
}
