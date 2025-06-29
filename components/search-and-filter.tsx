"use client"

import { useState, useEffect } from "react"
import { Search, Filter, X, Tag, User, AlertCircle } from "lucide-react"
import type { Story, Sprint } from "@/types"

interface SearchAndFilterProps {
  sprints: Sprint[]
  onFilteredResults: (filteredSprints: Sprint[], filteredStories: Story[]) => void
  className?: string
}

interface FilterState {
  searchQuery: string
  selectedSprints: string[]
  selectedStatuses: string[]
  selectedPriorities: string[]
  selectedTags: string[]
  dateRange: "all" | "today" | "week" | "month" | "quarter"
  assignee: string
}

const initialFilterState: FilterState = {
  searchQuery: "",
  selectedSprints: [],
  selectedStatuses: [],
  selectedPriorities: [],
  selectedTags: [],
  dateRange: "all",
  assignee: "",
}

export function SearchAndFilter({ sprints, onFilteredResults, className = "" }: SearchAndFilterProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilterState)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])

  // Get all unique values for filter options
  const allStories = sprints.flatMap((sprint) => sprint.stories)
  const allTags = [...new Set(allStories.flatMap((story) => story.tags))].sort()
  const allAssignees = [...new Set(allStories.map((story) => story.assignee).filter(Boolean))].sort()

  // Apply filters
  useEffect(() => {
    const applyFilters = () => {
      let filteredSprints = [...sprints]
      let filteredStories = [...allStories]

      // Search query filter
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase()

        filteredStories = filteredStories.filter(
          (story) =>
            story.title.toLowerCase().includes(query) ||
            story.description.toLowerCase().includes(query) ||
            story.number.toLowerCase().includes(query) ||
            story.tags.some((tag) => tag.toLowerCase().includes(query)) ||
            story.assignee?.toLowerCase().includes(query),
        )

        filteredSprints = filteredSprints.filter(
          (sprint) =>
            sprint.name.toLowerCase().includes(query) ||
            sprint.description?.toLowerCase().includes(query) ||
            sprint.stories.some((story) => filteredStories.some((fs) => fs.id === story.id)),
        )
      }

      // Sprint filter
      if (filters.selectedSprints.length > 0) {
        filteredSprints = filteredSprints.filter((sprint) => filters.selectedSprints.includes(sprint.id))
        filteredStories = filteredStories.filter((story) => filters.selectedSprints.includes(story.sprintId))
      }

      // Status filter
      if (filters.selectedStatuses.length > 0) {
        filteredStories = filteredStories.filter((story) => filters.selectedStatuses.includes(story.status))
      }

      // Priority filter
      if (filters.selectedPriorities.length > 0) {
        filteredStories = filteredStories.filter((story) => filters.selectedPriorities.includes(story.priority))
      }

      // Tags filter
      if (filters.selectedTags.length > 0) {
        filteredStories = filteredStories.filter((story) =>
          filters.selectedTags.some((tag) => story.tags.includes(tag)),
        )
      }

      // Assignee filter
      if (filters.assignee.trim()) {
        const assigneeQuery = filters.assignee.toLowerCase()
        filteredStories = filteredStories.filter((story) => story.assignee?.toLowerCase().includes(assigneeQuery))
      }

      // Date range filter
      if (filters.dateRange !== "all") {
        const now = new Date()
        const filterDate = new Date()

        switch (filters.dateRange) {
          case "today":
            filterDate.setHours(0, 0, 0, 0)
            break
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

        filteredStories = filteredStories.filter((story) => story.updatedAt >= filterDate)
      }

      // Update sprints to only include filtered stories
      filteredSprints = filteredSprints.map((sprint) => ({
        ...sprint,
        stories: sprint.stories.filter((story) => filteredStories.some((fs) => fs.id === story.id)),
      }))

      onFilteredResults(filteredSprints, filteredStories)
    }

    applyFilters()
  }, [filters, sprints, allStories, onFilteredResults])

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: value }))

    // Add to search history
    if (value.trim() && !searchHistory.includes(value.trim())) {
      setSearchHistory((prev) => [value.trim(), ...prev.slice(0, 4)])
    }
  }

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const toggleArrayFilter = (key: keyof FilterState, value: string) => {
    setFilters((prev) => {
      const currentArray = prev[key] as string[]
      const newArray = currentArray.includes(value)
        ? currentArray.filter((item) => item !== value)
        : [...currentArray, value]
      return { ...prev, [key]: newArray }
    })
  }

  const clearAllFilters = () => {
    setFilters(initialFilterState)
  }

  const hasActiveFilters = () => {
    return (
      filters.searchQuery.trim() ||
      filters.selectedSprints.length > 0 ||
      filters.selectedStatuses.length > 0 ||
      filters.selectedPriorities.length > 0 ||
      filters.selectedTags.length > 0 ||
      filters.assignee.trim() ||
      filters.dateRange !== "all"
    )
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (filters.searchQuery.trim()) count++
    if (filters.selectedSprints.length > 0) count++
    if (filters.selectedStatuses.length > 0) count++
    if (filters.selectedPriorities.length > 0) count++
    if (filters.selectedTags.length > 0) count++
    if (filters.assignee.trim()) count++
    if (filters.dateRange !== "all") count++
    return count
  }

  return (
    <div className={`bg-white rounded-lg border border-[#E0E0E0] p-4 ${className}`}>
      {/* Main Search Bar */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8E8E8E] h-4 w-4" />
          <input
            type="text"
            placeholder="Search stories, sprints, tags..."
            value={filters.searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-[#E0E0E0] rounded-lg text-[13px] focus:outline-none focus:border-[#FC8019] focus:ring-2 focus:ring-[#FC8019] focus:ring-opacity-20"
          />
          {filters.searchQuery && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#8E8E8E] hover:text-[#FC8019]"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-[13px] font-medium transition-all ${
            showAdvancedFilters || hasActiveFilters()
              ? "border-[#FC8019] text-[#FC8019] bg-[rgba(252,128,25,0.1)]"
              : "border-[#E0E0E0] text-[#3E3E3E] hover:border-[#FC8019] hover:text-[#FC8019]"
          }`}
        >
          <Filter size={16} />
          Filters
          {getActiveFilterCount() > 0 && (
            <span className="bg-[#FC8019] text-white text-[11px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {getActiveFilterCount()}
            </span>
          )}
        </button>

        {hasActiveFilters() && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 px-3 py-2.5 text-[#F44336] hover:bg-[rgba(244,67,54,0.1)] rounded-lg text-[13px] font-medium transition-all"
          >
            <X size={16} />
            Clear
          </button>
        )}
      </div>

      {/* Search History */}
      {searchHistory.length > 0 && filters.searchQuery === "" && (
        <div className="mb-4">
          <div className="text-[12px] text-[#6B6B6B] mb-2">Recent searches:</div>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((query, index) => (
              <button
                key={index}
                onClick={() => handleSearchChange(query)}
                className="text-[12px] text-[#FC8019] bg-[rgba(252,128,25,0.1)] px-2 py-1 rounded-full hover:bg-[rgba(252,128,25,0.2)] transition-all"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="border-t border-[#F5F5F5] pt-4 space-y-4">
          {/* Sprint Filter */}
          <div>
            <label className="block text-[13px] font-medium text-[#1C1C1C] mb-2">Sprints</label>
            <div className="flex flex-wrap gap-2">
              {sprints.map((sprint) => (
                <button
                  key={sprint.id}
                  onClick={() => toggleArrayFilter("selectedSprints", sprint.id)}
                  className={`text-[12px] px-3 py-1.5 rounded-full border transition-all ${
                    filters.selectedSprints.includes(sprint.id)
                      ? "bg-[#FC8019] text-white border-[#FC8019]"
                      : "bg-white text-[#3E3E3E] border-[#E0E0E0] hover:border-[#FC8019] hover:text-[#FC8019]"
                  }`}
                >
                  {sprint.name}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[13px] font-medium text-[#1C1C1C] mb-2">Status</label>
            <div className="flex flex-wrap gap-2">
              {["open", "in-progress", "completed"].map((status) => (
                <button
                  key={status}
                  onClick={() => toggleArrayFilter("selectedStatuses", status)}
                  className={`text-[12px] px-3 py-1.5 rounded-full border transition-all ${
                    filters.selectedStatuses.includes(status)
                      ? "bg-[#FC8019] text-white border-[#FC8019]"
                      : "bg-white text-[#3E3E3E] border-[#E0E0E0] hover:border-[#FC8019] hover:text-[#FC8019]"
                  }`}
                >
                  {status === "in-progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-[13px] font-medium text-[#1C1C1C] mb-2">Priority</label>
            <div className="flex flex-wrap gap-2">
              {["low", "medium", "high"].map((priority) => (
                <button
                  key={priority}
                  onClick={() => toggleArrayFilter("selectedPriorities", priority)}
                  className={`text-[12px] px-3 py-1.5 rounded-full border transition-all ${
                    filters.selectedPriorities.includes(priority)
                      ? "bg-[#FC8019] text-white border-[#FC8019]"
                      : "bg-white text-[#3E3E3E] border-[#E0E0E0] hover:border-[#FC8019] hover:text-[#FC8019]"
                  }`}
                >
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div>
              <label className="block text-[13px] font-medium text-[#1C1C1C] mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleArrayFilter("selectedTags", tag)}
                    className={`text-[12px] px-3 py-1.5 rounded-full border transition-all ${
                      filters.selectedTags.includes(tag)
                        ? "bg-[#FC8019] text-white border-[#FC8019]"
                        : "bg-white text-[#3E3E3E] border-[#E0E0E0] hover:border-[#FC8019] hover:text-[#FC8019]"
                    }`}
                  >
                    <Tag size={10} className="inline mr-1" />
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date Range and Assignee */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#1C1C1C] mb-2">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange("dateRange", e.target.value)}
                className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg text-[13px] bg-white focus:outline-none focus:border-[#FC8019] focus:ring-2 focus:ring-[#FC8019] focus:ring-opacity-20"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#1C1C1C] mb-2">Assignee</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8E8E8E] h-4 w-4" />
                <input
                  type="text"
                  placeholder="Filter by assignee..."
                  value={filters.assignee}
                  onChange={(e) => handleFilterChange("assignee", e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-[#E0E0E0] rounded-lg text-[13px] focus:outline-none focus:border-[#FC8019] focus:ring-2 focus:ring-[#FC8019] focus:ring-opacity-20"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="mt-4 pt-3 border-t border-[#F5F5F5] text-[12px] text-[#6B6B6B]">
        {hasActiveFilters() ? (
          <div className="flex items-center gap-2">
            <AlertCircle size={14} />
            <span>
              Filters active - showing filtered results. {getActiveFilterCount()} filter
              {getActiveFilterCount() !== 1 ? "s" : ""} applied.
            </span>
          </div>
        ) : (
          <span>Showing all stories and sprints</span>
        )}
      </div>
    </div>
  )
}
