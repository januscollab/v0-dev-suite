"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, Star, Trash2, Loader2 } from "lucide-react"
import { useAIIntegration } from "@/hooks/use-ai-integration"
import type { Story, Settings } from "@/types"

interface EditStoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  story: Story | null
  onUpdateStory: (storyId: string, updates: Partial<Story>) => void
  onDeleteStory: (storyId: string) => void
  settings: Settings
}

export function EditStoryModal({
  open,
  onOpenChange,
  story,
  onUpdateStory,
  onDeleteStory,
  settings,
}: EditStoryModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    prompt: "",
    description: "",
    priority: "medium",
    risk: "none",
    tags: [] as string[],
  })
  const [tagInput, setTagInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { generateStoryFromPrompt } = useAIIntegration(settings)

  useEffect(() => {
    if (open && story) {
      setFormData({
        title: story.title,
        prompt: story.prompt || "",
        description: story.description,
        priority: story.priority,
        risk: (story as any).risk || "none",
        tags: story.tags || [],
      })
      setTagInput("")
      setShowDeleteConfirm(false)
    }
  }, [open, story])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault()
      const newTag = tagInput.trim()
      if (!formData.tags.includes(newTag)) {
        setFormData((prev) => ({ ...prev, tags: [...prev.tags, newTag] }))
      }
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  const handleGenerateStory = async () => {
    if (!formData.prompt.trim()) return

    setIsGenerating(true)
    try {
      const generated = await generateStoryFromPrompt(formData.prompt)
      setFormData((prev) => ({
        ...prev,
        title: generated.title,
        description: generated.description,
        tags: [...new Set([...prev.tags, ...generated.tags])],
      }))
    } catch (error) {
      console.error("Failed to generate story:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!story || !formData.title.trim()) {
      alert("Please enter a story title")
      return
    }

    onUpdateStory(story.id, {
      title: formData.title.trim(),
      prompt: formData.prompt.trim(),
      description: formData.description.trim(),
      priority: formData.priority as "low" | "medium" | "high",
      tags: formData.tags,
      updatedAt: new Date(),
    })

    onOpenChange(false)
  }

  const handleDelete = () => {
    if (!story) return

    if (showDeleteConfirm) {
      onDeleteStory(story.id)
      onOpenChange(false)
    } else {
      setShowDeleteConfirm(true)
    }
  }

  const handleClose = () => {
    setShowDeleteConfirm(false)
    onOpenChange(false)
  }

  if (!open || !story) return null

  return (
    <div className="fixed inset-0 bg-[rgba(28,28,28,0.5)] flex items-center justify-center z-50 p-5">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[580px] max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E0E0E0] relative">
          <h1 className="text-2xl font-bold text-[#1C1C1C] mb-0">Edit Story</h1>
          <div className="text-[13px] text-[#6B6B6B] mt-1">{story.number}</div>
          <button
            onClick={handleClose}
            className="absolute top-3 right-5 w-8 h-8 rounded-md flex items-center justify-center text-[#8E8E8E] hover:bg-[#F8F8F8] hover:text-[#3E3E3E] transition-all"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-4">
          {/* Story Title */}
          <div className="mb-3">
            <label className="block text-[13px] font-semibold text-[#1C1C1C] mb-1">
              Story Title <span className="text-[#F44336] ml-0.5">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Enter story title..."
              className="w-full px-3 py-2.5 border-2 border-[#E0E0E0] rounded-lg text-[13px] text-[#1C1C1C] transition-all focus:outline-none focus:border-[#FC8019] focus:shadow-[0_0_0_3px_rgba(252,128,25,0.1)]"
              required
            />
          </div>

          {/* Story Prompt */}
          <div className="mb-3">
            <label className="block text-[13px] font-semibold text-[#1C1C1C] mb-1">Story Prompt (AI assistance)</label>
            <textarea
              value={formData.prompt}
              onChange={(e) => handleInputChange("prompt", e.target.value)}
              placeholder="Describe what you want to build... (e.g., 'Create a user login form with email validation')"
              className="w-full px-3 py-2.5 border-2 border-[#E0E0E0] rounded-lg text-[13px] text-[#1C1C1C] min-h-[80px] resize-none transition-all focus:outline-none focus:border-[#FC8019] focus:shadow-[0_0_0_3px_rgba(252,128,25,0.1)]"
            />
            {formData.prompt.trim() && (
              <button
                type="button"
                onClick={handleGenerateStory}
                disabled={isGenerating}
                className="mt-1.5 flex items-center gap-1 px-2.5 py-1.5 bg-transparent border border-[#FC8019] text-[#FC8019] text-[12px] font-medium rounded-md hover:bg-[rgba(252,128,25,0.1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />}
                {isGenerating ? "Regenerating..." : "Regenerate Story"}
              </button>
            )}
          </div>

          {/* Description */}
          <div className="mb-3">
            <label className="block text-[13px] font-semibold text-[#1C1C1C] mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Detailed description of the story..."
              className="w-full px-3 py-2.5 border-2 border-[#E0E0E0] rounded-lg text-[13px] text-[#1C1C1C] min-h-[70px] resize-vertical transition-all focus:outline-none focus:border-[#FC8019] focus:shadow-[0_0_0_3px_rgba(252,128,25,0.1)]"
            />
          </div>

          {/* Priority and Risk Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            {/* Priority */}
            <div>
              <label className="block text-[13px] font-semibold text-[#1C1C1C] mb-1">Priority</label>
              <div className="relative">
                <select
                  value={formData.priority}
                  onChange={(e) => handleInputChange("priority", e.target.value)}
                  className="w-full px-3 py-2.5 pr-9 border-2 border-[#E0E0E0] rounded-lg text-[13px] text-[#1C1C1C] bg-white appearance-none cursor-pointer transition-all focus:outline-none focus:border-[#FC8019] focus:shadow-[0_0_0_3px_rgba(252,128,25,0.1)]"
                >
                  <option value="critical">🔴 Critical</option>
                  <option value="high">🟠 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">🟢 Low</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-[#8E8E8E]"
                  >
                    <polyline points="6,9 12,15 18,9"></polyline>
                  </svg>
                </div>
              </div>
            </div>

            {/* Risk */}
            <div>
              <label className="block text-[13px] font-semibold text-[#1C1C1C] mb-1">Risk (of Breaking Change)</label>
              <div className="relative">
                <select
                  value={formData.risk}
                  onChange={(e) => handleInputChange("risk", e.target.value)}
                  className="w-full px-3 py-2.5 pr-9 border-2 border-[#E0E0E0] rounded-lg text-[13px] text-[#1C1C1C] bg-white appearance-none cursor-pointer transition-all focus:outline-none focus:border-[#FC8019] focus:shadow-[0_0_0_3px_rgba(252,128,25,0.1)]"
                >
                  <option value="high">⚠️ High - Major breaking changes expected</option>
                  <option value="medium">🟡 Medium - Some breaking changes possible</option>
                  <option value="low">✅ Low - Minimal impact expected</option>
                  <option value="none">🟢 None - Safe changes only</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-[#8E8E8E]"
                  >
                    <polyline points="6,9 12,15 18,9"></polyline>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="mb-3">
            <label className="block text-[13px] font-semibold text-[#1C1C1C] mb-1">Tags</label>
            <div className="border-2 border-[#E0E0E0] rounded-lg bg-white p-1.5 min-h-[40px] flex flex-wrap gap-1.5 items-start transition-all focus-within:border-[#FC8019] focus-within:shadow-[0_0_0_3px_rgba(252,128,25,0.1)]">
              {formData.tags.map((tag) => (
                <div
                  key={tag}
                  className="bg-[#FFF3E0] text-[#FC8019] px-2 py-1 rounded-full text-[12px] font-medium flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] hover:bg-[#FC8019] hover:text-white transition-all"
                  >
                    ×
                  </button>
                </div>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInput}
                placeholder="Add tags (press Enter to add)..."
                className="flex-1 min-w-[100px] px-1.5 py-1.5 text-[13px] text-[#1C1C1C] bg-transparent border-none outline-none placeholder:text-[#D3D3D3]"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E0E0E0] flex justify-between">
          <button
            type="button"
            onClick={handleDelete}
            className={`flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium rounded-md transition-all ${
              showDeleteConfirm
                ? "bg-[#F44336] text-white hover:bg-[#D32F2F]"
                : "bg-transparent text-[#F44336] hover:bg-[rgba(244,67,54,0.1)]"
            }`}
          >
            <Trash2 size={16} />
            {showDeleteConfirm ? "Confirm Delete" : "Delete Story"}
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex items-center gap-1.5 px-3 py-2 bg-transparent text-[#3E3E3E] text-[13px] font-medium rounded-md hover:bg-[rgba(252,128,25,0.1)] hover:text-[#FC8019] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="flex items-center gap-1.5 px-3 py-2 bg-transparent text-[#3E3E3E] text-[13px] font-medium rounded-md hover:bg-[rgba(252,128,25,0.1)] hover:text-[#FC8019] transition-all"
            >
              <Star size={16} />
              Update Story
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
