"use client"

import { useState } from "react"
import { MoreVertical, Edit, Trash2, ArrowRight, Clock, CheckCircle, Circle } from "lucide-react"
import type { Story, Sprint } from "@/types"

interface StoryCardProps {
  story: Story
  allSprints: Sprint[]
  onUpdate: (storyId: string, updates: Partial<Story>) => void
  onDelete: (storyId: string) => void
  onMove: (storyId: string, targetSprintId: string) => void
}

export function StoryCard({ story, allSprints = [], onUpdate, onDelete, onMove }: StoryCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  const getStatusIcon = () => {
    switch (story.status) {
      case "completed":
        return <CheckCircle size={14} className="text-[#60B246]" />
      case "in-progress":
        return <Clock size={14} className="text-[#FC8019]" />
      default:
        return <Circle size={14} className="text-[#8E8E8E]" />
    }
  }

  const getStatusColor = () => {
    switch (story.status) {
      case "completed":
        return "border-l-[#60B246] bg-[rgba(96,178,70,0.05)]"
      case "in-progress":
        return "border-l-[#FC8019] bg-[rgba(252,128,25,0.05)]"
      default:
        return "border-l-[#E0E0E0] bg-white"
    }
  }

  const getPriorityColor = () => {
    switch (story.priority) {
      case "high":
        return "text-[#F44336] bg-[rgba(244,67,54,0.1)]"
      case "medium":
        return "text-[#FC8019] bg-[rgba(252,128,25,0.1)]"
      case "low":
        return "text-[#60B246] bg-[rgba(96,178,70,0.1)]"
      default:
        return "text-[#8E8E8E] bg-[rgba(142,142,142,0.1)]"
    }
  }

  const handleStatusChange = (newStatus: Story["status"]) => {
    onUpdate(story.id, {
      status: newStatus,
      completedAt: newStatus === "completed" ? new Date() : undefined,
    })
    setShowMenu(false)
  }

  const handleMove = (targetSprintId: string) => {
    onMove(story.id, targetSprintId)
    setShowMenu(false)
  }

  const availableSprints = allSprints.filter((sprint) => sprint.id !== story.sprintId && sprint.isActive)

  return (
    <div className={`border-l-4 ${getStatusColor()} rounded-lg p-3 hover:shadow-sm transition-all relative group`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1">
          {getStatusIcon()}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#8E8E8E] bg-[#F5F5F5] px-1.5 py-0.5 rounded">
              {story.number}
            </span>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${getPriorityColor()}`}>
              {story.priority?.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-[#8E8E8E] hover:text-[#FC8019] hover:bg-[rgba(252,128,25,0.1)] rounded opacity-0 group-hover:opacity-100 transition-all"
          >
            <MoreVertical size={14} />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-6 bg-white border border-[#E0E0E0] rounded-lg shadow-lg z-20 min-w-[160px]">
              {/* Status Changes */}
              <div className="px-3 py-2 border-b border-[#E0E0E0]">
                <div className="text-[10px] font-semibold text-[#8E8E8E] uppercase tracking-wide mb-1">Status</div>
                <div className="space-y-1">
                  {[
                    { status: "open" as const, label: "Open", icon: Circle },
                    { status: "in-progress" as const, label: "In Progress", icon: Clock },
                    { status: "completed" as const, label: "Completed", icon: CheckCircle },
                  ].map(({ status, label, icon: Icon }) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      disabled={story.status === status}
                      className="w-full flex items-center gap-2 px-2 py-1 text-[11px] text-[#1C1C1C] hover:bg-[#F8F8F8] rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Icon size={12} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Move to Sprint */}
              {availableSprints.length > 0 && (
                <div className="px-3 py-2 border-b border-[#E0E0E0]">
                  <div className="text-[10px] font-semibold text-[#8E8E8E] uppercase tracking-wide mb-1">
                    Move to Sprint
                  </div>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {availableSprints.map((sprint) => (
                      <button
                        key={sprint.id}
                        onClick={() => handleMove(sprint.id)}
                        className="w-full flex items-center gap-2 px-2 py-1 text-[11px] text-[#1C1C1C] hover:bg-[#F8F8F8] rounded"
                      >
                        <ArrowRight size={12} />
                        <span className="truncate">{sprint.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="px-3 py-2">
                <button
                  onClick={() => {
                    // TODO: Implement edit story modal
                    setShowMenu(false)
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1 text-[11px] text-[#1C1C1C] hover:bg-[#F8F8F8] rounded"
                >
                  <Edit size={12} />
                  Edit Story
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete story "${story.title}"?`)) {
                      onDelete(story.id)
                    }
                    setShowMenu(false)
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1 text-[11px] text-[#F44336] hover:bg-[#FFF5F5] rounded"
                >
                  <Trash2 size={12} />
                  Delete Story
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h4 className="text-[13px] font-medium text-[#1C1C1C] mb-1 line-clamp-2">{story.title}</h4>

      {/* Description */}
      {story.description && <p className="text-[11px] text-[#6B6B6B] mb-2 line-clamp-2">{story.description}</p>}

      {/* Tags */}
      {story.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {story.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10px] font-medium text-[#FC8019] bg-[#FFF3E0] px-1.5 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
          {story.tags.length > 3 && (
            <span className="text-[10px] font-medium text-[#8E8E8E] bg-[#F5F5F5] px-1.5 py-0.5 rounded-full">
              +{story.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F0F0F0]">
        <div className="text-[10px] text-[#8E8E8E]">{story.updatedAt.toLocaleDateString()}</div>
        {story.estimatedHours && <div className="text-[10px] text-[#8E8E8E]">{story.estimatedHours}h</div>}
      </div>
    </div>
  )
}
