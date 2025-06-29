"use client"

import { useState } from "react"
import { Settings, Plus, ChevronDown } from "lucide-react"

interface HeaderProps {
  activeView: "active" | "archive"
  onViewChange: (view: "active" | "archive") => void
  onAddSprint: () => void
  onOpenSettings: () => void
  archivedCount: number
}

export function Header({ activeView, onViewChange, onAddSprint, onOpenSettings, archivedCount }: HeaderProps) {
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false)

  return (
    <header className="bg-white border-b border-[#E0E0E0] px-5 py-4 sticky top-0 z-40 shadow-sm">
      <div className="flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#FC8019] rounded-lg flex items-center justify-center text-white font-bold text-base">
            SM
          </div>
          <span className="text-xl font-bold text-[#1C1C1C]">Scrum Master</span>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-2">
          {/* Toggle Switch */}
          <div className="flex items-center gap-3 bg-[#F5F5F5] rounded-lg p-1">
            <button
              onClick={() => onViewChange("active")}
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                activeView === "active"
                  ? "text-[#FC8019] bg-transparent"
                  : "text-[#3E3E3E] hover:bg-[rgba(252,128,25,0.1)] hover:text-[#FC8019]"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => onViewChange("archive")}
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                activeView === "archive"
                  ? "text-[#FC8019] bg-transparent"
                  : "text-[#3E3E3E] hover:bg-[rgba(252,128,25,0.1)] hover:text-[#FC8019]"
              }`}
            >
              Archive
            </button>
          </div>

          {/* Settings Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
              className="flex items-center gap-1.5 px-3 py-2 text-[#3E3E3E] text-[14px] font-medium rounded-md hover:bg-[rgba(252,128,25,0.1)] hover:text-[#FC8019] transition-all"
            >
              <Settings size={16} />
              Settings
              <ChevronDown size={12} className="ml-1" />
            </button>

            {showSettingsDropdown && (
              <div className="absolute top-full right-0 mt-1 bg-white border border-[#E0E0E0] rounded-lg shadow-lg z-50 min-w-[160px] overflow-hidden">
                <button
                  onClick={() => {
                    onAddSprint()
                    setShowSettingsDropdown(false)
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-[13px] text-[#3E3E3E] hover:bg-[rgba(252,128,25,0.1)] hover:text-[#FC8019] transition-all border-b border-[#F5F5F5]"
                >
                  <Plus size={16} />
                  Add Sprint
                </button>
                <button
                  onClick={() => {
                    onOpenSettings()
                    setShowSettingsDropdown(false)
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-[13px] text-[#3E3E3E] hover:bg-[rgba(252,128,25,0.1)] hover:text-[#FC8019] transition-all"
                >
                  <Settings size={16} />
                  Sprint Settings
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Click outside to close dropdown */}
      {showSettingsDropdown && <div className="fixed inset-0 z-40" onClick={() => setShowSettingsDropdown(false)} />}
    </header>
  )
}
