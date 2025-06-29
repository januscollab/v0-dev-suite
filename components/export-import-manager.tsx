"use client"

import type React from "react"

import { useState } from "react"
import { Download, Upload, FileText, Database, CheckCircle, AlertCircle } from "lucide-react"
import type { Sprint, Story, Settings } from "@/types"

interface ExportImportManagerProps {
  sprints: Sprint[]
  archivedSprints: Sprint[]
  settings: Settings
  onImport: (data: any) => Promise<void>
  onExport: () => void
}

interface ExportOptions {
  includeActive: boolean
  includeArchived: boolean
  includeSettings: boolean
  format: "json" | "csv"
  dateRange: "all" | "month" | "quarter" | "year"
}

export function ExportImportManager({
  sprints,
  archivedSprints,
  settings,
  onImport,
  onExport,
}: ExportImportManagerProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeActive: true,
    includeArchived: true,
    includeSettings: true,
    format: "json",
    dateRange: "all",
  })
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle")
  const [importError, setImportError] = useState<string>("")

  const generateExportData = () => {
    const dataToExport: any = {
      exportedAt: new Date().toISOString(),
      version: "2.0",
      metadata: {
        totalSprints: sprints.length,
        totalArchivedSprints: archivedSprints.length,
        totalStories: sprints.reduce((acc, sprint) => acc + sprint.stories.length, 0),
        exportOptions,
      },
    }

    // Filter by date range
    const filterByDate = (items: any[]) => {
      if (exportOptions.dateRange === "all") return items

      const now = new Date()
      const cutoffDate = new Date()

      switch (exportOptions.dateRange) {
        case "month":
          cutoffDate.setMonth(now.getMonth() - 1)
          break
        case "quarter":
          cutoffDate.setMonth(now.getMonth() - 3)
          break
        case "year":
          cutoffDate.setFullYear(now.getFullYear() - 1)
          break
      }

      return items.filter((item) => new Date(item.createdAt) >= cutoffDate)
    }

    if (exportOptions.includeActive) {
      dataToExport.sprints = filterByDate(sprints)
    }

    if (exportOptions.includeArchived) {
      dataToExport.archivedSprints = filterByDate(archivedSprints)
    }

    if (exportOptions.includeSettings) {
      dataToExport.settings = { ...settings, openaiApiKey: undefined } // Don't export API key
    }

    return dataToExport
  }

  const handleExportJSON = async () => {
    setIsExporting(true)
    try {
      const exportData = generateExportData()
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `scrum-master-export-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export failed:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      const allStories: Story[] = []

      if (exportOptions.includeActive) {
        sprints.forEach((sprint) => {
          sprint.stories.forEach((story) => {
            allStories.push({ ...story, sprintName: sprint.name, sprintType: sprint.type })
          })
        })
      }

      if (exportOptions.includeArchived) {
        archivedSprints.forEach((sprint) => {
          sprint.stories.forEach((story) => {
            allStories.push({ ...story, sprintName: sprint.name, sprintType: "archived" })
          })
        })
      }

      // Create CSV content
      const headers = [
        "Story Number",
        "Title",
        "Description",
        "Status",
        "Priority",
        "Tags",
        "Sprint Name",
        "Sprint Type",
        "Assignee",
        "Estimated Hours",
        "Created Date",
        "Updated Date",
        "Completed Date",
      ]

      const csvContent = [
        headers.join(","),
        ...allStories.map((story) =>
          [
            `"${story.number}"`,
            `"${story.title.replace(/"/g, '""')}"`,
            `"${story.description.replace(/"/g, '""')}"`,
            `"${story.status}"`,
            `"${story.priority}"`,
            `"${story.tags.join("; ")}"`,
            `"${(story as any).sprintName}"`,
            `"${(story as any).sprintType}"`,
            `"${story.assignee || ""}"`,
            `"${story.estimatedHours || ""}"`,
            `"${story.createdAt.toISOString()}"`,
            `"${story.updatedAt.toISOString()}"`,
            `"${story.completedAt?.toISOString() || ""}"`,
          ].join(","),
        ),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `scrum-master-stories-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("CSV export failed:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExport = () => {
    if (exportOptions.format === "json") {
      handleExportJSON()
    } else {
      handleExportCSV()
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportStatus("idle")
    setImportError("")

    try {
      const content = await file.text()
      const importData = JSON.parse(content)

      // Validate import data
      if (!importData.version || !importData.sprints) {
        throw new Error("Invalid file format. Please select a valid Scrum Master export file.")
      }

      await onImport(importData)
      setImportStatus("success")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to import data"
      setImportError(errorMessage)
      setImportStatus("error")
    } finally {
      setIsImporting(false)
      // Reset file input
      event.target.value = ""
    }
  }

  const getExportPreview = () => {
    const data = generateExportData()
    return {
      sprints: data.sprints?.length || 0,
      archivedSprints: data.archivedSprints?.length || 0,
      stories: (data.sprints || []).reduce((acc: number, sprint: any) => acc + sprint.stories.length, 0),
      archivedStories: (data.archivedSprints || []).reduce(
        (acc: number, sprint: any) => acc + sprint.stories.length,
        0,
      ),
    }
  }

  const preview = getExportPreview()

  return (
    <div className="space-y-6">
      {/* Export Section */}
      <div className="bg-white rounded-lg border border-[#E0E0E0] p-6">
        <div className="flex items-center gap-3 mb-4">
          <Download className="text-[#FC8019]" size={20} />
          <h3 className="text-lg font-semibold text-[#1C1C1C]">Export Data</h3>
        </div>

        {/* Export Options */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-[13px] font-medium text-[#1C1C1C] mb-2">Include in Export</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exportOptions.includeActive}
                  onChange={(e) => setExportOptions((prev) => ({ ...prev, includeActive: e.target.checked }))}
                  className="rounded border-[#E0E0E0] text-[#FC8019] focus:ring-[#FC8019]"
                />
                <span className="text-[13px] text-[#3E3E3E]">Active sprints and stories</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exportOptions.includeArchived}
                  onChange={(e) => setExportOptions((prev) => ({ ...prev, includeArchived: e.target.checked }))}
                  className="rounded border-[#E0E0E0] text-[#FC8019] focus:ring-[#FC8019]"
                />
                <span className="text-[13px] text-[#3E3E3E]">Archived sprints and stories</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exportOptions.includeSettings}
                  onChange={(e) => setExportOptions((prev) => ({ ...prev, includeSettings: e.target.checked }))}
                  className="rounded border-[#E0E0E0] text-[#FC8019] focus:ring-[#FC8019]"
                />
                <span className="text-[13px] text-[#3E3E3E]">Settings and preferences</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#1C1C1C] mb-2">Export Format</label>
              <select
                value={exportOptions.format}
                onChange={(e) => setExportOptions((prev) => ({ ...prev, format: e.target.value as "json" | "csv" }))}
                className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg text-[13px] bg-white focus:outline-none focus:border-[#FC8019] focus:ring-2 focus:ring-[#FC8019] focus:ring-opacity-20"
              >
                <option value="json">JSON (Complete backup)</option>
                <option value="csv">CSV (Stories only)</option>
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#1C1C1C] mb-2">Date Range</label>
              <select
                value={exportOptions.dateRange}
                onChange={(e) =>
                  setExportOptions((prev) => ({ ...prev, dateRange: e.target.value as ExportOptions["dateRange"] }))
                }
                className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg text-[13px] bg-white focus:outline-none focus:border-[#FC8019] focus:ring-2 focus:ring-[#FC8019] focus:ring-opacity-20"
              >
                <option value="all">All Time</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last Year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Export Preview */}
        <div className="bg-[#F8F8F8] rounded-lg p-4 mb-4">
          <h4 className="text-[13px] font-medium text-[#1C1C1C] mb-2">Export Preview</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[12px]">
            <div>
              <div className="text-[#6B6B6B]">Active Sprints</div>
              <div className="font-medium text-[#1C1C1C]">{preview.sprints}</div>
            </div>
            <div>
              <div className="text-[#6B6B6B]">Active Stories</div>
              <div className="font-medium text-[#1C1C1C]">{preview.stories}</div>
            </div>
            <div>
              <div className="text-[#6B6B6B]">Archived Sprints</div>
              <div className="font-medium text-[#1C1C1C]">{preview.archivedSprints}</div>
            </div>
            <div>
              <div className="text-[#6B6B6B]">Archived Stories</div>
              <div className="font-medium text-[#1C1C1C]">{preview.archivedStories}</div>
            </div>
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-[#FC8019] text-white rounded-lg hover:bg-[#E6722E] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Exporting...
            </>
          ) : (
            <>
              <Download size={16} />
              Export {exportOptions.format.toUpperCase()}
            </>
          )}
        </button>
      </div>

      {/* Import Section */}
      <div className="bg-white rounded-lg border border-[#E0E0E0] p-6">
        <div className="flex items-center gap-3 mb-4">
          <Upload className="text-[#FC8019]" size={20} />
          <h3 className="text-lg font-semibold text-[#1C1C1C]">Import Data</h3>
        </div>

        <div className="space-y-4">
          <div className="bg-[#FFF3E0] border border-[#FFE0B2] rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="text-[#FC8019] mt-0.5" size={16} />
              <div className="text-[13px] text-[#1C1C1C]">
                <div className="font-medium mb-1">Import Warning</div>
                <div className="text-[#6B6B6B]">
                  Importing data will replace your current data. Make sure to export a backup first if you want to keep
                  your current work.
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#1C1C1C] mb-2">Select Import File</label>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={isImporting}
              className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg text-[13px] cursor-pointer focus:outline-none focus:border-[#FC8019] focus:ring-2 focus:ring-[#FC8019] focus:ring-opacity-20 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="text-[11px] text-[#6B6B6B] mt-1">
              Only JSON files exported from Scrum Master are supported
            </div>
          </div>

          {/* Import Status */}
          {importStatus === "success" && (
            <div className="flex items-center gap-2 text-[#60B246] bg-[#E8F5E8] px-3 py-2 rounded-lg">
              <CheckCircle size={16} />
              <span className="text-[13px] font-medium">Data imported successfully!</span>
            </div>
          )}

          {importStatus === "error" && (
            <div className="flex items-start gap-2 text-[#F44336] bg-[#FFEBEE] px-3 py-2 rounded-lg">
              <AlertCircle size={16} className="mt-0.5" />
              <div className="text-[13px]">
                <div className="font-medium">Import Failed</div>
                <div className="text-[12px] mt-1">{importError}</div>
              </div>
            </div>
          )}

          {isImporting && (
            <div className="flex items-center gap-2 text-[#FC8019] bg-[rgba(252,128,25,0.1)] px-3 py-2 rounded-lg">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#FC8019]"></div>
              <span className="text-[13px] font-medium">Importing data...</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-[#E0E0E0] p-6">
        <div className="flex items-center gap-3 mb-4">
          <Database className="text-[#FC8019]" size={20} />
          <h3 className="text-lg font-semibold text-[#1C1C1C]">Quick Actions</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => {
              setExportOptions({
                includeActive: true,
                includeArchived: false,
                includeSettings: false,
                format: "json",
                dateRange: "all",
              })
              handleExportJSON()
            }}
            className="flex items-center gap-2 p-3 border border-[#E0E0E0] rounded-lg hover:border-[#FC8019] hover:bg-[rgba(252,128,25,0.05)] transition-all"
          >
            <FileText size={16} className="text-[#FC8019]" />
            <div className="text-left">
              <div className="text-[13px] font-medium text-[#1C1C1C]">Export Active Only</div>
              <div className="text-[11px] text-[#6B6B6B]">Current sprints and stories</div>
            </div>
          </button>

          <button
            onClick={() => {
              setExportOptions({
                includeActive: true,
                includeArchived: true,
                includeSettings: true,
                format: "json",
                dateRange: "all",
              })
              handleExportJSON()
            }}
            className="flex items-center gap-2 p-3 border border-[#E0E0E0] rounded-lg hover:border-[#FC8019] hover:bg-[rgba(252,128,25,0.05)] transition-all"
          >
            <Database size={16} className="text-[#FC8019]" />
            <div className="text-left">
              <div className="text-[13px] font-medium text-[#1C1C1C]">Full Backup</div>
              <div className="text-[11px] text-[#6B6B6B]">Everything including archive</div>
            </div>
          </button>

          <button
            onClick={() => {
              setExportOptions({
                includeActive: true,
                includeArchived: true,
                includeSettings: false,
                format: "csv",
                dateRange: "all",
              })
              handleExportCSV()
            }}
            className="flex items-center gap-2 p-3 border border-[#E0E0E0] rounded-lg hover:border-[#FC8019] hover:bg-[rgba(252,128,25,0.05)] transition-all"
          >
            <FileText size={16} className="text-[#FC8019]" />
            <div className="text-left">
              <div className="text-[13px] font-medium text-[#1C1C1C]">Stories CSV</div>
              <div className="text-[11px] text-[#6B6B6B]">For external analysis</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
