import { cn } from "@/lib/utils";

interface AppLogoProps {
  className?: string;
}

export function AppLogo({ className }: AppLogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-7 w-7", className)}
    >
      <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="6" className="text-foreground/70" />
      <path
        d="M20 50 H35 L45 25 L55 75 L65 50 H80"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-destructive"
      />
      <circle cx="20" cy="50" r="4" fill="currentColor" className="text-foreground/70" />
      <circle cx="80" cy="50" r="4" fill="currentColor" className="text-foreground/70" />
    </svg>
  );
}
