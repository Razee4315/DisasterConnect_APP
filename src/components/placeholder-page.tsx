import type { LucideIcon } from "lucide-react";

interface PlaceholderPageProps {
    title: string;
    description: string;
    icon: LucideIcon;
}

export function PlaceholderPage({ title, description, icon: Icon }: PlaceholderPageProps) {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <Icon className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                <p className="text-sm text-muted-foreground max-w-md">{description}</p>
            </div>
        </div>
    );
}
