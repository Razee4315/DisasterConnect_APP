import { Outlet } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "./sidebar";
import { TopBar } from "./topbar";

export function AppShell() {
    return (
        <TooltipProvider delayDuration={300}>
            <div className="flex h-screen w-screen overflow-hidden bg-background">
                <Sidebar />
                <div className="flex flex-1 flex-col overflow-hidden">
                    <TopBar />
                    <main className="flex-1 overflow-y-auto scrollable p-6">
                        <Outlet />
                    </main>
                </div>
            </div>
            <Toaster position="bottom-right" />
        </TooltipProvider>
    );
}
