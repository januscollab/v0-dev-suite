"use client"

import { useState } from "react"
import { DndContext, type DragEndEvent, DragOverlay, type DragStartEvent, closestCenter } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Settings, Search } from "lucide-react"
import { useScrumDataEnhanced } from "@/hooks/use-scrum-data-enhanced"
import { SortableSprintCard } from "./sortable-sprint-card"
import { StoryCard } from "./story-card"
import { AddStoryModal } from "./add-story-modal"
import { AddSprintModal } from "./add-sprint-modal"
import { SettingsModal } from "./settings-modal"
import type { Story, Sprint } from "@/types"
import { SprintCard } from "./sprint-card-updated"
import { DataManagementPanel } from "./data-management-panel"

export function ScrumBoard() {
  const [currentView, setCurrentView] = useState<"active" | "archived">("active")
  const {
    sprints,
    archivedSprints,
    settings,
    isLoading,
    lastSaved,
    addStory,
    updateStory,
    moveStory,
    addSprint,
    updateSprint,
    deleteSprint,
    getSprintProgress,
    setSettings,
    archiveSprint,
    restoreSprint,
    reorderSprints,
    manualSave,
    handleExport,
    handleImport,
    getStorageInfo,
  } = useScrumDataEnhanced()

  const [activeStory, setActiveStory] = useState<Story | null>(null)
  const [activeSprint, setActiveSprint] = useState<Sprint | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddStoryModal, setShowAddStoryModal] = useState(false)
  const [showAddSprintModal, setShowAddSprintModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [selectedSprintId, setSelectedSprintId] = useState<string>("")

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const activeId = active.id as string

    // Check if dragging a story
    const story = sprints.flatMap((s) => s.stories).find((s) => s.id === activeId)
    if (story) {
      setActiveStory(story)
      return
    }

    // Check if dragging a sprint
    const sprint = sprints.find((s) => s.id === activeId)
    if (sprint) {
      setActiveSprint(sprint)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveStory(null)
    setActiveSprint(null)

    if (!over || active.id === over.id) return

    const activeId = active.id as string
    const overId = over.id as string

    // Handle story drag
    const story = sprints.flatMap((s) => s.stories).find((s) => s.id === activeId)
    if (story) {
      moveStory(activeId, overId)
      return
    }

    // Handle sprint reordering
    const activeSprint = sprints.find((s) => s.id === activeId)
    const overSprint = sprints.find((s) => s.id === overId)

    if (activeSprint && overSprint && activeSprint.type === "custom" && overSprint.type === "custom") {
      const oldIndex = sprints.findIndex((s) => s.id === activeId)
      const newIndex = sprints.findIndex((s) => s.id === overId)

      if (oldIndex !== newIndex) {
        const newSprints = arrayMove(sprints, oldIndex, newIndex)
        reorderSprints(newSprints)
      }
    }
  }

  const filteredSprints = sprints
    .filter((sprint) => {
      if (!searchQuery) return true

      const query = searchQuery.toLowerCase()
      return (
        sprint.name.toLowerCase().includes(query) ||
        sprint.stories.some(
          (story) =>
            story.title.toLowerCase().includes(query) ||
            story.description.toLowerCase().includes(query) ||
            story.number.toLowerCase().includes(query) ||
            story.tags.some((tag) => tag.toLowerCase().includes(query)),
        )
      )
    })
    .sort((a, b) => a.position - b.position)

  const prioritySprint = filteredSprints.find((s) => s.type === "priority")
  const backlogSprint = filteredSprints.find((s) => s.type === "backlog")
  const customSprints = filteredSprints.filter((s) => s.type === "custom")

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            <h1 className="text-3xl font-bold">Scrum Master Board</h1>
            <div className="flex items-center gap-2">
              <Button
                variant={currentView === "active" ? "default" : "ghost"}
                onClick={() => setCurrentView("active")}
                size="sm"
              >
                Active Sprints
              </Button>
              <Button
                variant={currentView === "archived" ? "default" : "ghost"}
                onClick={() => setCurrentView("archived")}
                size="sm"
              >
                Archived ({archivedSprints.length})
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search stories, sprints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <DataManagementPanel
              lastSaved={lastSaved}
              onManualSave={manualSave}
              onExport={handleExport}
              onImport={handleImport}
              storageInfo={getStorageInfo()}
            />
            <Button onClick={() => setShowAddSprintModal(true)} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Sprint
            </Button>
            <Button onClick={() => setShowSettingsModal(true)} variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
          {currentView === "active" ? (
            <div className="space-y-6">
              {/* Priority Sprint - Fixed position */}
              {prioritySprint && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SprintCard
                    sprint={prioritySprint}
                    progress={getSprintProgress(prioritySprint.id)}
                    onAddStory={() => {
                      setSelectedSprintId(prioritySprint.id)
                      setShowAddStoryModal(true)
                    }}
                    onUpdateSprint={updateSprint}
                    onDeleteSprint={deleteSprint}
                    onUpdateStory={updateStory}
                    settings={settings}
                  />
                </div>
              )}

              {/* Custom Sprints - Sortable */}
              {customSprints.length > 0 && (
                <SortableContext items={customSprints.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {customSprints.map((sprint) => (
                      <SortableSprintCard
                        key={sprint.id}
                        sprint={sprint}
                        progress={getSprintProgress(sprint.id)}
                        onAddStory={() => {
                          setSelectedSprintId(sprint.id)
                          setShowAddStoryModal(true)
                        }}
                        onUpdateSprint={updateSprint}
                        onDeleteSprint={deleteSprint}
                        onUpdateStory={updateStory}
                        settings={settings}
                      />
                    ))}
                  </div>
                </SortableContext>
              )}

              {/* Backlog Sprint - Fixed position */}
              {backlogSprint && (
                <div className="w-full">
                  <SprintCard
                    sprint={backlogSprint}
                    progress={getSprintProgress(backlogSprint.id)}
                    onAddStory={() => {
                      setSelectedSprintId(backlogSprint.id)
                      setShowAddStoryModal(true)
                    }}
                    onUpdateSprint={updateSprint}
                    onDeleteSprint={deleteSprint}
                    onUpdateStory={updateStory}
                    settings={settings}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">Archived sprints and their stories</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {archivedSprints.map((sprint) => (
                  <SprintCard
                    key={sprint.id}
                    sprint={sprint}
                    progress={getSprintProgress(sprint.id)}
                    onAddStory={() => {}}
                    onUpdateSprint={updateSprint}
                    onDeleteSprint={deleteSprint}
                    onUpdateStory={updateStory}
                    settings={settings}
                    isArchived={true}
                    onRestoreSprint={() => restoreSprint(sprint.id)}
                  />
                ))}
              </div>
            </div>
          )}

          <DragOverlay>
            {activeStory ? (
              <StoryCard story={activeStory} onUpdate={() => {}} isDragging />
            ) : activeSprint ? (
              <SprintCard
                sprint={activeSprint}
                progress={getSprintProgress(activeSprint.id)}
                onAddStory={() => {}}
                onUpdateSprint={() => {}}
                onDeleteSprint={() => {}}
                onUpdateStory={() => {}}
                settings={settings}
                isDragging
              />
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Modals */}
        <AddStoryModal
          open={showAddStoryModal}
          onOpenChange={setShowAddStoryModal}
          sprintId={selectedSprintId}
          onAddStory={addStory}
          settings={settings}
        />

        <AddSprintModal
          open={showAddSprintModal}
          onOpenChange={setShowAddSprintModal}
          onAddSprint={addSprint}
          existingPositions={sprints.map((s) => s.position)}
        />

        <SettingsModal
          open={showSettingsModal}
          onOpenChange={setShowSettingsModal}
          settings={settings}
          onUpdateSettings={setSettings}
        />
      </div>
    </div>
  )
}
