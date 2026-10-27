(() => {
    const returnToKey = "internboard.returnTo";
    const protectedPages = new Set([
        "Apply.html",
        "student-dashboard.html",
        "student_profile.html"
    ]);
    const currentPage = window.location.pathname.split("/").pop();

    function resolvePostLoginDestination(requestedDestination) {
        if (!requestedDestination) {
            return "student_profile.html";
        }
        try {
            const target = new URL(requestedDestination, window.location.href);
            const pagesDirectory = window.location.pathname.slice(
                0,
                window.location.pathname.lastIndexOf("/") + 1
            );
            const allowedPages = new Set([
                "About.html",
                "Apply.html",
                "Browse.html",
                "Contact.html",
                "How_It_Works.html",
                "home.html",
                "index.html",
                "student-dashboard.html",
                "student_profile.html"
            ]);
            if (!target.pathname.startsWith(pagesDirectory)) {
                if (
                    target.origin === window.location.origin &&
                    target.pathname === "/current.html"
                ) {
                    return `../current.html${target.search}${target.hash}`;
                }
                return "student_profile.html";
            }
            const pageName = target.pathname.slice(pagesDirectory.length);
            return allowedPages.has(pageName)
                ? `${pageName}${target.search}${target.hash}`
                : "student_profile.html";
        } catch (error) {
            console.error("Could not validate the requested InternBoard page.", error);
            return "student_profile.html";
        }
    }

    window.InternBoardSession = {
        getPostLoginDestination() {
            const requestedDestination =
                new URLSearchParams(window.location.search).get("returnTo") ||
                window.localStorage.getItem(returnToKey);
            window.localStorage.removeItem(returnToKey);
            return resolvePostLoginDestination(requestedDestination);
        }
    };

    function setAccountControls(user) {
        const originalControls = document.querySelectorAll(
            ".login-btn, .started-btn, .get-started-btn, .mobile-auth-link"
        );
        originalControls.forEach((control) => {
            control.hidden = Boolean(user);
        });

        const host = document.querySelector(".nav-actions") ||
            document.querySelector(".header-inner") ||
            document.querySelector(".nav-container") ||
            document.querySelector(".login-page");
        if (!host) {
            return;
        }

        let controls = host.querySelector(".internboard-account-controls");
        if (!controls) {
            controls = document.createElement("div");
            controls.className = "internboard-account-controls";
            controls.innerHTML = `
                <style>
                    .internboard-account-controls {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                        margin-left: 12px;
                        color: #28734c;
                        font: 700 12px/1.3 Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                    }
                    .internboard-account-name {
                        max-width: 180px;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }
                    .internboard-account-link,
                    .internboard-account-logout {
                        display: inline-flex;
                        min-height: 36px;
                        align-items: center;
                        justify-content: center;
                        padding: 0 11px;
                        border: 1px solid #e0e5ef;
                        border-radius: 9px;
                        background: #fff;
                        color: #58647b;
                        cursor: pointer;
                        font: 700 12px/1.2 Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                        text-decoration: none;
                        white-space: nowrap;
                    }
                    .internboard-account-link:hover,
                    .internboard-account-logout:hover {
                        border-color: #c8c1ff;
                        color: #5546f7;
                    }
                    @media (max-width: 650px) {
                        .internboard-account-controls { gap: 6px; margin-left: 6px; }
                        .internboard-account-name { max-width: 95px; }
                        .internboard-account-link,
                        .internboard-account-logout { min-height: 32px; padding: 0 8px; font-size: 11px; }
                    }
                </style>`;
            host.appendChild(controls);
        }

        controls.querySelectorAll(".internboard-account-name, .internboard-account-link, .internboard-account-logout")
            .forEach((element) => element.remove());
        if (!user) {
            return;
        }

        const name = document.createElement("span");
        name.className = "internboard-account-name";
        name.textContent = `Signed in as ${user.name}`;

        const profileLink = document.createElement("a");
        profileLink.className = "internboard-account-link";
        profileLink.href = "student_profile.html";
        profileLink.textContent = "Student portal";

        const logoutButton = document.createElement("button");
        logoutButton.className = "internboard-account-logout";
        logoutButton.type = "button";
        logoutButton.textContent = "Log out";
        logoutButton.addEventListener("click", async () => {
            logoutButton.disabled = true;
            try {
                await window.InternBoardApi.logout();
                if (protectedPages.has(currentPage)) {
                    window.location.href = "home.html";
                    return;
                }
                setAccountControls(null);
            } catch (error) {
                console.error("Could not log out of InternBoard.", error);
                window.alert(error.message);
                logoutButton.disabled = false;
            }
        });

        controls.append(name, profileLink, logoutButton);
    }

    function redirectToLogin() {
        const requestedPage =
            `${window.location.pathname}${window.location.search}${window.location.hash}`;
        try {
            window.localStorage.setItem(returnToKey, requestedPage);
        } catch (error) {
            console.error("Could not save the requested InternBoard page.", error);
        }
        window.location.replace(`login.html?returnTo=${encodeURIComponent(requestedPage)}`);
    }

    async function initializeSession() {
        let user = null;
        try {
            user = await window.InternBoardApi.session();
        } catch (error) {
            if (error.status !== 401) {
                const status = document.querySelector(".form-message");
                if (status && (currentPage === "login.html" || currentPage === "register.html")) {
                    status.textContent = error.message;
                } else {
                    console.error("Could not verify the InternBoard session.", error);
                }
            }
        }

        setAccountControls(user);
        if (!user && protectedPages.has(currentPage)) {
            redirectToLogin();
            return;
        }
        if (user && (currentPage === "login.html" || currentPage === "register.html")) {
            window.location.replace(window.InternBoardSession.getPostLoginDestination());
        }
    }

    const returnTo = new URLSearchParams(window.location.search).get("returnTo");
    if (returnTo) {
        document.querySelectorAll('a[href="register.html"], a[href="login.html"]')
            .forEach((link) => {
                link.href = `${link.getAttribute("href")}?returnTo=${encodeURIComponent(returnTo)}`;
            });
    }
    initializeSession();
})();
