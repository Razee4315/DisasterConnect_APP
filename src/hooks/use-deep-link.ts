import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

/**
 * Listens for deep link URLs from the Tauri backend.
 * When the user clicks a Supabase email link (verify / reset password),
 * the OS routes `disasterconnect://auth/callback#access_token=...` to this app.
 * This hook extracts the tokens and sets the Supabase session.
 */
export function useDeepLink() {
    const navigate = useNavigate();

    useEffect(() => {
        async function handleDeepLink(url: string) {
            console.log("[deep-link] Received URL:", url);

            // The token fragment comes after # in the URL
            // e.g. disasterconnect://auth/callback#access_token=xxx&refresh_token=yyy&type=signup
            const hashIndex = url.indexOf("#");
            if (hashIndex === -1) {
                console.warn("[deep-link] No fragment found in URL");
                return;
            }

            const fragment = url.substring(hashIndex + 1);
            const params = new URLSearchParams(fragment);

            const accessToken = params.get("access_token");
            const refreshToken = params.get("refresh_token");
            const type = params.get("type");

            console.log("[deep-link] Type:", type, "Has tokens:", !!accessToken && !!refreshToken);

            if (accessToken && refreshToken) {
                const { error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });

                if (error) {
                    console.error("[deep-link] Failed to set session:", error.message);
                } else {
                    console.log("[deep-link] Session set, navigating for type:", type);
                    if (type === "recovery") {
                        navigate("/reset-password");
                    } else {
                        navigate("/dashboard");
                    }
                }
            }
        }

        // Handle deep links dispatched from Tauri backend
        function onDeepLink(event: Event) {
            const url = (event as CustomEvent).detail;
            if (typeof url === "string") {
                handleDeepLink(url);
            }
        }

        window.addEventListener("deep-link", onDeepLink);

        // Also check if a deep link was received before this hook mounted
        if (typeof (window as any).__DEEP_LINK_URL__ === "string") {
            handleDeepLink((window as any).__DEEP_LINK_URL__);
            delete (window as any).__DEEP_LINK_URL__;
        }

        return () => {
            window.removeEventListener("deep-link", onDeepLink);
        };
    }, [navigate]);
}
