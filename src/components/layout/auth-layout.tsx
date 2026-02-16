import { Outlet } from "react-router-dom";
import { TitleBar } from "./titlebar";

export function AuthLayout() {
    return (
        <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
            <TitleBar />
            <div className="flex-1 overflow-y-auto">
                <Outlet />
            </div>
        </div>
    );
}
