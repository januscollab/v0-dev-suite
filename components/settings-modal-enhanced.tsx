"use client"

import { useState } from "react"
import { X, Settings, Key, Database, Palette, Save, Download, Eye, EyeOff, HelpCircle } from "lucide-react"
import { SupabaseSetupGuide } from "./supabase-setup-guide"
import type { Settings as SettingsType } from "@/types"

interface SettingsModalEnhancedProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: SettingsType
  onUpdateSettings: (updates: Partial<SettingsType>) => void
  lastSaved?: Date | null
  onManualSave?: () => Promise<void>
  onExport?: () => void
  onImport?: (file: File) => void
  storageInfo?: { size: number; lastBackup: Date | null }
  connectionStatus?: { isOnline: boolean; queueLength: number; supabaseAvailable: boolean }
}

export function SettingsModalEnhanced({
  open,
  onOpenChange,
  settings,
  onUpdateSettings,
  lastSaved,
  onManualSave,
  onExport,
  onImport,
  storageInfo,
  connectionStatus,
}: SettingsModalEnhancedProps) {
  const [activeTab, setActiveTab] = useState("general")
  const [formData, setFormData] = useState(settings)
  const [showApiKey, setShowApiKey] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showSupabaseGuide, setShowSupabaseGuide] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      onUpdateSettings(formData)
      if (onManualSave) {
        await onManualSave()
      }
    } finally {
      setIsSaving(false)
    }
    onOpenChange(false)
  }

  const handleClose = () => {
    setFormData(settings) // Reset to original settings
    onOpenChange(false)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "Never"
    return date.toLocaleString()
  }

  const getStorageStatus = () => {
    if (!connectionStatus) return { status: "Unknown", color: "#8E8E8E" }

    if (connectionStatus.supabaseAvailable) {
      if (connectionStatus.isOnline) {
        return { status: "Cloud Backup", color: "#60B246" }
      } else {
        return { status: "Offline (Queued)", color: "#FC8019" }
      }
    } else {
      return { status: "Local Only", color: "#F44336" }
    }
  }

  const storageStatus = getStorageStatus()

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-[rgba(28,28,28,0.5)] flex items-center justify-center z-50 p-5">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-[680px] max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#E0E0E0] relative">
            <h1 className="text-2xl font-bold text-[#1C1C1C] flex items-center gap-2">
              <Settings size={24} />
              Settings
            </h1>
            <button
              onClick={handleClose}
              className="absolute top-3 right-5 w-8 h-8 rounded-md flex items-center justify-center text-[#8E8E8E] hover:bg-[#F8F8F8] hover:text-[#3E3E3E] transition-all"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-[#E0E0E0]">
            <div className="flex">
              {[
                { id: "general", label: "General", icon: Settings },
                { id: "ai", label: "AI Integration", icon: Key },
                { id: "data", label: "Data Management", icon: Database },
                { id: "appearance", label: "Appearance", icon: Palette },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-[13px] font-medium border-b-2 transition-all ${
                    activeTab === tab.id
                      ? "text-[#FC8019] border-[#FC8019]"
                      : "text-[#6B6B6B] border-transparent hover:text-[#FC8019] hover:border-[#FC8019]"
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {activeTab === "general" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[#1C1C1C] mb-1">Story Number Prefix</label>
                  <input
                    type="text"
                    value={formData.storyPrefix}
                    onChange={(e) => setFormData((prev) => ({ ...prev, storyPrefix: e.target.value.toUpperCase() }))}
                    placeholder="TUNE"
                    className="w-full px-3 py-2.5 border-2 border-[#E0E0E0] rounded-lg text-[13px] text-[#1C1C1C] transition-all focus:outline-none focus:border-[#FC8019] focus:shadow-[0_0_0_3px_rgba(252,128,25,0.1)]"
                  />
                  <div className="text-[11px] text-[#6B6B6B] mt-1">
                    Stories will be numbered as {formData.storyPrefix}-001, {formData.storyPrefix}-002, etc.
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#1C1C1C] mb-1">Auto-save Interval</label>
                  <select
                    value={formData.autoSaveInterval}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, autoSaveInterval: Number.parseInt(e.target.value) }))
                    }
                    className="w-full px-3 py-2.5 border-2 border-[#E0E0E0] rounded-lg text-[13px] text-[#1C1C1C] bg-white transition-all focus:outline-none focus:border-[#FC8019] focus:shadow-[0_0_0_3px_rgba(252,128,25,0.1)]"
                  >
                    <option value={5000}>5 seconds</option>
                    <option value={10000}>10 seconds</option>
                    <option value={30000}>30 seconds</option>
                    <option value={60000}>1 minute</option>
                    <option value={300000}>5 minutes</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === "ai" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[#1C1C1C] mb-1">OpenAI API Key</label>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={formData.openaiApiKey || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, openaiApiKey: e.target.value }))}
                      placeholder="sk-..."
                      className="w-full px-3 py-2.5 pr-10 border-2 border-[#E0E0E0] rounded-lg text-[13px] text-[#1C1C1C] transition-all focus:outline-none focus:border-[#FC8019] focus:shadow-[0_0_0_3px_rgba(252,128,25,0.1)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#8E8E8E] hover:text-[#3E3E3E]"
                    >
                      {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div className="text-[11px] text-[#6B6B6B] mt-1">
                    Get your API key from{" "}
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#FC8019] hover:underline"
                    >
                      OpenAI Platform
                    </a>
                  </div>
                </div>

                <div className="bg-[#FFF3E0] border border-[#FFE0B2] rounded-lg p-4">
                  <h4 className="font-medium text-[#1C1C1C] mb-2">AI Features</h4>
                  <div className="space-y-2 text-[12px]">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#FC8019] text-white px-2 py-0.5 rounded-full text-[10px] font-medium">
                        AI-Assisted
                      </span>
                      <span className="text-[#3E3E3E]">Enhance existing story titles and descriptions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-[#FC8019] text-white px-2 py-0.5 rounded-full text-[10px] font-medium">
                        AI-Generated
                      </span>
                      <span className="text-[#3E3E3E]">Generate complete stories from prompts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-[#FC8019] text-white px-2 py-0.5 rounded-full text-[10px] font-medium">
                        Auto-tagging
                      </span>
                      <span className="text-[#3E3E3E]">Automatically tag stories based on content</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "data" && (
              <div className="space-y-4">
                {/* Storage Status */}
                <div className="bg-[#F5F5F5] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-[#1C1C1C]">Storage Status</h4>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: storageStatus.color }}></div>
                      <span className="text-[13px] font-medium" style={{ color: storageStatus.color }}>
                        {storageStatus.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-[12px]">
                    <div>
                      <div className="text-[#6B6B6B]">Last Saved</div>
                      <div className="font-medium text-[#1C1C1C]">{formatDate(lastSaved)}</div>
                    </div>
                    <div>
                      <div className="text-[#6B6B6B]">Data Size</div>
                      <div className="font-medium text-[#1C1C1C]">{formatFileSize(storageInfo?.size || 0)}</div>
                    </div>
                  </div>

                  {connectionStatus && !connectionStatus.supabaseAvailable && (
                    <div className="mt-3 pt-3 border-t border-[#E0E0E0]">
                      <div className="flex items-center gap-2 text-[13px] text-[#F44336] mb-2">
                        <Database size={16} />
                        <span>Cloud backup not configured</span>
                      </div>
                      <button
                        onClick={() => setShowSupabaseGuide(true)}
                        className="flex items-center gap-1 text-[#FC8019] hover:bg-[rgba(252,128,25,0.1)] px-2 py-1 rounded text-[12px] font-medium transition-all"
                      >
                        <HelpCircle size={14} />
                        Setup Supabase Backup
                      </button>
                    </div>
                  )}

                  {connectionStatus && connectionStatus.queueLength > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#E0E0E0]">
                      <div className="flex items-center gap-2 text-[13px] text-[#FC8019] mb-1">
                        <span>⏳</span>
                        <span>{connectionStatus.queueLength} changes queued for sync</span>
                      </div>
                      <div className="text-[11px] text-[#6B6B6B]">
                        Changes will sync automatically when connection is restored
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {onManualSave && (
                    <button
                      onClick={onManualSave}
                      disabled={isSaving}
                      className="flex items-center gap-1.5 px-3 py-2 bg-transparent border border-[#FC8019] text-[#FC8019] text-[13px] font-medium rounded-md hover:bg-[rgba(252,128,25,0.1)] transition-all disabled:opacity-50"
                    >
                      <Save size={16} />
                      {isSaving ? "Saving..." : "Save Now"}
                    </button>
                  )}
                  {onExport && (
                    <button
                      onClick={onExport}
                      className="flex items-center gap-1.5 px-3 py-2 bg-transparent border border-[#FC8019] text-[#FC8019] text-[13px] font-medium rounded-md hover:bg-[rgba(252,128,25,0.1)] transition-all"
                    >
                      <Download size={16} />
                      Export Backup
                    </button>
                  )}
                </div>

                {onImport && (
                  <div>
                    <label className="block text-[13px] font-semibold text-[#1C1C1C] mb-1">Import Data</label>
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) onImport(file)
                      }}
                      className="w-full px-3 py-2.5 border-2 border-[#E0E0E0] rounded-lg text-[13px] text-[#1C1C1C] cursor-pointer transition-all focus:outline-none focus:border-[#FC8019] focus:shadow-[0_0_0_3px_rgba(252,128,25,0.1)]"
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[#1C1C1C] mb-1">Theme</label>
                  <select
                    value={formData.theme}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, theme: e.target.value as "light" | "dark" | "system" }))
                    }
                    className="w-full px-3 py-2.5 border-2 border-[#E0E0E0] rounded-lg text-[13px] text-[#1C1C1C] bg-white transition-all focus:outline-none focus:border-[#FC8019] focus:shadow-[0_0_0_3px_rgba(252,128,25,0.1)]"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                  <div className="text-[11px] text-[#6B6B6B] mt-1">
                    System theme will match your device's preference
                  </div>
                </div>

                <div className="bg-[#F5F5F5] rounded-lg p-4">
                  <h4 className="font-medium text-[#1C1C1C] mb-2">Design System</h4>
                  <div className="text-[12px] text-[#6B6B6B] mb-3">
                    Future updates will include design token import and custom styling options
                  </div>
                  <div className="space-y-2 text-[12px]">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#E0E0E0] text-[#6B6B6B] px-2 py-0.5 rounded-full text-[10px] font-medium">
                        Coming Soon
                      </span>
                      <span className="text-[#3E3E3E]">Upload design token files (JSON, CSS, SCSS)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-[#E0E0E0] text-[#6B6B6B] px-2 py-0.5 rounded-full text-[10px] font-medium">
                        Coming Soon
                      </span>
                      <span className="text-[#3E3E3E]">Custom CSS import with live preview</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-[#E0E0E0] flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex items-center gap-1.5 px-3 py-2 bg-transparent text-[#3E3E3E] text-[13px] font-medium rounded-md hover:bg-[rgba(252,128,25,0.1)] hover:text-[#FC8019] transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-2 bg-transparent text-[#3E3E3E] text-[13px] font-medium rounded-md hover:bg-[rgba(252,128,25,0.1)] hover:text-[#FC8019] transition-all disabled:opacity-50"
            >
              <Save size={16} />
              {isSaving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </div>

      {/* Supabase Setup Guide Modal */}
      <SupabaseSetupGuide open={showSupabaseGuide} onOpenChange={setShowSupabaseGuide} />
    </>
  )
}
