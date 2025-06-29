"use client"

import { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Calendar, User, Clock, Tag, MoreHorizontal, Edit, Trash2 } from "lucide-react"
import type { Story } from "@/types"

interface StoryCardEnhancedProps {
  story: Story
  onEdit: (story: Story) => void
  onToggleStatus: (storyId: string) => void
  onDelete?: (storyId: string) => void
  isDragging?: boolean
  showDetails?: boolean
}

export function StoryCardEnhanced({
  story,
  onEdit,
  onToggleStatus,
  onDelete,
  isDragging = false,
  showDetails = false,
}: StoryCardEnhancedProps) {
  const [showActions, setShowActions] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: story.id,
    data: {
      type: "story",
      story,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 200ms ease",
  }

  const isCompleted = story.status === "completed"
  const isCurrentlyDragging = isDragging || isSortableDragging

  const getPriorityColor = () => {
    switch (story.priority) {
      case "high":
        return "border-l-[#F44336] bg-gradient-to-r from-[#FFEBEE] to-white"
      case "medium":
        return "border-l-[#FF9800] bg-gradient-to-r from-[#FFF3E0] to-white"
      case "low":
        return "border-l-[#4CAF50] bg-gradient-to-r from-[#E8F5E8] to-white"
      default:
        return "border-l-[#E0E0E0] bg-white"
    }
  }

  const getStatusIcon = () => {
    switch (story.status) {
      case "completed":
        return "✅"
      case "in-progress":
        return "⚡"
      default:
        return "○"
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative border-l-4 rounded-lg p-4 cursor-pointer transition-all duration-200 group
        ${getPriorityColor()}
        ${
          isCurrentlyDragging
            ? "opacity-50 shadow-2xl scale-105 rotate-2 z-50"
            : "hover:shadow-md hover:scale-[1.02] hover:-translate-y-0.5"
        }
        ${isCompleted ? "opacity-75" : ""}
        ${isHovered ? "ring-2 ring-[#FC8019] ring-opacity-20" : ""}
      `}
      onClick={() => onEdit(story)}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <div className="grid grid-cols-2 gap-0.5 w-3 h-3">
          <div className="w-0.5 h-0.5 bg-[#8E8E8E] rounded-full hover:bg-[#FC8019] transition-colors"></div>
          <div className="w-0.5 h-0.5 bg-[#8E8E8E] rounded-full hover:bg-[#FC8019] transition-colors"></div>
          <div className="w-0.5 h-0.5 bg-[#8E8E8E] rounded-full hover:bg-[#FC8019] transition-colors"></div>
          <div className="w-0.5 h-0.5 bg-[#8E8E8E] rounded-full hover:bg-[#FC8019] transition-colors"></div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Status Checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleStatus(story.id)
            }}
            className={`
              w-5 h-5 border-2 rounded-sm flex items-center justify-center transition-all duration-200 transform hover:scale-110
              ${
                isCompleted
                  ? "bg-[#60B246] border-[#60B246] text-white shadow-md"
                  : "bg-white border-[#CCCCCC] hover:border-[#60B246] hover:shadow-sm"
              }
            `}
          >
            {isCompleted && <span className="text-[10px] font-bold">✓</span>}
          </button>

          {/* Story Number */}
          <span className="text-[13px] font-bold text-[#FC8019] bg-[rgba(252,128,25,0.1)] px-2 py-0.5 rounded-full">
            {story.number}
          </span>

          {/* Status Icon */}
          <span className="text-[14px]" title={story.status}>
            {getStatusIcon()}
          </span>
        </div>

        {/* Actions */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowActions(!showActions)
            }}
            className={`
              p-1 rounded-md transition-all duration-200
              ${
                showActions || isHovered
                  ? "opacity-100 bg-[rgba(252,128,25,0.1)] text-[#FC8019]"
                  : "opacity-0 group-hover:opacity-100 text-[#8E8E8E] hover:text-[#FC8019]"
              }
            `}
          >
            <MoreHorizontal size={16} />
          </button>

          {showActions && (
            <div className="absolute top-full right-0 mt-1 bg-white border border-[#E0E0E0] rounded-lg shadow-lg z-50 min-w-[120px] overflow-hidden animate-in slide-in-from-top-2 duration-200">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(story)
                  setShowActions(false)
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-[#3E3E3E] hover:bg-[#F5F5F5] transition-all"
              >
                <Edit size={14} />
                Edit
              </button>
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(story.id)
                    setShowActions(false)
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-[#F44336] hover:bg-[#FFEBEE] transition-all"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h4
        className={`
          text-[14px] font-medium mb-2 transition-all duration-200
          ${isCompleted ? "line-through text-[#8E8E8E]" : "text-[#1C1C1C] group-hover:text-[#FC8019]"}
        `}
      >
        {story.title}
      </h4>

      {/* Description */}
      {showDetails && story.description && (
        <p className="text-[12px] text-[#6B6B6B] mb-3 line-clamp-2">{story.description}</p>
      )}

      {/* Tags */}
      {story.tags && story.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {story.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 bg-[#FFF3E0] text-[#FC8019] px-2 py-0.5 rounded-full text-[11px] font-medium transition-all hover:bg-[#FFE0B2] hover:scale-105"
            >
              <Tag size={8} />
              {tag}
            </span>
          ))}
          {story.tags.length > 3 && (
            <span className="text-[11px] text-[#8E8E8E] px-2 py-0.5">+{story.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-[11px] text-[#8E8E8E]">
        <div className="flex items-center gap-3">
          {/* Created Date */}
          <div className="flex items-center gap-1">
            <Calendar size={10} />
            <span>{story.createdAt.toLocaleDateString("en-GB")}</span>
          </div>

          {/* Assignee */}
          {story.assignee && (
            <div className="flex items-center gap-1">
              <User size={10} />
              <span>{story.assignee}</span>
            </div>
          )}

          {/* Estimated Hours */}
          {story.estimatedHours && (
            <div className="flex items-center gap-1">
              <Clock size={10} />
              <span>{story.estimatedHours}h</span>
            </div>
          )}
        </div>

        {/* Priority Indicator */}
        <div
          className={`
            px-2 py-0.5 rounded-full text-[10px] font-medium transition-all
            ${
              story.priority === "high"
                ? "bg-[#FFEBEE] text-[#F44336]"
                : story.priority === "medium"
                  ? "bg-[#FFF3E0] text-[#FF9800]"
                  : "bg-[#E8F5E8] text-[#4CAF50]"
            }
          `}
        >
          {story.priority.charAt(0).toUpperCase() + story.priority.slice(1)}
        </div>
      </div>

      {/* Click outside to close actions */}
      {showActions && <div className="fixed inset-0 z-40" onClick={() => setShowActions(false)} />}
    </div>
  )
}
