"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { SprintCardEnhanced } from "./sprint-card-enhanced"
import type { Sprint, Story, Settings } from "@/types"

interface SortableSprintCardEnhancedProps {
  sprint: Sprint
  onAddStory: () => void
  onEditStory: (story: Story) => void
  onUpdateStory: (storyId: string, updates: Partial<Story>) => void
  onOpenSprint: () => void
  onCloseCompleted: () => void
  onCloseAll: () => void
  onDeleteSprint?: (sprintId: string) => void
  settings: Settings
}

export function SortableSprintCardEnhanced(props: SortableSprintCardEnhancedProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.sprint.id,
    data: {
      type: "sprint",
      sprint: props.sprint,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <SprintCardEnhanced {...props} isDragging={isDragging} />
    </div>
  )
}
