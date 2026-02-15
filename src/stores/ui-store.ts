import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark" | "system";

interface UIState {
    sidebarCollapsed: boolean;
    theme: Theme;

    toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    setTheme: (theme: Theme) => void;
}

function applyThemeClass(theme: Theme) {
    const root = document.documentElement;
    if (theme === "dark") {
        root.classList.add("dark");
    } else if (theme === "light") {
        root.classList.remove("dark");
    } else {
        // system
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.classList.toggle("dark", prefersDark);
    }
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            sidebarCollapsed: false,
            theme: "system" as Theme,

            toggleSidebar: () =>
                set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
            setSidebarCollapsed: (collapsed) =>
                set({ sidebarCollapsed: collapsed }),
            setTheme: (theme) => {
                applyThemeClass(theme);
                set({ theme });
            },
        }),
        {
            name: "dc-ui",
            partialize: (s) => ({ theme: s.theme, sidebarCollapsed: s.sidebarCollapsed }),
        }
    )
);

// Apply theme on first load after hydration
if (typeof window !== "undefined") {
    // Apply immediately from localStorage before React mounts (prevents flash)
    try {
        const stored = JSON.parse(localStorage.getItem("dc-ui") || "{}");
        applyThemeClass(stored?.state?.theme ?? "system");
    } catch {
        applyThemeClass("system");
    }

    // Listen for system theme changes when in "system" mode
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
        const { theme } = useUIStore.getState();
        if (theme === "system") applyThemeClass("system");
    });
}
