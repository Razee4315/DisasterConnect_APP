import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { AlertTriangle, Loader2, KeyRound, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const updatePassword = useAuthStore((s) => s.updatePassword);

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);
        const { error: err } = await updatePassword(password);
        setIsLoading(false);

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
                        <h2 className="text-xl font-semibold">Password Updated</h2>
                        <p className="text-center text-sm text-muted-foreground">
                            Your password has been reset. Redirecting to login...
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
                        <KeyRound className="h-7 w-7 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        Reset Password
                    </CardTitle>
                    <CardDescription>Enter your new password</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min. 6 characters"
                                required
                                autoFocus
                                data-selectable
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Repeat new password"
                                required
                                data-selectable
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Reset Password
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
