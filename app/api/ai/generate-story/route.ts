import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 400 })
    }

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
            content: `You are a helpful assistant that creates user stories for software development. 
            Given a prompt, generate a clear story title, detailed description, and relevant tags.
            
            Return your response as JSON with this exact structure:
            {
              "title": "Clear, actionable story title",
              "description": "Detailed description with acceptance criteria",
              "tags": ["tag1", "tag2", "tag3"]
            }
            
            Keep titles concise but descriptive. Include acceptance criteria in descriptions. 
            Use relevant tags like: frontend, backend, ui, api, database, auth, testing, etc.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
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
      return NextResponse.json({
        title: prompt.slice(0, 100),
        description: content,
        tags: ["ai-generated"],
      })
    }
  } catch (error) {
    console.error("Story generation error:", error)
    return NextResponse.json({ error: "Failed to generate story" }, { status: 500 })
  }
}
