"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Loader2 } from "lucide-react"
import { useAIIntegration } from "@/hooks/use-ai-integration-fixed"

export default function TestAIGeneration() {
  const [prompt, setPrompt] = useState("I want to be able to brand my interface")
  const [result, setResult] = useState<{ title: string; description: string; tags: string[] } | null>(null)
  const [apiKey, setApiKey] = useState("")

  const { generateStoryContent, isGenerating, error } = useAIIntegration(apiKey)

  const handleGenerate = async () => {
    if (!apiKey.trim()) {
      alert("Please enter your OpenAI API key first")
      return
    }

    try {
      const generated = await generateStoryContent("generate", { prompt })
      setResult(generated)
    } catch (err) {
      console.error("Generation failed:", err)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Test Enhanced AI Story Generation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">OpenAI API Key (for testing)</label>
            <input
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Business Requirement</label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your business requirement..."
              rows={3}
            />
          </div>

          <Button onClick={handleGenerate} disabled={isGenerating || !apiKey.trim()} className="w-full">
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating with Enhanced AI...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Story with Enhanced AI
              </>
            )}
          </Button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>✨ Generated User Story</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-green-600">Story Title (User Story Format)</label>
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="font-medium">{result.title}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-blue-600">
                Technical Implementation Description
              </label>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="whitespace-pre-wrap text-sm">{result.description}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-purple-600">Auto-Generated Tags</label>
              <div className="flex flex-wrap gap-2">
                {result.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="bg-purple-50">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>🎯 What's Different About This AI?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <h4 className="font-medium text-yellow-800 mb-2">🧠 Seasoned Developer Perspective</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Acts like a technical architect</li>
                <li>• Considers scalability & security</li>
                <li>• Suggests specific technologies</li>
                <li>• Includes best practices</li>
              </ul>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="font-medium text-blue-800 mb-2">💼 Business Owner Focused</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Translates requirements clearly</li>
                <li>• Proper user story format</li>
                <li>• Actionable implementation steps</li>
                <li>• Machine-targeted outputs</li>
              </ul>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <h4 className="font-medium text-green-800 mb-2">🔧 Technical Implementation</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Specific code patterns</li>
                <li>• Architecture recommendations</li>
                <li>• Technology stack suggestions</li>
                <li>• Performance considerations</li>
              </ul>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-md">
              <h4 className="font-medium text-purple-800 mb-2">🚀 Production Ready</h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Security implementations</li>
                <li>• Testing strategies</li>
                <li>• Deployment guidance</li>
                <li>• Error handling patterns</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📝 Example Expected Output</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-green-600 mb-2">Title:</h4>
              <p className="p-3 bg-green-50 border border-green-200 rounded text-sm">
                "As a user, I want to customize the branding of my interface so that I can maintain consistent visual
                identity across my application"
              </p>
            </div>

            <div>
              <h4 className="font-medium text-blue-600 mb-2">Description:</h4>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                <p className="mb-2">
                  <strong>Technical Implementation:</strong>
                </p>
                <p className="mb-2">
                  1. <strong>Theme System Architecture:</strong> Implement CSS custom properties (CSS variables) with
                  Tailwind CSS configuration override system
                </p>
                <p className="mb-2">
                  2. <strong>Settings Interface:</strong> Create a theme customization panel with real-time preview
                  using React state management
                </p>
                <p className="mb-2">
                  3. <strong>Asset Management:</strong> Build logo upload functionality with image optimization and
                  multiple format support
                </p>
                <p className="mb-2">
                  4. <strong>Color System:</strong> Implement HSL-based color palette generator with accessibility
                  compliance (WCAG 2.1 AA)
                </p>
                <p className="mb-2">
                  5. <strong>Persistence:</strong> Store theme configurations in localStorage with JSON schema
                  validation
                </p>
                <p>
                  6. <strong>Export/Import:</strong> Enable theme sharing via JSON export/import with version control
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
