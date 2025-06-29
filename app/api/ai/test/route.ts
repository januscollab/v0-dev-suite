import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 400 })
    }

    // Test the API key with a simple request
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    return NextResponse.json({ success: true, message: "API connection successful" })
  } catch (error) {
    console.error("API test error:", error)
    return NextResponse.json({ error: "Connection failed" }, { status: 500 })
  }
}
