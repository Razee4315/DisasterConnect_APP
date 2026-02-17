import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useUIStore } from "@/stores/ui-store"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const theme = useUIStore((s) => s.theme)

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      visibleToasts={3}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--color-popover)",
          "--normal-text": "var(--color-popover-foreground)",
          "--normal-border": "var(--color-border)",
          "--success-bg": "var(--color-success)",
          "--success-text": "var(--color-success-foreground)",
          "--success-border": "var(--color-success)",
          "--error-bg": "var(--color-destructive)",
          "--error-text": "var(--color-destructive-foreground)",
          "--error-border": "var(--color-destructive)",
          "--border-radius": "var(--radius-lg)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
