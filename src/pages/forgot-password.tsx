import { useState } from "react";
import { Link } from "react-router-dom";
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
import { AlertTriangle, Loader2, Mail, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
    const resetPassword = useAuthStore((s) => s.resetPassword);
    const isLoading = useAuthStore((s) => s.isLoading);

    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const { error: err } = await resetPassword(email);
        if (err) {
            setError(err);
        } else {
            setSent(true);
        }
    };

    if (sent) {
        return (
            <div className="auth-bg flex min-h-screen w-full items-center justify-center p-4">
                <Card className="w-full max-w-md border shadow-lg">
                    <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 ring-1 ring-success/20">
                            <CheckCircle2 className="h-8 w-8 text-success" />
                        </div>
                        <h2 className="text-xl font-semibold">Check Your Email</h2>
                        <p className="text-center text-sm text-muted-foreground">
                            We&apos;ve sent a password reset link to <strong>{email}</strong>
                        </p>
                        <Link to="/login">
                            <Button variant="outline">Back to Login</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="auth-bg flex min-h-screen w-full items-center justify-center p-4">
            <Card className="w-full max-w-md border shadow-lg">
                <CardHeader className="text-center space-y-3 pb-2">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                        <Mail className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold tracking-tight">
                            Forgot Password
                        </CardTitle>
                        <CardDescription className="mt-1.5">
                            Enter your email to receive a reset link
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

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Send Reset Link
                        </Button>

                        <p className="text-center text-sm text-muted-foreground">
                            Remember your password?{" "}
                            <Link to="/login" className="text-primary font-medium hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
