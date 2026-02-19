import { useState } from "react";
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
import { AlertTriangle, Loader2, Eye, EyeOff, Shield } from "lucide-react";
import { AppLogo } from "@/components/app-logo";

export default function LoginPage() {
    const navigate = useNavigate();
    const signIn = useAuthStore((s) => s.signIn);
    const isLoading = useAuthStore((s) => s.isLoading);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const { error: err } = await signIn(email, password);
        if (err) {
            setError(err);
        } else {
            navigate("/");
        }
    };

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
                                Disaster<span className="text-primary">Connect</span>
                            </CardTitle>
                            <CardDescription className="mt-1.5">
                                Sign in to your account to continue
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive border border-destructive/20">
                                    <AlertTriangle className="h-4 w-4 shrink-0" />
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@organization.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoFocus
                                    data-selectable
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    <Link
                                        to="/forgot-password"
                                        className="text-xs text-primary hover:underline"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
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
                            </div>

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                Sign In
                            </Button>

                            <p className="text-center text-sm text-muted-foreground">
                                Don&apos;t have an account?{" "}
                                <Link to="/signup" className="text-primary font-medium hover:underline">
                                    Create account
                                </Link>
                            </p>
                        </form>
                    </CardContent>
                </Card>

                {/* Trust indicator */}
                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/60">
                    <Shield className="h-3 w-3" />
                    <span>End-to-end encrypted</span>
                </div>
            </div>
        </div>
    );
}
