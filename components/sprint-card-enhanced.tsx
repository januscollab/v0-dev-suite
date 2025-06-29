"use client"

import { useState } from "react"
import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Plus, Play, FileText, ChevronDown, MoreVertical, Trash2 } from "lucide-react"
import { StoryCardDraggable } from "./story-card-draggable"
import type { Sprint, Story, Settings } from "@/types"

interface SprintCardEnhancedProps {
  sprint: Sprint
  onAddStory: () => void
  onEditStory: (story: Story) => void
  onUpdateStory: (storyId: string, updates: Partial<Story>) => void
  onOpenSprint: () => void
  onCloseCompleted: () => void
  onCloseAll: () => void
  onDeleteSprint?: (sprintId: string) => void
  onArchiveStories: (storyIds: string[]) => void
  settings: Settings
  isBacklog?: boolean
  isDragging?: boolean
}

export function SprintCardEnhanced({
  sprint,
  onAddStory,
  onEditStory,
  onUpdateStory,
  onOpenSprint,
  onCloseCompleted,
  onCloseAll,
  onDeleteSprint,
  onArchiveStories,
  settings,
  isBacklog = false,
  isDragging = false,
}: SprintCardEnhancedProps) {
  const [showCloseDropdown, setShowCloseDropdown] = useState(false)
  const [showMoreDropdown, setShowMoreDropdown] = useState(false)

  const { setNodeRef, isOver } = useDroppable({
    id: sprint.id,
  })

  // Get sprint icon and name
  const getSprintIcon = () => {
    switch (sprint.type) {
      case "priority":
        return "🔥"
      case "backlog":
        return "📋"
      default:
        return "⚡"
    }
  }

  const getSprintDisplayName = () => {
    if (sprint.type === "priority") return "Priority Sprint"
    if (sprint.type === "backlog") return "Backlog Sprint"
    return sprint.name
  }

  // Calculate stats
  const stories = sprint.stories || []
  const toDo = stories.filter((s) => s.status === "open").length
  const inProgress = stories.filter((s) => s.status === "in-progress").length
  const done = stories.filter((s) => s.status === "completed").length

  // Check if sprint can be deleted (only custom sprints)
  const canDelete = sprint.type === "custom" && onDeleteSprint

  // Handle close completed stories
  const handleCloseCompleted = () => {
    const completedStoryIds = stories.filter((s) => s.status === "completed").map((s) => s.id)
    if (completedStoryIds.length > 0) {
      onArchiveStories(completedStoryIds)
    }
    setShowCloseDropdown(false)
  }

  // Handle close all stories (archive all stories but keep sprint)
  const handleCloseAll = () => {
    const allStoryIds = stories.map((s) => s.id)
    if (allStoryIds.length > 0) {
      onArchiveStories(allStoryIds)
    }
    setShowCloseDropdown(false)
  }

  return (
    <div
      ref={setNodeRef}
      className={`bg-white border rounded-xl p-6 shadow-sm transition-all ${
        isOver
          ? "border-[#FC8019] shadow-lg ring-2 ring-[#FC8019] ring-opacity-20"
          : "border-[#E0E0E0] hover:shadow-md hover:border-[#CCCCCC]"
      } ${isDragging ? "opacity-50 rotate-2 shadow-2xl" : ""}`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {/* Drag Handle - Only for custom sprints */}
            {sprint.type === "custom" && (
              <div className="grid grid-cols-2 gap-0.5 w-3 h-3 cursor-grab opacity-40 hover:opacity-100 transition-opacity">
                <div className="w-0.5 h-0.5 bg-[#8E8E8E] rounded-full hover:bg-[#FC8019]"></div>
                <div className="w-0.5 h-0.5 bg-[#8E8E8E] rounded-full hover:bg-[#FC8019]"></div>
                <div className="w-0.5 h-0.5 bg-[#8E8E8E] rounded-full hover:bg-[#FC8019]"></div>
                <div className="w-0.5 h-0.5 bg-[#8E8E8E] rounded-full hover:bg-[#FC8019]"></div>
              </div>
            )}

            <span className="text-base">{getSprintIcon()}</span>
            <h3 className="text-lg font-semibold text-[#1C1C1C]">{getSprintDisplayName()}</h3>

            {/* Sprint type indicator */}
            {sprint.type === "priority" && (
              <span className="bg-[#FFE0B2] text-[#FC8019] px-2 py-0.5 rounded-full text-[11px] font-medium">
                Priority
              </span>
            )}
            {sprint.type === "backlog" && (
              <span className="bg-[#F5F5F5] text-[#6B6B6B] px-2 py-0.5 rounded-full text-[11px] font-medium">
                Backlog
              </span>
            )}
          </div>

          <div className="flex gap-4 text-[13px] text-[#6B6B6B]">
            <div className="flex items-center gap-1">
              <span>○</span>
              <span>{toDo} To Do</span>
            </div>
            <div className="flex items-center gap-1">
              <span>⚡</span>
              <span>{inProgress} In Progress</span>
            </div>
            <div className="flex items-center gap-1">
              <span>✓</span>
              <span>{done} Done</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1.5">
          <button
            onClick={onAddStory}
            className="flex items-center gap-1.5 px-3 py-2 text-[#3E3E3E] text-[13px] font-medium rounded-md hover:bg-[rgba(252,128,25,0.1)] hover:text-[#FC8019] transition-all"
          >
            <Plus size={16} />
            Add Story
          </button>

          <button
            onClick={onOpenSprint}
            className="flex items-center gap-1.5 px-3 py-2 text-[#3E3E3E] text-[13px] font-medium rounded-md hover:bg-[rgba(252,128,25,0.1)] hover:text-[#FC8019] transition-all"
          >
            <Play size={16} />
            Open
          </button>

          {/* Close dropdown - only show if there are stories */}
          {stories.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowCloseDropdown(!showCloseDropdown)}
                className="flex items-center gap-1.5 px-3 py-2 text-[#3E3E3E] text-[13px] font-medium rounded-md hover:bg-[rgba(252,128,25,0.1)] hover:text-[#FC8019] transition-all"
              >
                <FileText size={16} />
                Archive
                <ChevronDown size={8} />
              </button>

              {showCloseDropdown && (
                <div className="absolute top-full right-0 mt-1 bg-white border border-[#E0E0E0] rounded-lg shadow-lg z-50 min-w-[200px] overflow-hidden">
                  {done > 0 && (
                    <button
                      onClick={handleCloseCompleted}
                      className="flex items-center gap-2 w-full px-3 py-2.5 text-[13px] text-[#3E3E3E] hover:bg-[#F5F5F5] hover:text-[#1C1C1C] transition-all border-b border-[#F5F5F5]"
                    >
                      <span>✓</span>
                      Archive Completed ({done})
                    </button>
                  )}
                  <button
                    onClick={handleCloseAll}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-[13px] text-[#3E3E3E] hover:bg-[#F5F5F5] hover:text-[#1C1C1C] transition-all"
                  >
                    <FileText size={16} />
                    Archive All Stories ({stories.length})
                  </button>
                </div>
              )}
            </div>
          )}

          {/* More actions for custom sprints only */}
          {canDelete && (
            <div className="relative">
              <button
                onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                className="flex items-center gap-1.5 px-2 py-2 text-[#3E3E3E] text-[13px] font-medium rounded-md hover:bg-[rgba(252,128,25,0.1)] hover:text-[#FC8019] transition-all"
              >
                <MoreVertical size={16} />
              </button>

              {showMoreDropdown && (
                <div className="absolute top-full right-0 mt-1 bg-white border border-[#E0E0E0] rounded-lg shadow-lg z-50 min-w-[140px] overflow-hidden">
                  <button
                    onClick={() => {
                      onDeleteSprint(sprint.id)
                      setShowMoreDropdown(false)
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-[13px] text-[#F44336] hover:bg-[#FFEBEE] transition-all"
                  >
                    <Trash2 size={16} />
                    Delete Sprint
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stories */}
      <SortableContext items={stories.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div className={isBacklog ? "grid grid-cols-2 gap-4" : "space-y-2"}>
          {isBacklog ? (
            <>
              <div className="space-y-2">
                {stories.slice(0, Math.ceil(stories.length / 2)).map((story) => (
                  <StoryCardDraggable
                    key={story.id}
                    story={story}
                    onEdit={onEditStory}
                    onToggleStatus={(storyId) => {
                      const newStatus = story.status === "completed" ? "open" : "completed"
                      onUpdateStory(storyId, {
                        status: newStatus,
                        completedAt: newStatus === "completed" ? new Date() : undefined,
                      })
                    }}
                  />
                ))}
              </div>
              <div className="space-y-2">
                {stories.slice(Math.ceil(stories.length / 2)).map((story) => (
                  <StoryCardDraggable
                    key={story.id}
                    story={story}
                    onEdit={onEditStory}
                    onToggleStatus={(storyId) => {
                      const newStatus = story.status === "completed" ? "open" : "completed"
                      onUpdateStory(storyId, {
                        status: newStatus,
                        completedAt: newStatus === "completed" ? new Date() : undefined,
                      })
                    }}
                  />
                ))}
              </div>
            </>
          ) : (
            stories.map((story) => (
              <StoryCardDraggable
                key={story.id}
                story={story}
                onEdit={onEditStory}
                onToggleStatus={(storyId) => {
                  const newStatus = story.status === "completed" ? "open" : "completed"
                  onUpdateStory(storyId, {
                    status: newStatus,
                    completedAt: newStatus === "completed" ? new Date() : undefined,
                  })
                }}
              />
            ))
          )}
        </div>
      </SortableContext>

      {/* Empty state */}
      {stories.length === 0 && (
        <div className="text-center py-8 text-[#8E8E8E] border-2 border-dashed border-[#E0E0E0] rounded-lg">
          <p className="mb-1">No stories yet</p>
          <p className="text-[12px]">Drag stories here or click "Add Story"</p>
        </div>
      )}

      {/* Click outside to close dropdowns */}
      {(showCloseDropdown || showMoreDropdown) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowCloseDropdown(false)
            setShowMoreDropdown(false)
          }}
        />
      )}
    </div>
  )
}
