import { create } from "zustand";

interface UIState {
    sidebarCollapsed: boolean;
    theme: "light" | "dark" | "system";

    toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    setTheme: (theme: "light" | "dark" | "system") => void;
}

export const useUIStore = create<UIState>((set) => ({
    sidebarCollapsed: false,
    theme: "system",

    toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    setSidebarCollapsed: (collapsed) =>
        set({ sidebarCollapsed: collapsed }),
    setTheme: (theme) =>
        set({ theme }),
}));
