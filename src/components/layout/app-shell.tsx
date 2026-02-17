import { useCallback, useState } from "react";
import { Outlet } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "./sidebar";
import { TopBar } from "./topbar";
import { ShortcutsDialog } from "@/components/shortcuts-dialog";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { useOfflineDetection, useOfflineSync } from "@/hooks/use-offline";
import { UpdateChecker } from "@/components/update-checker";
import { TitleBar } from "./titlebar";

function ShortcutsProvider({ children }: { children: React.ReactNode }) {
    const [shortcutsOpen, setShortcutsOpen] = useState(false);

    const onToggleShortcuts = useCallback(
        () => setShortcutsOpen((prev) => !prev),
        []
    );

    useShortcuts({ onToggleShortcuts });
    useOfflineDetection();
    useOfflineSync();

    return (
        <>
            {children}
            <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
        </>
    );
}

export function AppShell() {
    return (
        <TooltipProvider delayDuration={300}>
            <ShortcutsProvider>
                <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
                    <a
                        href="#main-content"
                        className="sr-only focus:not-sr-only focus:absolute focus:z-[9999] focus:top-2 focus:left-2 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg"
                    >
                        Skip to main content
                    </a>
                    <TitleBar />
                    <div className="flex flex-1 overflow-hidden">
                        <Sidebar />
                        <div className="flex flex-1 flex-col overflow-hidden">
                            <TopBar />
                            <main id="main-content" className="flex-1 overflow-y-auto scrollable p-6">
                                <Outlet />
                            </main>
                        </div>
                    </div>
                </div>
            </ShortcutsProvider>
            <Toaster position="bottom-right" />
            <UpdateChecker />
        </TooltipProvider>
    );
}
