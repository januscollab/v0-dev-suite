"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { Story } from "@/types"

interface StoryCardDraggableProps {
  story: Story
  onEdit: (story: Story) => void
  onToggleStatus: (storyId: string) => void
  isDragging?: boolean
}

export function StoryCardDraggable({ story, onEdit, onToggleStatus, isDragging = false }: StoryCardDraggableProps) {
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
    transition,
  }

  const isCompleted = story.status === "completed"
  const isCurrentlyDragging = isDragging || isSortableDragging

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-[#FEFEFE] border border-[#F5F5F5] rounded-lg p-3 flex items-center gap-3 cursor-move hover:bg-[#F5F5F5] hover:border-[#E0E0E0] hover:shadow-sm transition-all ${
        isCurrentlyDragging ? "opacity-50 shadow-lg z-50" : ""
      }`}
      onClick={() => onEdit(story)}
    >
      {/* Drag Handle */}
      <span
        {...attributes}
        {...listeners}
        className="text-[#8E8E8E] cursor-grab font-bold text-[11px] hover:text-[#FC8019] transition-colors"
      >
        ::
      </span>

      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggleStatus(story.id)
        }}
        className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center transition-all ${
          isCompleted ? "bg-[#60B246] border-[#60B246] text-white" : "bg-white border-[#CCCCCC] hover:border-[#60B246]"
        }`}
      >
        {isCompleted && <span className="text-[10px] font-bold">✓</span>}
      </button>

      {/* Content */}
      <div className="flex-1 flex items-center gap-3">
        <span className="text-[13px] font-medium text-[#1C1C1C]">{story.number}</span>
        <span className={`text-[13px] flex-1 ${isCompleted ? "line-through text-[#8E8E8E]" : "text-[#3E3E3E]"}`}>
          {story.title}
        </span>
      </div>

      {/* Date */}
      <span className="text-[11px] text-[#8E8E8E]">{story.createdAt.toLocaleDateString("en-GB")}</span>
    </div>
  )
}
