import { useState, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X, Copy } from "lucide-react";
import { AppLogo } from "@/components/app-logo";

const appWindow = getCurrentWindow();

export function TitleBar() {
    const [isMaximized, setIsMaximized] = useState(false);

    useEffect(() => {
        appWindow.isMaximized().then(setIsMaximized);

        const unlisten = appWindow.onResized(async () => {
            setIsMaximized(await appWindow.isMaximized());
        });

        return () => {
            unlisten.then((fn) => fn());
        };
    }, []);

    return (
        <div
            data-tauri-drag-region
            className="flex h-8 shrink-0 items-center justify-between bg-sidebar border-b border-sidebar-border select-none"
        >
            {/* Left: logo + app name */}
            <div
                data-tauri-drag-region
                className="flex items-center gap-1.5 pl-3"
            >
                <AppLogo className="h-3.5 w-3.5" />
                <span
                    data-tauri-drag-region
                    className="text-[11px] font-semibold tracking-tight text-sidebar-foreground"
                >
                    Disaster<span className="text-primary">Connect</span>
                </span>
            </div>

            {/* Right: window controls */}
            <div className="flex h-full">
                <button
                    onClick={() => appWindow.minimize()}
                    className="inline-flex h-full w-11 items-center justify-center text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                    aria-label="Minimize"
                >
                    <Minus className="h-3.5 w-3.5" />
                </button>
                <button
                    onClick={() => appWindow.toggleMaximize()}
                    className="inline-flex h-full w-11 items-center justify-center text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                    aria-label={isMaximized ? "Restore" : "Maximize"}
                >
                    {isMaximized ? (
                        <Copy className="h-3 w-3" />
                    ) : (
                        <Square className="h-3 w-3" />
                    )}
                </button>
                <button
                    onClick={() => appWindow.close()}
                    className="inline-flex h-full w-11 items-center justify-center text-sidebar-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    aria-label="Close"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    );
}
