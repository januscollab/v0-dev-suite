"use client"

import { useState } from "react"
import { X, Copy, CheckCircle, Loader2, ExternalLink } from "lucide-react"
import type { Sprint, Story } from "@/types"
import { useAIIntegration } from "@/hooks/use-ai-integration"

interface DevelopmentPromptModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sprint: Sprint
  stories: Story[]
  aiAvailable: boolean
}

export function DevelopmentPromptModal({
  open,
  onOpenChange,
  sprint,
  stories,
  aiAvailable,
}: DevelopmentPromptModalProps) {
  const [generatedPrompt, setGeneratedPrompt] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const { generateDevelopmentPrompt } = useAIIntegration()

  const handleGeneratePrompt = async () => {
    if (!aiAvailable || stories.length === 0) return

    setIsGenerating(true)
    try {
      const result = await generateDevelopmentPrompt(stories, sprint.name)
      setGeneratedPrompt(result.prompt)
    } catch (error) {
      console.error("Failed to generate prompt:", error)
      // Fallback to manual prompt
      const fallbackPrompt = generateFallbackPrompt()
      setGeneratedPrompt(fallbackPrompt)
    } finally {
      setIsGenerating(false)
    }
  }

  const generateFallbackPrompt = () => {
    const storyList = stories
      .map((story) => {
        return `${story.number}: ${story.title}
Description: ${story.description || "No description provided"}
Priority: ${story.priority || "medium"}
Tags: ${story.tags?.join(", ") || "none"}
Status: ${story.status || "open"}`
      })
      .join("\n\n")

    return `Build the following features for ${sprint.name}:

${storyList}

Please provide:
1. Implementation approach and architecture
2. Technical considerations and dependencies
3. Success metrics and acceptance criteria
4. Potential challenges and solutions
5. Code quality and testing recommendations

Focus on creating a modern, responsive, and user-friendly application with clean code practices.`
  }

  const handleCopyPrompt = async () => {
    if (!generatedPrompt) return

    try {
      await navigator.clipboard.writeText(generatedPrompt)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy prompt:", error)
    }
  }

  const handleOpenBolt = () => {
    if (!generatedPrompt) return

    const encodedPrompt = encodeURIComponent(generatedPrompt)
    const boltUrl = `https://bolt.new?prompt=${encodedPrompt}`
    window.open(boltUrl, "_blank")
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-[rgba(28,28,28,0.5)] flex items-center justify-center z-50 p-5">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[800px] max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E0E0E0] relative">
          <h1 className="text-2xl font-bold text-[#1C1C1C] mb-1">Development Prompt</h1>
          <p className="text-[13px] text-[#6B6B6B]">
            Generate a comprehensive prompt for {sprint.name} ({stories.length} stories)
          </p>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-3 right-5 w-8 h-8 rounded-md flex items-center justify-center text-[#8E8E8E] hover:bg-[#F8F8F8] hover:text-[#3E3E3E] transition-all"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!generatedPrompt && !isGenerating && (
            <div className="text-center py-12">
              <div className="text-[#D3D3D3] mb-4">🚀</div>
              <h3 className="text-[16px] font-semibold text-[#1C1C1C] mb-2">Ready to Build?</h3>
              <p className="text-[13px] text-[#6B6B6B] mb-6 max-w-md mx-auto">
                Generate a comprehensive development prompt that includes all stories, technical requirements, and
                implementation guidance for bolt.new.
              </p>

              {stories.length === 0 ? (
                <div className="text-[13px] text-[#F44336] bg-[#FFF5F5] border border-[#FFCDD2] rounded-lg p-4 max-w-md mx-auto">
                  ⚠️ No stories in this sprint. Add some stories first to generate a development prompt.
                </div>
              ) : !aiAvailable ? (
                <div className="text-[13px] text-[#F44336] bg-[#FFF5F5] border border-[#FFCDD2] rounded-lg p-4 max-w-md mx-auto mb-4">
                  ⚠️ AI features not available. Configure your OpenAI API key in settings to use AI-powered prompt
                  generation.
                </div>
              ) : null}

              <button
                onClick={handleGeneratePrompt}
                disabled={stories.length === 0 || !aiAvailable}
                className="flex items-center gap-2 px-6 py-3 bg-[#FC8019] text-white text-[14px] font-medium rounded-lg hover:bg-[#E6722E] transition-all disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
              >
                <ExternalLink size={16} />
                Generate Development Prompt
              </button>

              {stories.length > 0 && !aiAvailable && (
                <button
                  onClick={() => setGeneratedPrompt(generateFallbackPrompt())}
                  className="flex items-center gap-2 px-4 py-2 bg-transparent border border-[#FC8019] text-[#FC8019] text-[13px] font-medium rounded-lg hover:bg-[rgba(252,128,25,0.1)] transition-all mx-auto mt-3"
                >
                  Generate Basic Prompt
                </button>
              )}
            </div>
          )}

          {isGenerating && (
            <div className="text-center py-12">
              <Loader2 size={32} className="text-[#FC8019] animate-spin mx-auto mb-4" />
              <h3 className="text-[16px] font-semibold text-[#1C1C1C] mb-2">Generating Prompt...</h3>
              <p className="text-[13px] text-[#6B6B6B]">
                AI is analyzing your stories and creating a comprehensive development prompt.
              </p>
            </div>
          )}

          {generatedPrompt && (
            <div className="space-y-4">
              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="text-[13px] text-[#6B6B6B]">
                  Generated prompt ready for bolt.new ({generatedPrompt.length} characters)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyPrompt}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-transparent border border-[#FC8019] text-[#FC8019] text-[12px] font-medium rounded-md hover:bg-[rgba(252,128,25,0.1)] transition-all"
                  >
                    {isCopied ? <CheckCircle size={14} /> : <Copy size={14} />}
                    {isCopied ? "Copied!" : "Copy"}
                  </button>
                  <button
                    onClick={handleOpenBolt}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FC8019] text-white text-[12px] font-medium rounded-md hover:bg-[#E6722E] transition-all"
                  >
                    <ExternalLink size={14} />
                    Open in Bolt.new
                  </button>
                </div>
              </div>

              {/* Prompt Content */}
              <div className="bg-[#F8F8F8] border border-[#E0E0E0] rounded-lg p-4 max-h-[400px] overflow-y-auto">
                <pre className="text-[12px] text-[#1C1C1C] whitespace-pre-wrap font-mono leading-relaxed">
                  {generatedPrompt}
                </pre>
              </div>

              {/* Story Summary */}
              <div className="bg-[#FFF3E0] border border-[#FFE0B2] rounded-lg p-4">
                <h4 className="text-[13px] font-semibold text-[#1C1C1C] mb-2">Stories Included:</h4>
                <div className="space-y-1">
                  {stories.map((story) => (
                    <div key={story.id} className="flex items-center gap-2 text-[11px]">
                      <span className="font-mono text-[#8E8E8E] bg-white px-1.5 py-0.5 rounded">{story.number}</span>
                      <span className="text-[#1C1C1C] flex-1 truncate">{story.title}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                          story.priority === "high"
                            ? "text-[#F44336] bg-[rgba(244,67,54,0.1)]"
                            : story.priority === "medium"
                              ? "text-[#FC8019] bg-[rgba(252,128,25,0.1)]"
                              : "text-[#60B246] bg-[rgba(96,178,70,0.1)]"
                        }`}
                      >
                        {story.priority?.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
