import { useAuthStore } from "@/stores/auth-store";

interface RoleGateProps {
    allowedRoles: string[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export function RoleGate({ allowedRoles, children, fallback = null }: RoleGateProps) {
    const profile = useAuthStore((s) => s.profile);

    if (!profile || !allowedRoles.includes(profile.role)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
