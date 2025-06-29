"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { SprintCard } from "./sprint-card"
import type { Sprint, Story, Settings } from "@/types"

interface SortableSprintCardProps {
  sprint: Sprint
  onAddStory: () => void
  onEditStory: (story: Story) => void
  onUpdateStory: (storyId: string, updates: Partial<Story>) => void
  settings: Settings
  isBacklog?: boolean
}

export function SortableSprintCard({
  sprint,
  onAddStory,
  onEditStory,
  onUpdateStory,
  settings,
  isBacklog = false,
}: SortableSprintCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sprint.id,
    data: {
      type: "sprint",
      sprint,
    },
    disabled: sprint.type !== "custom", // Only custom sprints can be reordered
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <SprintCard
        sprint={sprint}
        onAddStory={onAddStory}
        onEditStory={onEditStory}
        onUpdateStory={onUpdateStory}
        settings={settings}
        isBacklog={isBacklog}
        dragHandleProps={sprint.type === "custom" ? listeners : undefined}
      />
    </div>
  )
}
