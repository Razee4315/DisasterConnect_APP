import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { SHORTCUTS, type ShortcutDef } from "@/hooks/use-shortcuts";
import { Keyboard } from "lucide-react";

interface ShortcutsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function groupShortcuts(shortcuts: ShortcutDef[]) {
    const groups: Record<string, ShortcutDef[]> = {};
    for (const s of shortcuts) {
        if (!groups[s.group]) groups[s.group] = [];
        groups[s.group].push(s);
    }
    return groups;
}

function ShortcutKey({ label }: { label: string }) {
    const parts = label.split("+");
    return (
        <span className="flex items-center gap-1">
            {parts.map((part, i) => (
                <span key={i}>
                    {i > 0 && <span className="text-muted-foreground mx-0.5">+</span>}
                    <kbd className="inline-flex min-w-[1.5rem] items-center justify-center rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px] font-medium text-foreground">
                        {part.replace("then", "").trim()}
                    </kbd>
                </span>
            ))}
        </span>
    );
}

function ChordKey({ label }: { label: string }) {
    // e.g. "G then D"
    const parts = label.split(" then ");
    return (
        <span className="flex items-center gap-1">
            {parts.map((part, i) => (
                <span key={i} className="flex items-center gap-1">
                    {i > 0 && (
                        <span className="text-[10px] text-muted-foreground">then</span>
                    )}
                    <kbd className="inline-flex min-w-[1.5rem] items-center justify-center rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px] font-medium text-foreground">
                        {part.trim()}
                    </kbd>
                </span>
            ))}
        </span>
    );
}

function KeyDisplay({ label }: { label: string }) {
    if (label.includes(" then ")) return <ChordKey label={label} />;
    return <ShortcutKey label={label} />;
}

export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
    const groups = groupShortcuts(SHORTCUTS);
    const groupOrder = ["General", "Navigation", "Actions"];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Keyboard className="h-5 w-5" />
                        Keyboard Shortcuts
                    </DialogTitle>
                    <DialogDescription>
                        Use these shortcuts to navigate and perform actions quickly.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto scrollable pr-1">
                    {groupOrder.map((groupName, gi) => {
                        const items = groups[groupName];
                        if (!items) return null;
                        return (
                            <div key={groupName}>
                                {gi > 0 && <Separator className="mb-3" />}
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                    {groupName}
                                </h4>
                                <div className="space-y-1.5">
                                    {items.map((s) => (
                                        <div
                                            key={s.key}
                                            className="flex items-center justify-between py-1 px-1 rounded-sm"
                                        >
                                            <span className="text-sm">
                                                {s.description}
                                            </span>
                                            <KeyDisplay label={s.label} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </DialogContent>
        </Dialog>
    );
}
