"use client"

import { useState } from "react"
import { Search, RotateCcw, Calendar } from "lucide-react"
import type { Sprint, Story } from "@/types"

interface ArchiveViewProps {
  archivedSprints: Sprint[]
  onRestoreSprint: (sprintId: string) => void
  onEditStory: (story: Story) => void
  onRestoreStory: (storyId: string) => void
}

export function ArchiveView({ archivedSprints, onRestoreSprint, onEditStory, onRestoreStory }: ArchiveViewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState<"all" | "stories" | "sprints">("all")
  const [dateFilter, setDateFilter] = useState<"all" | "week" | "month" | "quarter">("all")

  // Get all archived stories from all archived sprints
  const allArchivedStories = archivedSprints.flatMap((sprint) =>
    sprint.stories.map((story) => ({ ...story, sprintName: sprint.name })),
  )

  // Filter function
  const filterItems = () => {
    let filteredSprints = archivedSprints
    let filteredStories = allArchivedStories

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filteredSprints = filteredSprints.filter(
        (sprint) =>
          sprint.name.toLowerCase().includes(query) ||
          sprint.description?.toLowerCase().includes(query) ||
          sprint.stories.some(
            (story) =>
              story.title.toLowerCase().includes(query) ||
              story.description.toLowerCase().includes(query) ||
              story.tags.some((tag) => tag.toLowerCase().includes(query)),
          ),
      )

      filteredStories = filteredStories.filter(
        (story) =>
          story.title.toLowerCase().includes(query) ||
          story.description.toLowerCase().includes(query) ||
          story.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          story.number.toLowerCase().includes(query),
      )
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date()
      const filterDate = new Date()

      switch (dateFilter) {
        case "week":
          filterDate.setDate(now.getDate() - 7)
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          break
        case "quarter":
          filterDate.setMonth(now.getMonth() - 3)
          break
      }

      filteredSprints = filteredSprints.filter((sprint) => sprint.createdAt >= filterDate)

      filteredStories = filteredStories.filter((story) => story.completedAt && story.completedAt >= filterDate)
    }

    return { filteredSprints, filteredStories }
  }

  const { filteredSprints, filteredStories } = filterItems()

  if (archivedSprints.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-[#6B6B6B] text-lg mb-2">No archived items</div>
        <p className="text-[#8E8E8E]">Archived sprints and completed stories will appear here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-[#E0E0E0] p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8E8E8E] h-4 w-4" />
            <input
              type="text"
              placeholder="Search archived items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#E0E0E0] rounded-lg text-[13px] focus:outline-none focus:border-[#FC8019] focus:ring-2 focus:ring-[#FC8019] focus:ring-opacity-20"
            />
          </div>

          {/* Type Filter */}
          <div className="flex gap-2">
            {[
              { key: "all", label: "All Items" },
              { key: "stories", label: "Stories Only" },
              { key: "sprints", label: "Sprints Only" },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setSelectedFilter(filter.key as any)}
                className={`px-3 py-2 text-[13px] font-medium rounded-lg transition-all ${
                  selectedFilter === filter.key
                    ? "bg-[#FC8019] text-white"
                    : "bg-[#F5F5F5] text-[#3E3E3E] hover:bg-[rgba(252,128,25,0.1)] hover:text-[#FC8019]"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="px-3 py-2 border border-[#E0E0E0] rounded-lg text-[13px] bg-white focus:outline-none focus:border-[#FC8019] focus:ring-2 focus:ring-[#FC8019] focus:ring-opacity-20"
          >
            <option value="all">All Time</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
          </select>
        </div>

        {/* Results Summary */}
        <div className="mt-3 text-[12px] text-[#6B6B6B]">
          Showing {filteredSprints.length} archived sprints and {filteredStories.length} completed stories
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Archived Sprints */}
        {(selectedFilter === "all" || selectedFilter === "sprints") &&
          filteredSprints.map((sprint) => (
            <div key={sprint.id} className="bg-white rounded-lg border border-[#E0E0E0] p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">📋</span>
                  <h3 className="font-medium text-[#1C1C1C]">{sprint.name}</h3>
                  <span className="bg-[#F5F5F5] text-[#6B6B6B] px-2 py-0.5 rounded-full text-[11px] font-medium">
                    Archived
                  </span>
                </div>
                <button
                  onClick={() => onRestoreSprint(sprint.id)}
                  className="flex items-center gap-1 text-[#FC8019] hover:bg-[rgba(252,128,25,0.1)] px-2 py-1 rounded text-[13px] font-medium transition-all"
                >
                  <RotateCcw size={14} />
                  Restore
                </button>
              </div>

              {sprint.description && <p className="text-[13px] text-[#6B6B6B] mb-3">{sprint.description}</p>}

              <div className="flex items-center gap-4 text-[12px] text-[#8E8E8E]">
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  <span>Archived {sprint.createdAt.toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>{sprint.stories?.length || 0} stories</span>
                </div>
              </div>

              {/* Sprint Stories Preview */}
              {sprint.stories && sprint.stories.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#F5F5F5]">
                  <div className="space-y-1">
                    {sprint.stories.slice(0, 3).map((story) => (
                      <div key={story.id} className="flex items-center gap-2 text-[12px]">
                        <span className="text-[#60B246]">✓</span>
                        <span className="text-[#6B6B6B]">{story.number}</span>
                        <span className="text-[#3E3E3E] flex-1 truncate">{story.title}</span>
                      </div>
                    ))}
                    {sprint.stories.length > 3 && (
                      <div className="text-[11px] text-[#8E8E8E] pl-6">+{sprint.stories.length - 3} more stories</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

        {/* Individual Archived Stories */}
        {(selectedFilter === "all" || selectedFilter === "stories") &&
          filteredStories.map((story) => (
            <div key={story.id} className="bg-white rounded-lg border border-[#E0E0E0] p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[#60B246]">✓</span>
                  <span className="text-[13px] font-medium text-[#1C1C1C]">{story.number}</span>
                  <span className="bg-[#E8F5E8] text-[#60B246] px-2 py-0.5 rounded-full text-[11px] font-medium">
                    Completed
                  </span>
                </div>
                <button
                  onClick={() => onRestoreStory(story.id)}
                  className="flex items-center gap-1 text-[#FC8019] hover:bg-[rgba(252,128,25,0.1)] px-2 py-1 rounded text-[13px] font-medium transition-all"
                >
                  <RotateCcw size={14} />
                  Restore
                </button>
              </div>

              <h4 className="text-[14px] font-medium text-[#1C1C1C] mb-2">{story.title}</h4>

              {story.description && <p className="text-[13px] text-[#6B6B6B] mb-3 line-clamp-2">{story.description}</p>}

              {/* Tags */}
              {story.tags && story.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {story.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="bg-[#FFF3E0] text-[#FC8019] px-2 py-0.5 rounded-full text-[11px] font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                  {story.tags.length > 3 && (
                    <span className="text-[11px] text-[#8E8E8E]">+{story.tags.length - 3} more</span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-4 text-[12px] text-[#8E8E8E]">
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  <span>Completed {story.completedAt?.toLocaleDateString() || "Unknown"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>From: {(story as any).sprintName}</span>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* No Results */}
      {filteredSprints.length === 0 && filteredStories.length === 0 && (
        <div className="text-center py-8">
          <div className="text-[#6B6B6B] text-lg mb-2">No items found</div>
          <p className="text-[#8E8E8E]">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  )
}
