import { createAuthClient } from "better-auth/client";
import type { AuthProvider } from "@refinedev/core";

export const authClient = createAuthClient({
    baseURL: (import.meta.env.VITE_API_URL || "http://localhost:4001") + "/auth",
});

export const authProvider: AuthProvider = {
    login: async ({ providerName, email, password }) => {
        if (providerName) {
            await authClient.signIn.social({
                provider: providerName as any,
                callbackURL: window.location.origin,
            });
            return { success: true };
        }
        
        if (email && password) {
            const { error } = await authClient.signIn.email({
                email,
                password,
            });
            if (error) {
                return {
                    success: false,
                    error: {
                        name: "Login Error",
                        message: error.message || "Invalid email or password",
                    },
                };
            }
            return { success: true, redirectTo: "/" };
        }

        return { success: false };
    },
    logout: async () => {
        await authClient.signOut();
        return { success: true, redirectTo: "/login" };
    },
    check: async () => {
        const { data: session } = await authClient.getSession();
        if (session) {
            return { authenticated: true };
        }
        return {
            authenticated: false,
            redirectTo: "/login",
        };
    },
    onError: async (error) => {
        if (error.status === 401 || error.status === 403) {
            return { logout: true };
        }
        return { error };
    },
    getPermissions: async () => null,
    getIdentity: async () => {
        const { data: session } = await authClient.getSession();
        if (session) {
            return {
                id: session.user.id,
                name: session.user.name,
                avatar: session.user.image,
            };
        }
        return null;
    },
};
