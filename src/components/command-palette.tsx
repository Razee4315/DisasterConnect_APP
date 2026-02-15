import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";
import {
    LayoutDashboard,
    AlertTriangle,
    Package,
    Map,
    ListTodo,
    MessageSquare,
    Bell,
    Users,
    HandCoins,
    FileBarChart,
    BarChart3,
    Route,
    FileText,
    Settings,
    ShieldCheck,
    Loader2,
} from "lucide-react";

// ─── Navigation pages ───────────────────────────────────────────

const PAGES = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", keywords: "home overview stats" },
    { label: "Incidents", icon: AlertTriangle, href: "/incidents", keywords: "disaster event emergency" },
    { label: "Resources", icon: Package, href: "/resources", keywords: "equipment supplies personnel" },
    { label: "Map", icon: Map, href: "/map", keywords: "location geography" },
    { label: "Tasks", icon: ListTodo, href: "/tasks", keywords: "todo assign work" },
    { label: "Messaging", icon: MessageSquare, href: "/messaging", keywords: "chat channel communication" },
    { label: "Alerts", icon: Bell, href: "/alerts", keywords: "warning notification broadcast" },
    { label: "Teams", icon: Users, href: "/teams", keywords: "group squad members" },
    { label: "Donations", icon: HandCoins, href: "/donations", keywords: "donate money supplies contribute" },
    { label: "Reports", icon: FileBarChart, href: "/reports", keywords: "pdf export summary" },
    { label: "Analytics", icon: BarChart3, href: "/analytics", keywords: "charts graphs trends data" },
    { label: "Evacuation", icon: Route, href: "/evacuation", keywords: "route escape path" },
    { label: "Documents", icon: FileText, href: "/documents", keywords: "files upload attachment" },
    { label: "Settings", icon: Settings, href: "/settings", keywords: "profile preferences theme" },
] as const;

const ADMIN_PAGES = [
    { label: "Admin Panel", icon: ShieldCheck, href: "/admin", keywords: "administration users manage system" },
] as const;

// ─── Search result types ────────────────────────────────────────

interface SearchResult {
    id: string;
    title: string;
    subtitle: string;
    href: string;
    type: "incident" | "resource" | "task";
}

// ─── Component ──────────────────────────────────────────────────

export function CommandPalette({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const navigate = useNavigate();
    const profile = useAuthStore((s) => s.profile);
    const isAdmin = profile?.role === "administrator";

    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);

    // ── Ctrl+K global shortcut ──────────────────────────────────
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                onOpenChange(!open);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [open, onOpenChange]);

    // ── Debounced search ────────────────────────────────────────
    useEffect(() => {
        if (!query || query.length < 2) {
            setResults([]);
            return;
        }

        const abortController = new AbortController();
        let cancelled = false;

        const search = async () => {
            setLoading(true);
            try {
                const term = `%${query}%`;

                const [incidents, resources, tasks] = await Promise.all([
                    supabase
                        .from("incidents")
                        .select("id, title, status, severity")
                        .or(`title.ilike.${term},description.ilike.${term},location_name.ilike.${term}`)
                        .order("created_at", { ascending: false })
                        .limit(5)
                        .abortSignal(abortController.signal),
                    supabase
                        .from("resources")
                        .select("id, name, type, status")
                        .or(`name.ilike.${term},description.ilike.${term},location_name.ilike.${term}`)
                        .order("created_at", { ascending: false })
                        .limit(5)
                        .abortSignal(abortController.signal),
                    supabase
                        .from("tasks")
                        .select("id, title, priority, status")
                        .or(`title.ilike.${term},description.ilike.${term}`)
                        .order("created_at", { ascending: false })
                        .limit(5)
                        .abortSignal(abortController.signal),
                ]);

                if (cancelled) return;

                const mapped: SearchResult[] = [];

                if (incidents.data) {
                    for (const i of incidents.data) {
                        mapped.push({
                            id: i.id,
                            title: i.title,
                            subtitle: `${i.severity} \u00b7 ${i.status}`,
                            href: `/incidents/${i.id}`,
                            type: "incident",
                        });
                    }
                }

                if (resources.data) {
                    for (const r of resources.data) {
                        mapped.push({
                            id: r.id,
                            title: r.name,
                            subtitle: `${r.type.replace("_", " ")} \u00b7 ${r.status}`,
                            href: `/resources/${r.id}`,
                            type: "resource",
                        });
                    }
                }

                if (tasks.data) {
                    for (const t of tasks.data) {
                        mapped.push({
                            id: t.id,
                            title: t.title,
                            subtitle: `${t.priority} priority \u00b7 ${t.status}`,
                            href: `/tasks`,
                            type: "task",
                        });
                    }
                }

                setResults(mapped);
            } catch {
                // Abort errors are expected during cleanup
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        const timer = setTimeout(search, 250);

        return () => {
            cancelled = true;
            abortController.abort();
            clearTimeout(timer);
        };
    }, [query]);

    // ── Select handler ──────────────────────────────────────────
    const handleSelect = useCallback(
        (href: string) => {
            onOpenChange(false);
            setQuery("");
            navigate(href);
        },
        [navigate, onOpenChange]
    );

    // ── Reset on close ──────────────────────────────────────────
    const handleOpenChange = useCallback(
        (next: boolean) => {
            onOpenChange(next);
            if (!next) {
                setQuery("");
                setResults([]);
            }
        },
        [onOpenChange]
    );

    const incidentResults = results.filter((r) => r.type === "incident");
    const resourceResults = results.filter((r) => r.type === "resource");
    const taskResults = results.filter((r) => r.type === "task");

    return (
        <CommandDialog open={open} onOpenChange={handleOpenChange}>
            <CommandInput
                placeholder="Search incidents, resources, tasks, pages..."
                value={query}
                onValueChange={setQuery}
                data-selectable
            />
            <CommandList>
                <CommandEmpty>
                    {loading ? (
                        <span className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Searching...
                        </span>
                    ) : query.length < 2 ? (
                        "Type to search..."
                    ) : (
                        "No results found."
                    )}
                </CommandEmpty>

                {/* Data results */}
                {incidentResults.length > 0 && (
                    <CommandGroup heading="Incidents">
                        {incidentResults.map((r) => (
                            <CommandItem
                                key={r.id}
                                value={`incident-${r.title}`}
                                onSelect={() => handleSelect(r.href)}
                            >
                                <AlertTriangle className="text-orange-500" />
                                <div className="flex flex-col gap-0.5 min-w-0">
                                    <span className="truncate">{r.title}</span>
                                    <span className="text-xs text-muted-foreground capitalize truncate">
                                        {r.subtitle}
                                    </span>
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {resourceResults.length > 0 && (
                    <CommandGroup heading="Resources">
                        {resourceResults.map((r) => (
                            <CommandItem
                                key={r.id}
                                value={`resource-${r.title}`}
                                onSelect={() => handleSelect(r.href)}
                            >
                                <Package className="text-blue-500" />
                                <div className="flex flex-col gap-0.5 min-w-0">
                                    <span className="truncate">{r.title}</span>
                                    <span className="text-xs text-muted-foreground capitalize truncate">
                                        {r.subtitle}
                                    </span>
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {taskResults.length > 0 && (
                    <CommandGroup heading="Tasks">
                        {taskResults.map((r) => (
                            <CommandItem
                                key={r.id}
                                value={`task-${r.title}`}
                                onSelect={() => handleSelect(r.href)}
                            >
                                <ListTodo className="text-green-500" />
                                <div className="flex flex-col gap-0.5 min-w-0">
                                    <span className="truncate">{r.title}</span>
                                    <span className="text-xs text-muted-foreground capitalize truncate">
                                        {r.subtitle}
                                    </span>
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {(incidentResults.length > 0 ||
                    resourceResults.length > 0 ||
                    taskResults.length > 0) && <CommandSeparator />}

                {/* Page navigation */}
                <CommandGroup heading="Pages">
                    {PAGES.map((page) => (
                        <CommandItem
                            key={page.href}
                            value={`${page.label} ${page.keywords}`}
                            onSelect={() => handleSelect(page.href)}
                        >
                            <page.icon />
                            {page.label}
                        </CommandItem>
                    ))}
                    {isAdmin &&
                        ADMIN_PAGES.map((page) => (
                            <CommandItem
                                key={page.href}
                                value={`${page.label} ${page.keywords}`}
                                onSelect={() => handleSelect(page.href)}
                            >
                                <page.icon />
                                {page.label}
                            </CommandItem>
                        ))}
                </CommandGroup>
            </CommandList>

            <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
                <span>Navigate with <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">&uarr;</kbd> <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">&darr;</kbd></span>
                <span>
                    <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">Esc</kbd> to close
                    <CommandShortcut className="ml-2">Ctrl+K</CommandShortcut>
                </span>
            </div>
        </CommandDialog>
    );
}
