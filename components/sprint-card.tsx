"use client"

import { useState } from "react"
import { MoreVertical, Plus, Play, Archive, Edit, Trash2, CheckCircle } from "lucide-react"
import { StoryCard } from "./story-card"
import { DevelopmentPromptModal } from "./development-prompt-modal"
import { AddStoryModal } from "./add-story-modal"
import type { Sprint, Story, Settings } from "@/types"

interface SprintCardProps {
  sprint: Sprint
  stories: Story[]
  allSprints: Sprint[]
  settings: Settings
  onAddStory: (sprintId: string, storyData: any) => void
  onUpdateStory: (storyId: string, updates: Partial<Story>) => void
  onDeleteStory: (storyId: string) => void
  onMoveStory: (storyId: string, targetSprintId: string) => void
  onArchiveStories: (storyIds: string[]) => number
  onUpdateSprint: (sprintId: string, updates: Partial<Sprint>) => void
  onDeleteSprint: (sprintId: string) => void
  onArchiveSprint: (sprintId: string) => void
  progress: { toDo: number; inProgress: number; done: number }
  aiAvailable: boolean
  onSave?: () => void
}

export function SprintCard({
  sprint,
  stories = [], // Default to empty array
  allSprints = [], // Default to empty array
  settings,
  onAddStory,
  onUpdateStory,
  onDeleteStory,
  onMoveStory,
  onArchiveStories,
  onUpdateSprint,
  onDeleteSprint,
  onArchiveSprint,
  progress,
  aiAvailable,
  onSave,
}: SprintCardProps) {
  const [showAddStory, setShowAddStory] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showPromptModal, setShowPromptModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(sprint.name)

  // Filter stories for this sprint
  const sprintStories = stories.filter((story) => story.sprintId === sprint.id)

  const handleAddStory = (storyData: any) => {
    onAddStory(sprint.id, storyData)
    setShowAddStory(false)
  }

  const handleArchiveCompleted = () => {
    const completedStoryIds = sprintStories.filter((story) => story.status === "completed").map((story) => story.id)
    if (completedStoryIds.length > 0) {
      const archivedCount = onArchiveStories(completedStoryIds)
      console.log(`Archived ${archivedCount} completed stories`)
    }
    setShowMenu(false)
  }

  const handleArchiveAll = () => {
    if (sprintStories.length > 0) {
      const allStoryIds = sprintStories.map((story) => story.id)
      const archivedCount = onArchiveStories(allStoryIds)
      console.log(`Archived ${archivedCount} stories`)
    }
    setShowMenu(false)
  }

  const handleSaveEdit = () => {
    if (editName.trim() && editName !== sprint.name) {
      onUpdateSprint(sprint.id, { name: editName.trim() })
    }
    setIsEditing(false)
    setEditName(sprint.name)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditName(sprint.name)
  }

  const getSprintTypeIcon = () => {
    switch (sprint.type) {
      case "priority":
        return "🎯"
      case "backlog":
        return "📋"
      default:
        return "🚀"
    }
  }

  const getSprintTypeColor = () => {
    switch (sprint.type) {
      case "priority":
        return "border-[#F44336] bg-[rgba(244,67,54,0.05)]"
      case "backlog":
        return "border-[#6B6B6B] bg-[rgba(107,107,107,0.05)]"
      default:
        return "border-[#FC8019] bg-[rgba(252,128,25,0.05)]"
    }
  }

  const totalStories = progress.toDo + progress.inProgress + progress.done
  const completionPercentage = totalStories > 0 ? Math.round((progress.done / totalStories) * 100) : 0

  return (
    <>
      <div className={`bg-white rounded-xl border-2 ${getSprintTypeColor()} shadow-sm hover:shadow-md transition-all`}>
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#E0E0E0] relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-lg">{getSprintTypeIcon()}</span>
              {isEditing ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveEdit()
                      if (e.key === "Escape") handleCancelEdit()
                    }}
                    className="flex-1 px-2 py-1 border border-[#FC8019] rounded text-[14px] font-semibold focus:outline-none focus:ring-2 focus:ring-[#FC8019]/20"
                    autoFocus
                  />
                  <button onClick={handleSaveEdit} className="p-1 text-[#60B246] hover:bg-[#60B246]/10 rounded">
                    <CheckCircle size={16} />
                  </button>
                </div>
              ) : (
                <h3
                  className="text-[14px] font-semibold text-[#1C1C1C] cursor-pointer hover:text-[#FC8019] transition-colors"
                  onClick={() => setIsEditing(true)}
                >
                  {sprint.name}
                </h3>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Progress Badge */}
              {totalStories > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 bg-[#F5F5F5] rounded-full">
                  <span className="text-[11px] font-medium text-[#3E3E3E]">{completionPercentage}%</span>
                  <div className="w-8 h-1.5 bg-[#E0E0E0] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#60B246] transition-all duration-300"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1.5 text-[#8E8E8E] hover:text-[#FC8019] hover:bg-[rgba(252,128,25,0.1)] rounded-md transition-all"
                >
                  <MoreVertical size={16} />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-8 bg-white border border-[#E0E0E0] rounded-lg shadow-lg z-10 min-w-[180px]">
                    <button
                      onClick={() => {
                        setShowPromptModal(true)
                        setShowMenu(false)
                      }}
                      disabled={sprintStories.length === 0}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[#1C1C1C] hover:bg-[#F8F8F8] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Play size={14} />
                      Open Sprint
                    </button>

                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[#1C1C1C] hover:bg-[#F8F8F8]"
                    >
                      <Edit size={14} />
                      Edit Sprint
                    </button>

                    <div className="border-t border-[#E0E0E0] my-1" />

                    <button
                      onClick={handleArchiveCompleted}
                      disabled={progress.done === 0}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[#1C1C1C] hover:bg-[#F8F8F8] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Archive size={14} />
                      Archive Completed ({progress.done})
                    </button>

                    <button
                      onClick={handleArchiveAll}
                      disabled={sprintStories.length === 0}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[#1C1C1C] hover:bg-[#F8F8F8] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Archive size={14} />
                      Archive All Stories ({sprintStories.length})
                    </button>

                    {sprint.type === "custom" && (
                      <>
                        <div className="border-t border-[#E0E0E0] my-1" />
                        <button
                          onClick={() => {
                            onArchiveSprint(sprint.id)
                            setShowMenu(false)
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[#F44336] hover:bg-[#FFF5F5]"
                        >
                          <Archive size={14} />
                          Archive Sprint
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete "${sprint.name}"? Stories will be moved to Backlog.`)) {
                              onDeleteSprint(sprint.id)
                            }
                            setShowMenu(false)
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[#F44336] hover:bg-[#FFF5F5]"
                        >
                          <Trash2 size={14} />
                          Delete Sprint
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {totalStories > 0 && (
            <div className="mt-2 flex items-center gap-2 text-[11px]">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#8E8E8E]" />
                <span className="text-[#6B6B6B]">{progress.toDo} To Do</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#FC8019]" />
                <span className="text-[#6B6B6B]">{progress.inProgress} In Progress</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#60B246]" />
                <span className="text-[#6B6B6B]">{progress.done} Done</span>
              </div>
            </div>
          )}
        </div>

        {/* Stories */}
        <div className="p-4">
          {sprintStories.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-[#D3D3D3] mb-2">📝</div>
              <div className="text-[12px] text-[#8E8E8E] mb-3">No stories yet</div>
              <button
                onClick={() => setShowAddStory(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#FC8019] text-white text-[12px] font-medium rounded-md hover:bg-[#E6722E] transition-all mx-auto"
              >
                <Plus size={14} />
                Add First Story
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {sprintStories.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  allSprints={allSprints}
                  onUpdate={onUpdateStory}
                  onDelete={onDeleteStory}
                  onMove={onMoveStory}
                />
              ))}

              <button
                onClick={() => setShowAddStory(true)}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[#E0E0E0] rounded-lg text-[#8E8E8E] hover:border-[#FC8019] hover:text-[#FC8019] hover:bg-[rgba(252,128,25,0.05)] transition-all"
              >
                <Plus size={16} />
                <span className="text-[13px] font-medium">Add Story</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Story Modal */}
      <AddStoryModal
        open={showAddStory}
        onOpenChange={setShowAddStory}
        sprintId={sprint.id}
        onAddStory={handleAddStory}
        settings={settings}
        onSave={onSave}
      />

      {/* Development Prompt Modal */}
      <DevelopmentPromptModal
        open={showPromptModal}
        onOpenChange={setShowPromptModal}
        sprint={sprint}
        stories={sprintStories}
        aiAvailable={aiAvailable}
      />
    </>
  )
}
