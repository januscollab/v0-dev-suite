"use client"

import { useState, useEffect } from "react"
import { X, Settings, Palette, Database, Download, TestTube, CheckCircle, AlertCircle } from "lucide-react"
import type { Settings as SettingsType } from "@/types"
import { useAIIntegration } from "@/hooks/use-ai-integration"

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: SettingsType
  onUpdateSettings: (updates: Partial<SettingsType>) => void
  lastSaved?: Date | null
  onExport?: () => void
  onImport?: (file: File) => void
  storageInfo?: { size: number; lastBackup: Date | null }
  onSave?: () => void // Add save callback
}

export function SettingsModal({
  open,
  onOpenChange,
  settings,
  onUpdateSettings,
  lastSaved,
  onExport,
  onImport,
  storageInfo,
  onSave,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState("general")
  const [formData, setFormData] = useState(settings)
  const [apiTestResult, setApiTestResult] = useState<"idle" | "testing" | "success" | "error">("idle")

  const { isAvailable, testConnection } = useAIIntegration()

  useEffect(() => {
    setFormData(settings)
  }, [settings])

  const handleSave = () => {
    onUpdateSettings(formData)
    // Trigger immediate save when settings change
    if (onSave) {
      setTimeout(() => onSave(), 100)
    }
    onOpenChange(false)
  }

  const handleClose = () => {
    setFormData(settings) // Reset to original settings
    onOpenChange(false)
  }

  const handleTestAPI = async () => {
    setApiTestResult("testing")
    try {
      const success = await testConnection()
      setApiTestResult(success ? "success" : "error")
    } catch {
      setApiTestResult("error")
    }
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

  if (!open) return null

  return (
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
                  <option value={10000}>10 seconds</option>
                  <option value={30000}>30 seconds</option>
                  <option value={60000}>1 minute</option>
                  <option value={300000}>5 minutes</option>
                </select>
                <div className="text-[11px] text-[#6B6B6B] mt-1">
                  Fallback auto-save interval. Data is also saved immediately on every change.
                </div>
              </div>

              <div className="bg-[#FFF3E0] border border-[#FFE0B2] rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-[#1C1C1C]">AI Features</h4>
                  <div className="flex items-center gap-2">
                    {isAvailable ? (
                      <span className="text-[#60B246] text-[12px] font-medium">✅ API Key Configured</span>
                    ) : (
                      <span className="text-[#F44336] text-[12px] font-medium">❌ API Key Missing</span>
                    )}
                  </div>
                </div>

                {isAvailable && (
                  <div className="mb-3">
                    <button
                      onClick={handleTestAPI}
                      disabled={apiTestResult === "testing"}
                      className="flex items-center gap-2 px-3 py-1.5 bg-[#FC8019] text-white text-[12px] font-medium rounded-md hover:bg-[#E6722E] transition-all disabled:opacity-50"
                    >
                      <TestTube size={14} />
                      {apiTestResult === "testing" ? "Testing..." : "Test API Connection"}
                    </button>

                    {apiTestResult === "success" && (
                      <div className="flex items-center gap-2 mt-2 text-[#60B246] text-[12px]">
                        <CheckCircle size={14} />
                        <span>API connection successful!</span>
                      </div>
                    )}

                    {apiTestResult === "error" && (
                      <div className="flex items-center gap-2 mt-2 text-[#F44336] text-[12px]">
                        <AlertCircle size={14} />
                        <span>API connection failed. Check your key.</span>
                      </div>
                    )}
                  </div>
                )}

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
                  <div className="flex items-center gap-2">
                    <span className="bg-[#FC8019] text-white px-2 py-0.5 rounded-full text-[10px] font-medium">
                      Bolt.new
                    </span>
                    <span className="text-[#3E3E3E]">Generate optimized development prompts</span>
                  </div>
                </div>

                {!isAvailable && (
                  <div className="mt-3 pt-3 border-t border-[#E0E0E0]">
                    <div className="text-[11px] text-[#6B6B6B]">
                      Add <code className="bg-[#F5F5F5] px-1 rounded">NEXT_PUBLIC_OPENAI_API_KEY</code> to your
                      environment variables to enable AI features.
                    </div>
                  </div>
                )}
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
                    <div className="w-2 h-2 rounded-full bg-[#60B246]"></div>
                    <span className="text-[13px] font-medium text-[#60B246]">Auto-Save Active</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-[12px]">
                  <div>
                    <div className="text-[#6B6B6B]">Last Saved</div>
                    <div className="font-medium text-[#1C1C1C]">{formatDate(lastSaved)}</div>
                  </div>
                  <div>
                    <div className="text-[#6B6B6B]">Data Size</div>
                    <div className="font-medium text-[#1C1C1C]">
                      {storageInfo ? formatFileSize(storageInfo.size) : "0 KB"}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-[#E0E0E0]">
                  <div className="text-[11px] text-[#6B6B6B]">
                    ✅ Data is automatically saved on every change
                    <br />✅ Fallback save every {Math.round(formData.autoSaveInterval / 1000)} seconds
                    <br />✅ Automatic backups with recovery system
                  </div>
                </div>
              </div>

              {/* Export/Import */}
              <div className="space-y-3">
                <h4 className="font-medium text-[#1C1C1C]">Backup & Restore</h4>

                <div className="flex gap-3">
                  <button
                    onClick={onExport}
                    className="flex items-center gap-2 px-3 py-2 bg-[#FC8019] text-white text-[13px] font-medium rounded-md hover:bg-[#E6722E] transition-all"
                  >
                    <Download size={16} />
                    Export Data
                  </button>

                  <label className="flex items-center gap-2 px-3 py-2 bg-transparent border border-[#FC8019] text-[#FC8019] text-[13px] font-medium rounded-md hover:bg-[rgba(252,128,25,0.1)] transition-all cursor-pointer">
                    <Database size={16} />
                    Import Data
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file && onImport) {
                          onImport(file)
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="text-[11px] text-[#6B6B6B]">
                  Export creates a complete backup of all your sprints, stories, and settings. Import will replace all
                  current data.
                </div>
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#1C1C1C] mb-2">Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "light", label: "Light", preview: "bg-white border-2" },
                    { value: "dark", label: "Dark", preview: "bg-gray-900 border-2" },
                    { value: "system", label: "System", preview: "bg-gradient-to-r from-white to-gray-900 border-2" },
                  ].map((theme) => (
                    <button
                      key={theme.value}
                      onClick={() => setFormData((prev) => ({ ...prev, theme: theme.value as any }))}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.theme === theme.value
                          ? "border-[#FC8019] bg-[rgba(252,128,25,0.1)]"
                          : "border-[#E0E0E0] hover:border-[#FC8019]"
                      }`}
                    >
                      <div className={`w-full h-8 rounded-md mb-2 ${theme.preview}`}></div>
                      <div className="text-[12px] font-medium text-[#1C1C1C]">{theme.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#FFF3E0] border border-[#FFE0B2] rounded-lg p-4">
                <h4 className="font-medium text-[#1C1C1C] mb-2">Design System</h4>
                <div className="text-[12px] text-[#6B6B6B] space-y-1">
                  <div>✅ Swiggy Design System integrated</div>
                  <div>✅ 60+ carefully crafted colors</div>
                  <div>✅ Consistent spacing and typography</div>
                  <div>✅ Accessible design patterns</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E0E0E0] flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-[#3E3E3E] text-[13px] font-medium rounded-md hover:bg-[rgba(252,128,25,0.1)] hover:text-[#FC8019] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[#FC8019] text-white text-[13px] font-medium rounded-md hover:bg-[#E6722E] transition-all"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}
