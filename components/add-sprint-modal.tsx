"use client"

import type React from "react"

import { useState } from "react"
import { X, Plus } from "lucide-react"

interface AddSprintModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddSprint: (sprintData: any) => void
  existingPositions: number[]
}

export function AddSprintModal({ open, onOpenChange, onAddSprint, existingPositions }: AddSprintModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "⚡",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert("Please enter a sprint name")
      return
    }

    const newSprint = {
      id: `sprint-${Date.now()}`,
      name: formData.name.trim(),
      description: formData.description.trim(),
      type: "custom" as const,
      position: Math.max(...existingPositions, 0) + 1,
      isActive: true,
      stories: [],
      createdAt: new Date(),
      layout: "single" as const,
    }

    onAddSprint(newSprint)
    handleClose()
  }

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      icon: "⚡",
    })
    onOpenChange(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-[rgba(28,28,28,0.5)] flex items-center justify-center z-50 p-5">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[480px]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E0E0E0] relative">
          <h1 className="text-2xl font-bold text-[#1C1C1C]">Add New Sprint</h1>
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
          {/* Sprint Name */}
          <div className="mb-4">
            <label className="block text-[13px] font-semibold text-[#1C1C1C] mb-1">
              Sprint Name <span className="text-[#F44336] ml-0.5">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter sprint name..."
              className="w-full px-3 py-2.5 border-2 border-[#E0E0E0] rounded-lg text-[13px] text-[#1C1C1C] transition-all focus:outline-none focus:border-[#FC8019] focus:shadow-[0_0_0_3px_rgba(252,128,25,0.1)]"
              required
            />
          </div>

          {/* Sprint Description */}
          <div className="mb-4">
            <label className="block text-[13px] font-semibold text-[#1C1C1C] mb-1">Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of this sprint..."
              className="w-full px-3 py-2.5 border-2 border-[#E0E0E0] rounded-lg text-[13px] text-[#1C1C1C] min-h-[80px] resize-vertical transition-all focus:outline-none focus:border-[#FC8019] focus:shadow-[0_0_0_3px_rgba(252,128,25,0.1)]"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E0E0E0] flex justify-end gap-3">
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
            <Plus size={16} />
            Create Sprint
          </button>
        </div>
      </div>
    </div>
  )
}
