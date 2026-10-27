(() => {
    const main = document.querySelector("main");
    if (main) {
        main.id ||= "main-content";
        if (!main.hasAttribute("tabindex")) {
            main.tabIndex = -1;
        }

        const skipLink = document.createElement("a");
        skipLink.className = "mobile-skip-link";
        skipLink.href = `#${main.id}`;
        skipLink.textContent = "Skip to main content";
        document.body.prepend(skipLink);
    }

    const navigation = document.querySelector(".nav-links");
    const actions = document.querySelector(".nav-actions");
    if (!navigation || !actions) {
        return;
    }

    navigation.id ||= "primary-navigation";
    navigation.setAttribute("aria-label", "Primary navigation");

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "mobile-navigation-toggle";
    toggle.textContent = "Menu";
    toggle.setAttribute("aria-controls", navigation.id);
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation menu");
    actions.prepend(toggle);

    const loginLink = document.createElement("a");
    loginLink.className = "mobile-auth-link";
    loginLink.href = "login.html";
    loginLink.textContent = "Student login";
    navigation.append(loginLink);

    const activeLink = navigation.querySelector(".active");
    activeLink?.setAttribute("aria-current", "page");

    function setMenuOpen(isOpen) {
        navigation.classList.toggle("is-open", isOpen);
        toggle.setAttribute("aria-expanded", String(isOpen));
        toggle.setAttribute(
            "aria-label",
            isOpen ? "Close navigation menu" : "Open navigation menu"
        );
        if (isOpen) {
            navigation.querySelector("a")?.focus();
        }
    }

    toggle.addEventListener("click", () => {
        setMenuOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    navigation.addEventListener("click", (event) => {
        if (event.target.closest("a")) {
            setMenuOpen(false);
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
            setMenuOpen(false);
            toggle.focus();
        }
    });

    document.addEventListener("click", (event) => {
        if (
            toggle.getAttribute("aria-expanded") === "true" &&
            !navigation.contains(event.target) &&
            !toggle.contains(event.target)
        ) {
            setMenuOpen(false);
        }
    });
})();
