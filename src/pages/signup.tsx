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
import { AlertTriangle, Loader2, Shield, CheckCircle2 } from "lucide-react";

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
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value }));

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
            <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
                            <CheckCircle2 className="h-7 w-7 text-success" />
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
        <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                        <Shield className="h-7 w-7 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        Create Account
                    </CardTitle>
                    <CardDescription>
                        Join DisasterConnect to coordinate emergency response
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
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
                            <Label htmlFor="organization">Organization (Optional)</Label>
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
                            <Input
                                id="password"
                                type="password"
                                value={form.password}
                                onChange={update("password")}
                                placeholder="Min. 6 characters"
                                required
                                data-selectable
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={form.confirmPassword}
                                onChange={update("confirmPassword")}
                                placeholder="Repeat your password"
                                required
                                data-selectable
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Create Account
                        </Button>

                        <p className="text-center text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <Link to="/login" className="text-primary hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
