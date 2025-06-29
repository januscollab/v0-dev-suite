"use client"

import { useState } from "react"
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter,
} from "@dnd-kit/core"
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useHybridScrumData } from "@/hooks/use-hybrid-scrum-data"
import { Header } from "./header"
import { SprintCardEnhanced } from "./sprint-card-enhanced"
import { SortableSprintCardEnhanced } from "./sortable-sprint-card-enhanced"
import { StoryCardDraggable } from "./story-card-draggable"
import { AddSprintModal } from "./add-sprint-modal"
import { AddStoryModal } from "./add-story-modal"
import { EditStoryModal } from "./edit-story-modal"
import { SettingsModalEnhanced } from "./settings-modal-enhanced"
import { BoltPromptModal } from "./bolt-prompt-modal"
import { ArchiveView } from "./archive-view"
import { toast } from "@/hooks/use-toast"
import type { Story, Sprint } from "@/types"

export function ScrumBoardEnhanced() {
  const {
    sprints,
    archivedSprints,
    settings,
    isLoading,
    lastSaved,
    connectionStatus,
    addStory,
    updateStory,
    deleteStory,
    moveStory,
    addSprint,
    updateSprint,
    deleteSprint,
    archiveSprint,
    restoreSprint,
    reorderSprints,
    getAllStories,
    getSprintProgress,
    setSettings,
    manualSave,
    getStorageInfo,
  } = useHybridScrumData()

  const [activeView, setActiveView] = useState<"active" | "archive">("active")
  const [isAddSprintModalOpen, setIsAddSprintModalOpen] = useState(false)
  const [isAddStoryModalOpen, setIsAddStoryModalOpen] = useState(false)
  const [isEditStoryModalOpen, setIsEditStoryModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [isBoltPromptModalOpen, setIsBoltPromptModalOpen] = useState(false)
  const [selectedSprintId, setSelectedSprintId] = useState<string>("")
  const [selectedStory, setSelectedStory] = useState<Story | null>(null)
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeStory, setActiveStory] = useState<Story | null>(null)
  const [activeSprint, setActiveSprint] = useState<Sprint | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  const handleAddStory = (sprintId: string) => {
    setSelectedSprintId(sprintId)
    setIsAddStoryModalOpen(true)
  }

  const handleEditStory = (story: Story) => {
    setSelectedStory(story)
    setIsEditStoryModalOpen(true)
  }

  const handleOpenSprint = (sprint: Sprint) => {
    setSelectedSprint(sprint)
    setIsBoltPromptModalOpen(true)
  }

  const handleCloseCompleted = (sprintId: string) => {
    const sprint = sprints?.find((s) => s.id === sprintId)
    if (!sprint) return

    const completedStories = sprint.stories.filter((s) => s.status === "completed")

    // Archive completed stories
    completedStories.forEach((story) => {
      updateStory(story.id, {
        status: "completed",
        completedAt: new Date(),
        isArchived: true,
      })
    })

    toast({
      title: "Completed stories archived",
      description: `${completedStories.length} stories have been moved to archive.`,
    })
  }

  const handleCloseAll = (sprintId: string) => {
    const sprint = sprints?.find((s) => s.id === sprintId)
    if (!sprint) return

    // Mark all stories as completed and archive them
    sprint.stories.forEach((story) => {
      updateStory(story.id, {
        status: "completed",
        completedAt: new Date(),
        isArchived: true,
      })
    })

    // Archive the sprint itself
    archiveSprint(sprintId)

    toast({
      title: "Sprint archived",
      description: `${sprint.name} and all its stories have been archived.`,
    })
  }

  const handleAddSprint = async (sprintData: any) => {
    try {
      addSprint(sprintData)
      toast({
        title: "Sprint created!",
        description: `${sprintData.name} has been added to your board.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create sprint. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddStorySubmit = async (storyData: any) => {
    try {
      const newStory = addStory(selectedSprintId, storyData)
      toast({
        title: "Story added!",
        description: `${newStory.number}: ${newStory.title}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add story. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)

    // Check if dragging a story
    const allStories = getAllStories() || []
    const story = allStories.find((s) => s.id === active.id)
    if (story) {
      setActiveStory(story)
      return
    }

    // Check if dragging a sprint
    const sprint = sprints?.find((s) => s.id === active.id)
    if (sprint) {
      setActiveSprint(sprint)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Get all stories safely
    const allStories = getAllStories() || []

    // Find if we're dragging a story
    const activeStory = allStories.find((story) => story.id === activeId)
    if (activeStory && activeStory.sprintId !== overId) {
      // Check if overId is a sprint
      const targetSprint = sprints?.find((sprint) => sprint.id === overId)
      if (targetSprint) {
        moveStory(activeId, overId)

        toast({
          title: "Story moved",
          description: `${activeStory.number} moved to ${targetSprint.name}`,
        })
      }
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setActiveStory(null)
    setActiveSprint(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Handle sprint reordering
    const activeSprint = sprints?.find((sprint) => sprint.id === activeId)
    const overSprint = sprints?.find((sprint) => sprint.id === overId)

    if (activeSprint && overSprint && activeSprint.type === "custom" && activeId !== overId) {
      const customSprints = sprints?.filter((s) => s.type === "custom") || []
      const oldIndex = customSprints.findIndex((sprint) => sprint.id === activeId)
      const newIndex = customSprints.findIndex((sprint) => sprint.id === overId)

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedCustomSprints = arrayMove(customSprints, oldIndex, newIndex)
        const allSprintIds = [
          ...(sprints?.filter((s) => s.type !== "custom").map((s) => s.id) || []),
          ...reorderedCustomSprints.map((s) => s.id),
        ]
        reorderSprints(allSprintIds)

        toast({
          title: "Sprint reordered",
          description: `${activeSprint.name} moved to new position`,
        })
      }
    }
  }

  // Sort sprints by position safely
  const sortedSprints = sprints ? [...sprints].sort((a, b) => a.position - b.position) : []
  const prioritySprint = sortedSprints.find((s) => s.type === "priority")
  const customSprints = sortedSprints.filter((s) => s.type === "custom")
  const backlogSprint = sortedSprints.find((s) => s.type === "backlog")

  const existingPositions = sprints?.map((s) => s.position) || []

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FC8019] mx-auto mb-4"></div>
          <p className="text-[#6B6B6B]">Loading your scrum board...</p>
        </div>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      collisionDetection={closestCenter}
    >
      <div className="min-h-screen bg-[#F8F8F8]">
        <Header
          activeView={activeView}
          onViewChange={setActiveView}
          onAddSprint={() => setIsAddSprintModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          archivedCount={archivedSprints?.length || 0}
        />

        <main className="px-5 py-6">
          <h1 className="text-[28px] font-bold text-[#1C1C1C] mb-8">Sprint Board</h1>

          {activeView === "active" ? (
            <div className="grid grid-cols-2 gap-5 w-full mb-6">
              {/* Priority Sprint - 50% width */}
              {prioritySprint && (
                <SprintCardEnhanced
                  sprint={prioritySprint}
                  onAddStory={() => handleAddStory(prioritySprint.id)}
                  onEditStory={handleEditStory}
                  onUpdateStory={updateStory}
                  onOpenSprint={() => handleOpenSprint(prioritySprint)}
                  onCloseCompleted={() => handleCloseCompleted(prioritySprint.id)}
                  onCloseAll={() => handleCloseAll(prioritySprint.id)}
                  onDeleteSprint={deleteSprint}
                  settings={settings}
                />
              )}

              {/* Custom Sprints - 50% width each */}
              <SortableContext items={customSprints.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                {customSprints.map((sprint) => (
                  <SortableSprintCardEnhanced
                    key={sprint.id}
                    sprint={sprint}
                    onAddStory={() => handleAddStory(sprint.id)}
                    onEditStory={handleEditStory}
                    onUpdateStory={updateStory}
                    onOpenSprint={() => handleOpenSprint(sprint)}
                    onCloseCompleted={() => handleCloseCompleted(sprint.id)}
                    onCloseAll={() => handleCloseAll(sprint.id)}
                    onDeleteSprint={deleteSprint}
                    settings={settings}
                  />
                ))}
              </SortableContext>

              {/* Backlog Sprint - Full width */}
              {backlogSprint && (
                <div className="col-span-2 mt-5">
                  <SprintCardEnhanced
                    sprint={backlogSprint}
                    onAddStory={() => handleAddStory(backlogSprint.id)}
                    onEditStory={handleEditStory}
                    onUpdateStory={updateStory}
                    onOpenSprint={() => handleOpenSprint(backlogSprint)}
                    onCloseCompleted={() => handleCloseCompleted(backlogSprint.id)}
                    onCloseAll={() => handleCloseAll(backlogSprint.id)}
                    onDeleteSprint={deleteSprint}
                    settings={settings}
                    isBacklog={true}
                  />
                </div>
              )}
            </div>
          ) : (
            <ArchiveView
              archivedSprints={archivedSprints || []}
              onRestoreSprint={restoreSprint}
              onEditStory={handleEditStory}
              onRestoreStory={(storyId) => {
                // Move story back to priority sprint
                const prioritySprintId = prioritySprint?.id
                if (prioritySprintId) {
                  updateStory(storyId, {
                    isArchived: false,
                    sprintId: prioritySprintId,
                  })
                  moveStory(storyId, prioritySprintId)

                  toast({
                    title: "Story restored",
                    description: "Story moved back to Priority Sprint",
                  })
                }
              }}
            />
          )}

          {/* Drag Overlay */}
          <DragOverlay>
            {activeStory ? (
              <StoryCardDraggable story={activeStory} onEdit={() => {}} onToggleStatus={() => {}} isDragging={true} />
            ) : activeSprint ? (
              <SprintCardEnhanced
                sprint={activeSprint}
                onAddStory={() => {}}
                onEditStory={() => {}}
                onUpdateStory={() => {}}
                onOpenSprint={() => {}}
                onCloseCompleted={() => {}}
                onCloseAll={() => {}}
                onDeleteSprint={() => {}}
                settings={settings}
                isDragging={true}
              />
            ) : null}
          </DragOverlay>
        </main>

        {/* Modals */}
        <AddSprintModal
          open={isAddSprintModalOpen}
          onOpenChange={setIsAddSprintModalOpen}
          onAddSprint={handleAddSprint}
          existingPositions={existingPositions}
        />

        <AddStoryModal
          open={isAddStoryModalOpen}
          onOpenChange={setIsAddStoryModalOpen}
          sprintId={selectedSprintId}
          onAddStory={handleAddStorySubmit}
          settings={settings}
        />

        <EditStoryModal
          open={isEditStoryModalOpen}
          onOpenChange={setIsEditStoryModalOpen}
          story={selectedStory}
          onUpdateStory={updateStory}
          onDeleteStory={deleteStory}
          settings={settings}
        />

        <SettingsModalEnhanced
          open={isSettingsModalOpen}
          onOpenChange={setIsSettingsModalOpen}
          settings={settings}
          onUpdateSettings={setSettings}
          lastSaved={lastSaved}
          onManualSave={manualSave}
          onExport={() => {}}
          onImport={() => {}}
          storageInfo={getStorageInfo()}
        />

        <BoltPromptModal
          open={isBoltPromptModalOpen}
          onOpenChange={setIsBoltPromptModalOpen}
          sprint={selectedSprint}
          stories={selectedSprint?.stories || []}
          settings={settings}
        />
      </div>
    </DndContext>
  )
}
