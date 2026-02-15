import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { Switch } from "@/components/ui/switch";
import { User, Palette, Bell, Loader2, Save, Sun, Moon, Monitor } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
    const { profile, session, fetchProfile } = useAuthStore();
    const { theme, setTheme } = useUIStore();

    // Profile form
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [organization, setOrganization] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (profile) {
            setFirstName(profile.first_name ?? "");
            setLastName(profile.last_name ?? "");
            setPhone(profile.phone ?? "");
            setOrganization(profile.organization ?? "");
        }
    }, [profile]);

    const saveProfile = async () => {
        if (!session) return;
        setSaving(true);
        const { error } = await supabase
            .from("profiles")
            .update({
                first_name: firstName,
                last_name: lastName,
                phone: phone || null,
                organization: organization || null,
            })
            .eq("id", session.user.id);

        if (error) {
            toast.error(error.message);
        } else {
            toast.success("Profile updated");
            fetchProfile();
        }
        setSaving(false);
    };

    const themeOptions = [
        { value: "light", label: "Light", icon: Sun },
        { value: "dark", label: "Dark", icon: Moon },
        { value: "system", label: "System", icon: Monitor },
    ] as const;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-xl font-bold tracking-tight">Settings</h1>
                <p className="text-sm text-muted-foreground">Manage your profile and preferences</p>
            </div>

            {/* ── Profile ────────────────────────────────────────── */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        <CardTitle className="text-sm">Profile</CardTitle>
                    </div>
                    <CardDescription className="text-xs">Your personal information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-xs">First Name</Label>
                            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} data-selectable />
                        </div>
                        <div>
                            <Label className="text-xs">Last Name</Label>
                            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} data-selectable />
                        </div>
                    </div>
                    <div>
                        <Label className="text-xs">Email</Label>
                        <Input value={session?.user.email ?? ""} disabled className="opacity-60" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-xs">Phone</Label>
                            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" data-selectable />
                        </div>
                        <div>
                            <Label className="text-xs">Organization</Label>
                            <Input value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="Optional" data-selectable />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-xs text-muted-foreground">
                            Role: <span className="font-medium capitalize">{profile?.role?.replace("_", " ")}</span>
                        </div>
                    </div>
                    <Separator />
                    <div className="flex justify-end">
                        <Button onClick={saveProfile} disabled={saving} className="gap-1.5">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Save Changes
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* ── Appearance ─────────────────────────────────────── */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <Palette className="h-4 w-4 text-primary" />
                        <CardTitle className="text-sm">Appearance</CardTitle>
                    </div>
                    <CardDescription className="text-xs">Customize how the app looks</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">Theme</p>
                            <p className="text-xs text-muted-foreground">Switch between light, dark, or match your system</p>
                        </div>
                        <div className="flex gap-1 bg-muted rounded-lg p-1">
                            {themeOptions.map(({ value, label, icon: Icon }) => (
                                <Button
                                    key={value}
                                    variant={theme === value ? "default" : "ghost"}
                                    size="sm"
                                    className="gap-1.5 h-8 px-3"
                                    onClick={() => setTheme(value)}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                    {label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ── Notifications ──────────────────────────────────── */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-primary" />
                        <CardTitle className="text-sm">Notifications</CardTitle>
                    </div>
                    <CardDescription className="text-xs">Control what alerts you receive</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[
                        { id: "incidents", label: "Incident updates", desc: "New incidents and status changes" },
                        { id: "tasks", label: "Task assignments", desc: "When you're assigned to a task" },
                        { id: "messages", label: "Messages", desc: "Direct messages and channel activity" },
                        { id: "sos", label: "SOS broadcasts", desc: "Emergency alerts from team" },
                    ].map((item) => (
                        <div key={item.id} className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">{item.label}</p>
                                <p className="text-xs text-muted-foreground">{item.desc}</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
