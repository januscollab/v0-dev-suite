"use client"

import { useState } from "react"
import { Plus, Settings, Archive, Search } from "lucide-react"
import { useScrumData } from "@/hooks/use-scrum-data"
import { useAIIntegration } from "@/hooks/use-ai-integration"
import { SprintCard } from "@/components/sprint-card"
import { AddStoryModal } from "@/components/add-story-modal"
import { AddSprintModal } from "@/components/add-sprint-modal"
import { SettingsModal } from "@/components/settings-modal"
import { ArchiveView } from "@/components/archive-view"
import { SearchAndFilter } from "@/components/search-and-filter"
import { SyncStatusIndicator } from "@/components/sync-status-indicator"
import { DevelopmentPromptModal } from "@/components/development-prompt-modal"

export function ScrumBoard() {
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
    archiveStories,
    addSprint,
    updateSprint,
    deleteSprint,
    archiveSprint,
    restoreSprint,
    reorderSprints,
    getAllStories,
    getSprintProgress,
    setSettings,
    getStorageInfo,
    exportData,
    importData,
    forceSave,
  } = useScrumData()

  const [showAddStory, setShowAddStory] = useState(false)
  const [showAddSprint, setShowAddSprint] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showArchive, setShowArchive] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showDevelopmentPrompt, setShowDevelopmentPrompt] = useState(false)
  const [selectedSprintForStory, setSelectedSprintForStory] = useState<string>("")
  const [selectedSprintForPrompt, setSelectedSprintForPrompt] = useState<string>("")

  const { isAvailable: aiAvailable } = useAIIntegration(settings)

  const activeSprints = sprints?.filter((sprint) => sprint.isActive) || []
  const prioritySprint = activeSprints.find((sprint) => sprint.type === "priority")
  const backlogSprint = activeSprints.find((sprint) => sprint.type === "backlog")
  const customSprints = activeSprints.filter((sprint) => sprint.type === "custom")

  const handleAddStory = (sprintId: string) => {
    setSelectedSprintForStory(sprintId)
    setShowAddStory(true)
  }

  const handleOpenSprint = (sprintId: string) => {
    setSelectedSprintForPrompt(sprintId)
    setShowDevelopmentPrompt(true)
  }

  const handleAddStorySubmit = (storyData: any) => {
    addStory(selectedSprintForStory, storyData)
    setShowAddStory(false)
  }

  const handleAddSprint = () => {
    const name = prompt("Enter sprint name:")
    if (name?.trim()) {
      addSprint({ name: name.trim() })
    }
  }

  const allStories = getAllStories()

  const totalStories = allStories.length
  const completedStories = allStories.filter((s) => s.status === "completed").length
  const inProgressStories = allStories.filter((s) => s.status === "in-progress").length

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FC8019] mx-auto mb-4"></div>
          <div className="text-[#6B6B6B] text-[14px]">Loading your scrum board...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] space-y-6">
      {/* Header */}
      <div className="bg-white border-b border-[#E0E0E0] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1C1C1C]">Scrum Master Board</h1>
            <div className="text-[13px] text-[#6B6B6B] mt-1">
              {totalStories} stories across {activeSprints.length} active sprints
            </div>
          </div>

          <div className="flex items-center gap-3">
            <SyncStatusIndicator lastSaved={lastSaved} />

            <button
              onClick={() => setShowSearch(true)}
              className="flex items-center gap-2 px-3 py-2 text-[#6B6B6B] hover:text-[#FC8019] hover:bg-[rgba(252,128,25,0.1)] rounded-lg transition-all"
            >
              <Search size={18} />
              <span className="text-[13px] font-medium">Search</span>
            </button>

            <button
              onClick={() => setShowArchive(true)}
              className="flex items-center gap-2 px-3 py-2 text-[#6B6B6B] hover:text-[#FC8019] hover:bg-[rgba(252,128,25,0.1)] rounded-lg transition-all"
            >
              <Archive size={18} />
              <span className="text-[13px] font-medium">Archive</span>
            </button>

            <button
              onClick={handleAddSprint}
              className="flex items-center gap-2 px-3 py-2 bg-[#FC8019] text-white rounded-lg hover:bg-[#E6722E] transition-all"
            >
              <Plus size={18} />
              <span className="text-[13px] font-medium">Add Sprint</span>
            </button>

            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-3 py-2 text-[#6B6B6B] hover:text-[#FC8019] hover:bg-[rgba(252,128,25,0.1)] rounded-lg transition-all"
            >
              <Settings size={18} />
              <span className="text-[13px] font-medium">Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sprint Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Priority Sprint */}
          {prioritySprint && (
            <div className="lg:col-span-1">
              <SprintCard
                sprint={prioritySprint}
                stories={allStories}
                allSprints={sprints}
                settings={settings}
                onAddStory={() => handleAddStory(prioritySprint.id)}
                onUpdateStory={updateStory}
                onDeleteStory={deleteStory}
                onMoveStory={moveStory}
                onArchiveStories={archiveStories}
                onUpdateSprint={updateSprint}
                onDeleteSprint={deleteSprint}
                onArchiveSprint={archiveSprint}
                onOpenSprint={() => handleOpenSprint(prioritySprint.id)}
                progress={getSprintProgress(prioritySprint.id)}
                aiAvailable={aiAvailable}
                onSave={forceSave}
              />
            </div>
          )}

          {/* Custom Sprints */}
          {customSprints.map((sprint) => (
            <div key={sprint.id} className="lg:col-span-1">
              <SprintCard
                sprint={sprint}
                stories={allStories}
                allSprints={sprints}
                settings={settings}
                onAddStory={() => handleAddStory(sprint.id)}
                onUpdateStory={updateStory}
                onDeleteStory={deleteStory}
                onMoveStory={moveStory}
                onArchiveStories={archiveStories}
                onUpdateSprint={updateSprint}
                onDeleteSprint={deleteSprint}
                onArchiveSprint={archiveSprint}
                onOpenSprint={() => handleOpenSprint(sprint.id)}
                progress={getSprintProgress(sprint.id)}
                aiAvailable={aiAvailable}
                onSave={forceSave}
              />
            </div>
          ))}
        </div>

        {/* Backlog Sprint - Full Width */}
        {backlogSprint && (
          <div className="mt-6">
            <SprintCard
              sprint={backlogSprint}
              stories={allStories}
              allSprints={sprints}
              settings={settings}
              onAddStory={() => handleAddStory(backlogSprint.id)}
              onUpdateStory={updateStory}
              onDeleteStory={deleteStory}
              onMoveStory={moveStory}
              onArchiveStories={archiveStories}
              onUpdateSprint={updateSprint}
              onDeleteSprint={deleteSprint}
              onArchiveSprint={archiveSprint}
              onOpenSprint={() => handleOpenSprint(backlogSprint.id)}
              progress={getSprintProgress(backlogSprint.id)}
              aiAvailable={aiAvailable}
              onSave={forceSave}
            />
          </div>
        )}
      </div>

      {/* Empty State */}
      {totalStories === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-[#E0E0E0]">
          <div className="text-[#D3D3D3] mb-4">📝</div>
          <h3 className="text-[16px] font-semibold text-[#1C1C1C] mb-2">No Stories Yet</h3>
          <p className="text-[13px] text-[#6B6B6B] mb-6 max-w-md mx-auto">
            Start by adding your first user story to any sprint. Use AI assistance to generate comprehensive stories
            from simple prompts.
          </p>
          <button
            onClick={() => handleAddStory(prioritySprint?.id || "")}
            className="flex items-center gap-2 px-4 py-2 bg-[#FC8019] text-white text-[13px] font-medium rounded-lg hover:bg-[#E6722E] transition-all mx-auto"
          >
            <Plus size={16} />
            Add First Story
          </button>
        </div>
      )}

      {/* Modals */}
      <AddStoryModal
        open={showAddStory}
        onOpenChange={setShowAddStory}
        onAddStory={handleAddStorySubmit}
        sprintId={selectedSprintForStory}
        settings={settings}
        onSave={forceSave}
      />

      <AddSprintModal
        open={showAddSprint}
        onOpenChange={setShowAddSprint}
        onAddSprint={(sprintData) => {
          addSprint(sprintData)
          setShowAddSprint(false)
        }}
      />

      <SettingsModal
        open={showSettings}
        onOpenChange={setShowSettings}
        settings={settings}
        onUpdateSettings={setSettings}
        lastSaved={lastSaved}
        onExport={exportData}
        onImport={importData}
        storageInfo={getStorageInfo()}
        onSave={forceSave}
      />

      <ArchiveView
        open={showArchive}
        onOpenChange={setShowArchive}
        archivedSprints={archivedSprints}
        onRestoreSprint={restoreSprint}
      />

      <SearchAndFilter
        open={showSearch}
        onOpenChange={setShowSearch}
        stories={allStories}
        sprints={activeSprints}
        onUpdateStory={updateStory}
        onDeleteStory={deleteStory}
        onArchiveStories={archiveStories}
      />

      <DevelopmentPromptModal
        open={showDevelopmentPrompt}
        onOpenChange={setShowDevelopmentPrompt}
        sprint={sprints?.find((s) => s.id === selectedSprintForPrompt)}
        aiAvailable={aiAvailable}
      />
    </div>
  )
}
