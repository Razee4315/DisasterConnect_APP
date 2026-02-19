import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    User,
    Palette,
    Bell,
    Lock,
    Info,
    Loader2,
    Save,
    Sun,
    Moon,
    Monitor,
    AlertTriangle,
    MessageSquare,
    ListTodo,
    Radio,
    Shield,
    CheckCircle2,
    Eye,
    EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { formatRole } from "@/lib/utils";
import { AvatarUpload } from "@/components/avatar-upload";
import { getVersion } from "@tauri-apps/api/app";

// ─── Types ───────────────────────────────────────────────────────

type SettingsSection = "profile" | "appearance" | "notifications" | "security" | "about";
type NotifPrefs = Record<string, boolean>;

const SECTIONS: { id: SettingsSection; label: string; icon: typeof User }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "about", label: "About", icon: Info },
];

const NOTIFICATION_ITEMS = [
    { id: "incidents", label: "Incident Updates", desc: "New incidents and status changes", icon: AlertTriangle, color: "text-destructive" },
    { id: "tasks", label: "Task Assignments", desc: "When you're assigned to a task", icon: ListTodo, color: "text-primary" },
    { id: "messages", label: "Messages", desc: "Direct messages and channel activity", icon: MessageSquare, color: "text-blue-500" },
    { id: "sos", label: "SOS Broadcasts", desc: "Emergency alerts from team", icon: Radio, color: "text-red-500" },
] as const;

// ─── Password Strength ──────────────────────────────────────────

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
    if (!pw) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 1) return { score: 1, label: "Weak", color: "bg-red-500" };
    if (score <= 2) return { score: 2, label: "Fair", color: "bg-orange-500" };
    if (score <= 3) return { score: 3, label: "Good", color: "bg-yellow-500" };
    if (score <= 4) return { score: 4, label: "Strong", color: "bg-green-500" };
    return { score: 5, label: "Very Strong", color: "bg-emerald-500" };
}

// ─── Settings Page ──────────────────────────────────────────────

export default function SettingsPage() {
    const { profile, session, fetchProfile, updatePassword } = useAuthStore();
    const { theme, setTheme } = useUIStore();
    const [activeSection, setActiveSection] = useState<SettingsSection>("profile");

    // Profile form
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [organization, setOrganization] = useState("");
    const [saving, setSaving] = useState(false);

    // Notification preferences
    const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>({
        incidents: true,
        tasks: true,
        messages: true,
        sos: true,
    });
    const [savingNotifs, setSavingNotifs] = useState(false);

    // Password change
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    // About
    const [appVersion, setAppVersion] = useState("");
    const platformInfo = navigator.platform || "unknown";

    const passwordStrength = getPasswordStrength(newPassword);
    const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;

    // Track unsaved profile changes
    const profileDirty = useMemo(() => {
        if (!profile) return false;
        return (
            firstName !== (profile.first_name ?? "") ||
            lastName !== (profile.last_name ?? "") ||
            phone !== (profile.phone ?? "") ||
            organization !== (profile.organization ?? "")
        );
    }, [profile, firstName, lastName, phone, organization]);

    // Warn before leaving with unsaved changes
    useEffect(() => {
        if (!profileDirty) return;
        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [profileDirty]);

    useEffect(() => {
        getVersion().then(setAppVersion).catch(() => setAppVersion("unknown"));
    }, []);

    useEffect(() => {
        if (profile) {
            setFirstName(profile.first_name ?? "");
            setLastName(profile.last_name ?? "");
            setPhone(profile.phone ?? "");
            setOrganization(profile.organization ?? "");

            if (profile.notification_preferences) {
                setNotifPrefs((prev) => ({
                    ...prev,
                    ...(profile.notification_preferences as NotifPrefs),
                }));
            }
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

    const handleNotifToggle = async (id: string, checked: boolean) => {
        const updated = { ...notifPrefs, [id]: checked };
        setNotifPrefs(updated);

        if (!session) return;
        setSavingNotifs(true);
        const { error } = await supabase
            .from("profiles")
            .update({ notification_preferences: updated })
            .eq("id", session.user.id);

        if (error) {
            toast.error("Failed to save notification preference");
            setNotifPrefs(notifPrefs);
        }
        setSavingNotifs(false);
    };

    const handleChangePassword = async () => {
        if (!newPassword || !confirmPassword) {
            toast.error("Please fill in both password fields");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        setChangingPassword(true);
        const { error } = await updatePassword(newPassword);
        if (error) {
            toast.error(error);
        } else {
            toast.success("Password updated successfully");
            setNewPassword("");
            setConfirmPassword("");
        }
        setChangingPassword(false);
    };

    const themeOptions = [
        { value: "light" as const, label: "Light", icon: Sun, desc: "Clean, bright interface" },
        { value: "dark" as const, label: "Dark", icon: Moon, desc: "Easy on the eyes" },
        { value: "system" as const, label: "System", icon: Monitor, desc: "Match OS preference" },
    ];

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-sm text-muted-foreground">Manage your profile, preferences, and security</p>
            </div>

            <div className="flex gap-6">
                {/* Sidebar Navigation */}
                <nav className="w-48 shrink-0">
                    <div className="sticky top-0 space-y-1">
                        {SECTIONS.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                className={`settings-nav-item ${activeSection === id ? "active" : ""}`}
                                onClick={() => setActiveSection(id)}
                            >
                                <Icon className="h-4 w-4 shrink-0" />
                                {label}
                            </button>
                        ))}
                    </div>
                </nav>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* ── Profile Section ─────────────────────────── */}
                    {activeSection === "profile" && (
                        <Card className="page-header-gradient">
                            <CardContent className="pt-6 space-y-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="stat-icon-container bg-primary/10">
                                        <User className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-semibold">Profile Information</h2>
                                        <p className="text-xs text-muted-foreground">Update your personal details</p>
                                    </div>
                                </div>

                                <AvatarUpload />

                                <Separator />

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium">First Name</Label>
                                        <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} data-selectable />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium">Last Name</Label>
                                        <Input value={lastName} onChange={(e) => setLastName(e.target.value)} data-selectable />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium">Email</Label>
                                    <Input value={session?.user.email ?? ""} disabled className="opacity-60" />
                                    <p className="text-[10px] text-muted-foreground">Email cannot be changed here</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium">Phone</Label>
                                        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" data-selectable />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium">Organization</Label>
                                        <Input value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="Optional" data-selectable />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Role:</span>
                                    <Badge variant="outline" className="text-xs">
                                        {profile?.role ? formatRole(profile.role) : "—"}
                                    </Badge>
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    {profileDirty && (
                                        <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                            <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                            Unsaved changes
                                        </span>
                                    )}
                                    <div className="ml-auto">
                                        <Button onClick={saveProfile} disabled={saving || !profileDirty} className="gap-1.5">
                                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                            Save Changes
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* ── Appearance Section ──────────────────────── */}
                    {activeSection === "appearance" && (
                        <Card className="page-header-gradient">
                            <CardContent className="pt-6 space-y-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="stat-icon-container bg-primary/10">
                                        <Palette className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-semibold">Appearance</h2>
                                        <p className="text-xs text-muted-foreground">Customize how the app looks and feels</p>
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <p className="text-sm font-medium mb-3">Theme</p>
                                    <div className="grid grid-cols-3 gap-3">
                                        {themeOptions.map(({ value, label, icon: Icon, desc }) => (
                                            <button
                                                key={value}
                                                onClick={() => setTheme(value)}
                                                className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${theme === value
                                                    ? "border-primary bg-primary/5 shadow-sm"
                                                    : "border-border hover:border-muted-foreground/30 hover:bg-muted/50"
                                                    }`}
                                            >
                                                {theme === value && (
                                                    <div className="absolute top-2 right-2">
                                                        <CheckCircle2 className="h-4 w-4 text-primary" />
                                                    </div>
                                                )}
                                                <div className={`flex items-center justify-center h-10 w-10 rounded-lg ${theme === value ? "bg-primary/10" : "bg-muted"}`}>
                                                    <Icon className={`h-5 w-5 ${theme === value ? "text-primary" : "text-muted-foreground"}`} />
                                                </div>
                                                <span className="text-sm font-medium">{label}</span>
                                                <span className="text-[10px] text-muted-foreground">{desc}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* ── Notifications Section ──────────────────── */}
                    {activeSection === "notifications" && (
                        <Card className="page-header-gradient">
                            <CardContent className="pt-6 space-y-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="stat-icon-container bg-primary/10">
                                        <Bell className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-semibold">Notifications</h2>
                                        <p className="text-xs text-muted-foreground">Control which alerts you receive</p>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-1">
                                    {NOTIFICATION_ITEMS.map((item) => {
                                        const Icon = item.icon;
                                        return (
                                            <div
                                                key={item.id}
                                                className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted/50"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`stat-icon-container ${notifPrefs[item.id] ? "bg-primary/10" : "bg-muted"}`}>
                                                        <Icon className={`h-4 w-4 ${notifPrefs[item.id] ? item.color : "text-muted-foreground"}`} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">{item.label}</p>
                                                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                                                    </div>
                                                </div>
                                                <Switch
                                                    checked={notifPrefs[item.id] ?? true}
                                                    onCheckedChange={(checked) => handleNotifToggle(item.id, checked)}
                                                    disabled={savingNotifs}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* ── Security Section ────────────────────────── */}
                    {activeSection === "security" && (
                        <Card className="page-header-gradient">
                            <CardContent className="pt-6 space-y-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="stat-icon-container bg-primary/10">
                                        <Shield className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-semibold">Security</h2>
                                        <p className="text-xs text-muted-foreground">Manage your account security settings</p>
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <p className="text-sm font-medium mb-3">Change Password</p>
                                    <div className="space-y-3 max-w-sm">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-medium">New Password</Label>
                                            <div className="relative">
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    placeholder="Min. 6 characters"
                                                    className="pr-9"
                                                    data-selectable
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                            {/* Password strength */}
                                            {newPassword && (
                                                <div className="space-y-1">
                                                    <div className="flex gap-1">
                                                        {Array.from({ length: 5 }).map((_, i) => (
                                                            <div
                                                                key={i}
                                                                className={`h-1 flex-1 rounded-full transition-colors ${i < passwordStrength.score ? passwordStrength.color : "bg-muted"
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        Strength: {passwordStrength.label}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-medium">Confirm New Password</Label>
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Repeat new password"
                                                data-selectable
                                            />
                                            {confirmPassword && (
                                                <p className={`text-[10px] flex items-center gap-1 ${passwordsMatch ? "text-green-600 dark:text-green-400" : "text-destructive"
                                                    }`}>
                                                    {passwordsMatch ? (
                                                        <><CheckCircle2 className="h-3 w-3" /> Passwords match</>
                                                    ) : (
                                                        "Passwords do not match"
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div className="flex justify-end">
                                    <Button onClick={handleChangePassword} disabled={changingPassword || !passwordsMatch || !newPassword} className="gap-1.5">
                                        {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                                        Update Password
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* ── About Section ───────────────────────────── */}
                    {activeSection === "about" && (
                        <Card className="page-header-gradient">
                            <CardContent className="pt-6 space-y-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="stat-icon-container bg-primary/10">
                                        <Info className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-semibold">About DisasterConnect</h2>
                                        <p className="text-xs text-muted-foreground">Application information and credits</p>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                                        <span className="text-sm text-muted-foreground">Version</span>
                                        <Badge variant="outline">{appVersion || "..."}</Badge>
                                    </div>
                                    <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                                        <span className="text-sm text-muted-foreground">Platform</span>
                                        <span className="text-sm font-medium capitalize">{platformInfo}</span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                                        <span className="text-sm text-muted-foreground">Built by</span>
                                        <span className="text-sm font-medium">Saqlain Abbas</span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                                        <span className="text-sm text-muted-foreground">Framework</span>
                                        <span className="text-sm font-medium">Tauri v2 + React</span>
                                    </div>
                                </div>

                                <Separator />

                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    DisasterConnect is a real-time disaster management and emergency response coordination platform.
                                    Built with Tauri, React, and Supabase for fast, secure, and reliable operations.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
