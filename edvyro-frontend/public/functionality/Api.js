(() => {
    const apiBase = "/api/v1";
    const tokenKey = "internboard.sessionToken";
    const profileKey = "internboard.studentProfile";

    function getToken() {
        return window.localStorage.getItem(tokenKey);
    }

    function saveSession(session) {
        window.localStorage.setItem(tokenKey, session.token);
        window.localStorage.setItem(profileKey, JSON.stringify({
            name: session.user.name,
            email: session.user.email
        }));
    }

    function clearSession() {
        window.localStorage.removeItem(tokenKey);
        window.localStorage.removeItem(profileKey);
    }

    async function request(path, options = {}) {
        const headers = new Headers(options.headers || {});
        headers.set("Accept", "application/json");
        if (options.body && !(options.body instanceof Blob)) {
            headers.set("Content-Type", "application/json");
        }
        const token = getToken();
        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }

        let response;
        try {
            response = await fetch(`${apiBase}${path}`, { ...options, headers });
        } catch {
            throw new Error("Unable to reach the server. Check your connection and try again.");
        }

        if (response.status === 204) {
            return null;
        }
        let payload = {};
        try {
            payload = await response.json();
        } catch {
            if (response.ok) {
                throw new Error("The server returned an unreadable response.");
            }
        }
        if (!response.ok) {
            const apiError = new Error(payload.error || "The request could not be completed.");
            apiError.fields = payload.fields || {};
            apiError.status = response.status;
            throw apiError;
        }
        return payload;
    }

    window.InternBoardApi = {
        tokenKey,
        getToken,
        clearSession,
        async register(account) {
            const session = await request("/auth/register", {
                method: "POST",
                body: JSON.stringify(account)
            });
            saveSession(session);
            return session.user;
        },
        async login(credentials) {
            const session = await request("/auth/login", {
                method: "POST",
                body: JSON.stringify(credentials)
            });
            saveSession(session);
            return session.user;
        },
        async session() {
            if (!getToken()) {
                return null;
            }
            try {
                const result = await request("/auth/session");
                window.localStorage.setItem(profileKey, JSON.stringify(result.user));
                return result.user;
            } catch (error) {
                if (error.status === 401) {
                    clearSession();
                }
                throw error;
            }
        },
        async logout() {
            try {
                await request("/auth/logout", { method: "POST" });
            } finally {
                clearSession();
            }
        },
        async internships() {
            const result = await request("/internships");
            return result.internships;
        },
        async submitApplication(application) {
            return request("/applications", {
                method: "POST",
                body: JSON.stringify(application)
            });
        },
        async applications() {
            const result = await request("/applications");
            return result.applications;
        }
    };
})();
