"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, Key, Palette, SettingsIcon } from "lucide-react"
import type { Settings } from "@/types"
import { toast } from "@/hooks/use-toast"

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: Settings
  onUpdateSettings: (updates: Partial<Settings>) => void
}

export function SettingsModal({ open, onOpenChange, settings, onUpdateSettings }: SettingsModalProps) {
  const [formData, setFormData] = useState(settings)
  const [showApiKey, setShowApiKey] = useState(false)
  const [isValidatingApiKey, setIsValidatingApiKey] = useState(false)

  const handleSave = () => {
    onUpdateSettings(formData)
    toast({
      title: "Settings saved!",
      description: "Your preferences have been updated.",
    })
    onOpenChange(false)
  }

  const validateApiKey = async () => {
    if (!formData.openaiApiKey?.trim()) {
      toast({
        title: "Error",
        description: "Please enter an API key",
        variant: "destructive",
      })
      return
    }

    setIsValidatingApiKey(true)

    try {
      // Simple validation - just check if it looks like an OpenAI key
      const apiKey = formData.openaiApiKey.trim()
      if (!apiKey.startsWith("sk-") || apiKey.length < 20) {
        throw new Error("Invalid API key format")
      }

      toast({
        title: "API Key validated!",
        description: "Your OpenAI API key appears to be valid.",
      })
    } catch (error) {
      toast({
        title: "Invalid API Key",
        description: "Please check your OpenAI API key and try again.",
        variant: "destructive",
      })
    } finally {
      setIsValidatingApiKey(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="ai">AI Integration</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Story Configuration</CardTitle>
                <CardDescription>Configure how stories are numbered and managed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="storyPrefix">Story Number Prefix</Label>
                  <Input
                    id="storyPrefix"
                    placeholder="TUNE"
                    value={formData.storyPrefix}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        storyPrefix: e.target.value.toUpperCase(),
                      }))
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    Stories will be numbered as {formData.storyPrefix}-001, {formData.storyPrefix}-002, etc.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="autoSaveInterval">Auto-save Interval (seconds)</Label>
                  <Select
                    value={formData.autoSaveInterval.toString()}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        autoSaveInterval: Number.parseInt(value),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10000">10 seconds</SelectItem>
                      <SelectItem value="30000">30 seconds</SelectItem>
                      <SelectItem value="60000">1 minute</SelectItem>
                      <SelectItem value="300000">5 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  OpenAI Integration
                </CardTitle>
                <CardDescription>Configure AI-powered story generation and enhancement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="openaiApiKey">OpenAI API Key</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="openaiApiKey"
                        type={showApiKey ? "text" : "password"}
                        placeholder="sk-..."
                        value={formData.openaiApiKey || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            openaiApiKey: e.target.value,
                          }))
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button onClick={validateApiKey} disabled={isValidatingApiKey} variant="outline">
                      {isValidatingApiKey ? "Validating..." : "Validate"}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Get your API key from{" "}
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      OpenAI Platform
                    </a>
                  </p>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">AI Features</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">AI-Assisted</Badge>
                      <span>Enhance existing story titles and descriptions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">AI-Generated</Badge>
                      <span>Generate complete stories from prompts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Auto-tagging</Badge>
                      <span>Automatically tag stories based on content</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Bolt.new Integration</Badge>
                      <span>Generate optimized prompts for development</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Theme & Appearance
                </CardTitle>
                <CardDescription>Customize the look and feel of your scrum board</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select
                    value={formData.theme}
                    onValueChange={(value: "light" | "dark" | "system") =>
                      setFormData((prev) => ({ ...prev, theme: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">System theme will match your device's preference</p>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Design System</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Future updates will include design token import and custom styling options
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Coming Soon</Badge>
                      <span>Upload design token files (JSON, CSS, SCSS)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Coming Soon</Badge>
                      <span>Custom CSS import with live preview</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Coming Soon</Badge>
                      <span>External stylesheet URL import</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
