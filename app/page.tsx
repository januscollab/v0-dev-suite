"use client"

import { useScrumData } from "@/hooks/use-scrum-data"
import { ScrumBoard } from "@/components/scrum-board-final"
import { SyncStatusIndicator } from "@/components/sync-status-indicator"
import { ErrorBoundary } from "@/components/error-boundary"

export default function HomePage() {
  const scrumData = useScrumData()

  if (scrumData.isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#FC8019] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-[14px] font-medium text-[#1C1C1C]">Loading Scrum Board...</div>
          <div className="text-[12px] text-[#6B6B6B] mt-1">Initializing auto-save system</div>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#F5F5F5]">
        {/* Header */}
        <header className="bg-white border-b border-[#E0E0E0] px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#1C1C1C] flex items-center gap-2">🎯 Scrum Master Board</h1>
              <p className="text-[13px] text-[#6B6B6B] mt-1">Intelligent story management with AI integration</p>
            </div>

            <div className="flex items-center gap-3">
              <SyncStatusIndicator
                lastSaved={scrumData.lastSaved}
                autoSaveInterval={scrumData.settings.autoSaveInterval}
              />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          <ScrumBoard {...scrumData} />
        </main>
      </div>
    </ErrorBoundary>
  )
}
