import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Shield, LogOut } from "lucide-react";

export default function DashboardPage() {
    const { profile, signOut } = useAuthStore();

    return (
        <div className="flex h-screen w-screen flex-col items-center justify-center gap-6 bg-background p-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Shield className="h-8 w-8 text-primary" />
            </div>

            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">
                    Disaster<span className="text-primary">Connect</span>
                </h1>
                {profile && (
                    <p className="text-muted-foreground">
                        Welcome, <span className="font-medium text-foreground">{profile.first_name} {profile.last_name}</span>
                        <span className="mx-2 text-border">•</span>
                        <span className="capitalize">{profile.role.replace("_", " ")}</span>
                    </p>
                )}
            </div>

            <p className="text-sm text-muted-foreground">
                Dashboard &amp; AppShell layout coming in Step 4
            </p>

            <Button variant="outline" onClick={signOut} className="gap-2">
                <LogOut className="h-4 w-4" />
                Sign Out
            </Button>
        </div>
    );
}
