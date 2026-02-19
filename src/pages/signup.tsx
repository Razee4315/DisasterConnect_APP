import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, Loader2, CheckCircle2, Eye, EyeOff, Shield, Check, X } from "lucide-react";
import { AppLogo } from "@/components/app-logo";

function getPasswordStrength(pw: string) {
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score; // 0-5
}

const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong", "Excellent"];
const STRENGTH_COLORS = [
    "bg-muted",
    "bg-destructive",
    "bg-orange-500",
    "bg-warning",
    "bg-success",
    "bg-success",
];

export default function SignupPage() {
    const navigate = useNavigate();
    const signUp = useAuthStore((s) => s.signUp);
    const isLoading = useAuthStore((s) => s.isLoading);

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        organization: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value }));

    const strength = useMemo(
        () => getPasswordStrength(form.password),
        [form.password]
    );
    const passwordsMatch =
        form.confirmPassword.length > 0 &&
        form.password === form.confirmPassword;
    const passwordsMismatch =
        form.confirmPassword.length > 0 &&
        form.password !== form.confirmPassword;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (form.password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        const { error: err } = await signUp({
            email: form.email,
            password: form.password,
            firstName: form.firstName,
            lastName: form.lastName,
            organization: form.organization,
        });

        if (err) {
            setError(err);
        } else {
            setSuccess(true);
            setTimeout(() => navigate("/login"), 2000);
        }
    };

    if (success) {
        return (
            <div className="auth-bg flex min-h-screen w-full items-center justify-center p-4">
                <Card className="w-full max-w-md border shadow-lg">
                    <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 ring-1 ring-success/20">
                            <CheckCircle2 className="h-8 w-8 text-success" />
                        </div>
                        <h2 className="text-xl font-semibold">Account Created</h2>
                        <p className="text-center text-sm text-muted-foreground">
                            Your account has been created. Redirecting to login...
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="auth-bg flex min-h-screen w-full items-center justify-center p-4">
            <div className="w-full max-w-md space-y-6">
                <Card className="border shadow-lg">
                    <CardHeader className="text-center space-y-3 pb-2">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                            <AppLogo className="h-9 w-9" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-bold tracking-tight">
                                Create Account
                            </CardTitle>
                            <CardDescription className="mt-1.5">
                                Join DisasterConnect to coordinate emergency response
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive border border-destructive/20">
                                    <AlertTriangle className="h-4 w-4 shrink-0" />
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input
                                        id="firstName"
                                        value={form.firstName}
                                        onChange={update("firstName")}
                                        placeholder="John"
                                        required
                                        autoFocus
                                        data-selectable
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input
                                        id="lastName"
                                        value={form.lastName}
                                        onChange={update("lastName")}
                                        placeholder="Doe"
                                        required
                                        data-selectable
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={form.email}
                                    onChange={update("email")}
                                    placeholder="you@organization.com"
                                    required
                                    data-selectable
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="organization">
                                    Organization{" "}
                                    <span className="text-muted-foreground font-normal">(optional)</span>
                                </Label>
                                <Input
                                    id="organization"
                                    value={form.organization}
                                    onChange={update("organization")}
                                    placeholder="Red Cross, FEMA, etc."
                                    data-selectable
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={form.password}
                                        onChange={update("password")}
                                        placeholder="Min. 6 characters"
                                        required
                                        data-selectable
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                {/* Password strength */}
                                {form.password.length > 0 && (
                                    <div className="space-y-1.5">
                                        <div className="flex gap-1">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`h-1 flex-1 rounded-full transition-colors ${
                                                        i < strength
                                                            ? STRENGTH_COLORS[strength]
                                                            : "bg-muted"
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-[11px] text-muted-foreground">
                                            {STRENGTH_LABELS[strength]}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirm ? "text" : "password"}
                                        value={form.confirmPassword}
                                        onChange={update("confirmPassword")}
                                        placeholder="Repeat your password"
                                        required
                                        data-selectable
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        tabIndex={-1}
                                    >
                                        {showConfirm ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                {passwordsMatch && (
                                    <p className="flex items-center gap-1 text-[11px] text-success">
                                        <Check className="h-3 w-3" /> Passwords match
                                    </p>
                                )}
                                {passwordsMismatch && (
                                    <p className="flex items-center gap-1 text-[11px] text-destructive">
                                        <X className="h-3 w-3" /> Passwords don't match
                                    </p>
                                )}
                            </div>

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                Create Account
                            </Button>

                            <p className="text-center text-sm text-muted-foreground">
                                Already have an account?{" "}
                                <Link to="/login" className="text-primary font-medium hover:underline">
                                    Sign in
                                </Link>
                            </p>
                        </form>
                    </CardContent>
                </Card>

                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/60">
                    <Shield className="h-3 w-3" />
                    <span>End-to-end encrypted</span>
                </div>
            </div>
        </div>
    );
}
