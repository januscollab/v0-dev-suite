import type React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { forwardRef } from "react"

const DashedButton = forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>(
  ({ className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant="outline"
        className={cn("border-dashed border-2 hover:border-solid transition-all duration-200", className)}
        {...props}
      />
    )
  },
)
DashedButton.displayName = "DashedButton"

export { DashedButton }
