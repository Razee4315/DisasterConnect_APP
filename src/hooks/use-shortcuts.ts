import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// ─── Shortcut definitions ───────────────────────────────────────

export interface ShortcutDef {
    key: string;
    label: string;
    description: string;
    /** Category for grouping in the dialog */
    group: "Navigation" | "Actions" | "General";
}

export const SHORTCUTS: ShortcutDef[] = [
    // General
    { key: "Ctrl+K", label: "Ctrl+K", description: "Open command palette", group: "General" },
    { key: "?", label: "?", description: "Show keyboard shortcuts", group: "General" },
    { key: "Escape", label: "Esc", description: "Close dialogs / palette", group: "General" },

    // Navigation (G then letter — "go to")
    { key: "g d", label: "G then D", description: "Go to Dashboard", group: "Navigation" },
    { key: "g i", label: "G then I", description: "Go to Incidents", group: "Navigation" },
    { key: "g r", label: "G then R", description: "Go to Resources", group: "Navigation" },
    { key: "g m", label: "G then M", description: "Go to Map", group: "Navigation" },
    { key: "g t", label: "G then T", description: "Go to Tasks", group: "Navigation" },
    { key: "g c", label: "G then C", description: "Go to Messaging", group: "Navigation" },
    { key: "g a", label: "G then A", description: "Go to Alerts", group: "Navigation" },
    { key: "g e", label: "G then E", description: "Go to Teams", group: "Navigation" },
    { key: "g s", label: "G then S", description: "Go to Settings", group: "Navigation" },
    { key: "g n", label: "G then N", description: "Go to Analytics", group: "Navigation" },
    { key: "g o", label: "G then O", description: "Go to Donations", group: "Navigation" },
    { key: "g v", label: "G then V", description: "Go to Evacuation", group: "Navigation" },

    // Actions
    { key: "Ctrl+Shift+I", label: "Ctrl+Shift+I", description: "New incident (on incidents page)", group: "Actions" },
];

// ─── Chord-sequence navigation map ─────────────────────────────

const GO_MAP: Record<string, string> = {
    d: "/dashboard",
    i: "/incidents",
    r: "/resources",
    m: "/map",
    t: "/tasks",
    c: "/messaging",
    a: "/alerts",
    e: "/teams",
    s: "/settings",
    n: "/analytics",
    o: "/donations",
    v: "/evacuation",
};

// ─── Hook ───────────────────────────────────────────────────────

interface UseShortcutsOptions {
    onTogglePalette?: () => void;
    onToggleShortcuts?: () => void;
}

export function useShortcuts({ onTogglePalette, onToggleShortcuts }: UseShortcutsOptions = {}) {
    const navigate = useNavigate();
    const pendingRef = useRef<string | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearPending = useCallback(() => {
        pendingRef.current = null;
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const tag = target.tagName;

            // Don't intercept when typing in inputs / textareas / contenteditable
            const isInput =
                tag === "INPUT" ||
                tag === "TEXTAREA" ||
                tag === "SELECT" ||
                target.isContentEditable;

            // Ctrl+K is always active (handled by command-palette, but we keep it consistent)
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                // Already handled by command-palette — don't duplicate
                return;
            }

            // Ctrl+Shift+I — new incident shortcut
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "I") {
                e.preventDefault();
                navigate("/incidents?action=new");
                return;
            }

            // Everything below only fires outside of input fields
            if (isInput) return;

            // "?" — show shortcuts dialog
            if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                onToggleShortcuts?.();
                return;
            }

            // Chord: first key "g"
            if (e.key === "g" && !e.ctrlKey && !e.metaKey && !e.altKey && !pendingRef.current) {
                pendingRef.current = "g";
                // Auto-clear after 800ms if no second key
                timerRef.current = setTimeout(clearPending, 800);
                return;
            }

            // Chord: second key after "g"
            if (pendingRef.current === "g") {
                const dest = GO_MAP[e.key];
                clearPending();
                if (dest) {
                    e.preventDefault();
                    navigate(dest);
                }
                return;
            }
        };

        window.addEventListener("keydown", handler);
        return () => {
            window.removeEventListener("keydown", handler);
            clearPending();
        };
    }, [navigate, onTogglePalette, onToggleShortcuts, clearPending]);
}
