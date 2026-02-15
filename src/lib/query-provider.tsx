import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

interface Props {
    children: React.ReactNode;
}

export function QueryProvider({ children }: Props) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 1000 * 60, // 1 minute
                        gcTime: 1000 * 60 * 5, // 5 minutes
                        retry: 1,
                        refetchOnWindowFocus: false, // Desktop app — no tab switching
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
