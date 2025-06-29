"use client"

import { useState } from "react"
import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Plus, Play, Archive, RotateCcw, GripVertical, Trash2, MoreVertical } from "lucide-react"
import type { Sprint, Story, Settings } from "@/types"
import { StoryCard } from "./story-card"
import { useAIIntegration } from "@/hooks/use-ai-integration-fixed"
import { toast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { BoltPromptModal } from "./bolt-prompt-modal"

interface SprintCardProps {
  sprint: Sprint
  progress: number
  onAddStory: () => void
  onUpdateSprint: (sprintId: string, updates: Partial<Sprint>) => void
  onDeleteSprint: (sprintId: string, moveStoriesToSprintId?: string) => void
  onUpdateStory: (storyId: string, updates: Partial<Story>) => void
  onEditStory: (story: Story) => void
  settings: Settings
  isArchived?: boolean
  onRestoreSprint?: () => void
  isDragging?: boolean
}

export function SprintCard({
  sprint,
  progress,
  onAddStory,
  onUpdateSprint,
  onDeleteSprint,
  onUpdateStory,
  onEditStory,
  settings,
  isArchived,
  onRestoreSprint,
  isDragging,
}: SprintCardProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: sprint.id,
  })

  const { generateBoltPrompt } = useAIIntegration(settings.openaiApiKey || process.env.OPENAI_API_KEY || "")
  const [showBoltPrompt, setShowBoltPrompt] = useState(false)
  const [boltPrompt, setBoltPrompt] = useState("")

  const handleOpenSprint = async () => {
    try {
      const prompt = generateBoltPrompt(sprint.name, sprint.stories)
      setBoltPrompt(prompt)
      setShowBoltPrompt(true)
    } catch (error) {
      toast({
        title: "Error generating prompt",
        description: "Could not generate bolt.new prompt. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCloseCompleted = () => {
    const completedStories = sprint.stories.filter((s) => s.status === "completed")
    completedStories.forEach((story) => {
      onUpdateStory(story.id, { completedAt: new Date() })
    })
    toast({
      title: "Completed stories archived",
      description: `${completedStories.length} stories have been archived.`,
    })
  }

  const handleCloseFull = () => {
    sprint.stories.forEach((story) => {
      onUpdateStory(story.id, {
        status: "completed",
        completedAt: new Date(),
      })
    })
    toast({
      title: "Sprint closed",
      description: "All stories have been marked as completed and archived.",
    })
  }

  const getSprintTypeIcon = () => {
    switch (sprint.type) {
      case "priority":
        return "🔥"
      case "backlog":
        return "📋"
      default:
        return "🚀"
    }
  }

  const getSprintTypeColor = () => {
    switch (sprint.type) {
      case "priority":
        return "destructive"
      case "backlog":
        return "secondary"
      default:
        return "default"
    }
  }

  return (
    <>
      <Card
        ref={setNodeRef}
        className={`transition-all duration-200 ${
          isOver ? "ring-2 ring-primary ring-offset-2" : ""
        } ${sprint.layout === "two-column" ? "min-h-[400px]" : "min-h-[300px]"} ${
          isDragging ? "opacity-50 rotate-2 shadow-2xl" : ""
        }`}
      >
        <CardHeader className="pb-3">
          {/* Sprint Name - Top Left */}
          <div className="flex items-center gap-2 mb-2">
            {sprint.type === "custom" && <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />}
            <span className="text-lg">{getSprintTypeIcon()}</span>
            <CardTitle className="text-lg">{sprint.name}</CardTitle>
            <Badge variant={getSprintTypeColor() as any}>{sprint.type}</Badge>
            {sprint.type === "custom" && (
              <Badge variant="outline" className="text-xs">
                Drag to reorder
              </Badge>
            )}
          </div>

          {/* Action buttons and story count - Bottom Right */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {sprint.description && <p className="text-sm text-muted-foreground">{sprint.description}</p>}
            </div>

            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground mr-3">
                {sprint.stories.length} {sprint.stories.length === 1 ? "story" : "stories"}
              </span>

              {!isArchived ? (
                <>
                  <Button
                    onClick={handleOpenSprint}
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                    title="Open Sprint - Generate bolt.new prompt"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Open
                  </Button>

                  <Button
                    onClick={handleCloseCompleted}
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                    title="Archive completed stories"
                  >
                    <Archive className="h-3 w-3 mr-1" />
                    Close Done
                  </Button>

                  <Button
                    onClick={handleCloseFull}
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
                    title="Mark all stories complete and archive"
                  >
                    <Archive className="h-3 w-3 mr-1" />
                    Close All
                  </Button>
                </>
              ) : (
                <Button
                  onClick={onRestoreSprint}
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                  title="Restore sprint to active"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Restore
                </Button>
              )}

              {/* Three dots menu - ONLY for custom sprints */}
              {!isArchived && sprint.type === "custom" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 ml-1">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => onDeleteSprint?.(sprint.id)}
                      className="flex items-center gap-2 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete Sprint</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {sprint.stories.length > 0 && (
            <div className="space-y-2 mt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-3">
            <Button onClick={onAddStory} variant="dashed" className="w-full" size="sm" disabled={isArchived}>
              <Plus className="h-4 w-4 mr-2" />
              {isArchived ? "Archived Sprint" : "Add Story"}
            </Button>

            <SortableContext items={sprint.stories.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <div className={`space-y-2 ${sprint.type === "backlog" ? "grid grid-cols-2 gap-2 space-y-0" : ""}`}>
                {sprint.stories.map((story) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    onUpdate={(updates) => onUpdateStory(story.id, updates)}
                    onEdit={onEditStory}
                  />
                ))}
              </div>
            </SortableContext>

            {sprint.stories.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No stories yet</p>
                <p className="text-sm">Drag stories here or click "Add Story"</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <BoltPromptModal
        open={showBoltPrompt}
        onOpenChange={setShowBoltPrompt}
        prompt={boltPrompt}
        sprintName={sprint.name}
      />
    </>
  )
}
