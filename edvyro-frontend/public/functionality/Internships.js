(() => {
    const grid = document.getElementById("internshipGrid");
    if (!grid) {
        return;
    }

    function getDomain(internship) {
        const text = `${internship.title} ${internship.skills.join(" ")}`.toLowerCase();
        if (/flutter|mobile|ios|android/.test(text)) return "mobile";
        if (/design|figma|wireframe|ui\/ux/.test(text)) return "design";
        if (/data science|machine learning|analytics/.test(text)) return "data";
        if (/backend|server|api/.test(text)) return "backend";
        if (/frontend|front-end|react|html|css|web/.test(text)) return "frontend";
        return "web";
    }

    function getLocation(location) {
        const normalized = location.toLowerCase();
        if (normalized.includes("remote")) return "remote";
        if (normalized.includes("hybrid")) return "hybrid";
        if (normalized.includes("bengaluru") || normalized.includes("bangalore")) return "bangalore";
        if (normalized.includes("hyderabad")) return "hyderabad";
        if (normalized.includes("mumbai")) return "mumbai";
        if (normalized.includes("pune")) return "pune";
        if (normalized.includes("cupertino")) return "cupertino";
        return "other";
    }

    function createCard(internship) {
        const card = document.createElement("article");
        const duration = String(internship.duration || "").match(/\d+/)?.[0] || "";
        const location = internship.location || "Location not specified";
        const searchable = [
            internship.title,
            internship.company,
            internship.description,
            ...internship.skills
        ].join(" ").toLowerCase();
        const normalizedLocation = getLocation(location);
        card.className = "internship-card";
        card.dataset.internshipId = internship.id;
        card.dataset.domain = getDomain(internship);
        card.dataset.location = normalizedLocation;
        card.dataset.duration = duration;
        card.dataset.type = normalizedLocation === "remote"
            ? "remote"
            : normalizedLocation === "hybrid"
                ? "hybrid"
                : "onsite";
        card.dataset.search = searchable;

        const companyRow = document.createElement("div");
        companyRow.className = "company-row";
        const bookmark = document.createElement("button");
        bookmark.className = "bookmark";
        bookmark.type = "button";
        bookmark.setAttribute("aria-label", `Save ${internship.title}`);
        bookmark.textContent = "♡";
        companyRow.appendChild(bookmark);

        const title = document.createElement("h3");
        title.textContent = internship.title;
        const company = document.createElement("p");
        company.className = "company";
        company.textContent = internship.company;

        const meta = document.createElement("div");
        meta.className = "job-meta";
        const locationLabel = document.createElement("span");
        locationLabel.textContent = `◉ ${location}`;
        const durationLabel = document.createElement("span");
        durationLabel.textContent = `◷ ${internship.duration}`;
        meta.append(locationLabel, durationLabel);

        const tags = document.createElement("div");
        tags.className = "tags";
        internship.skills.slice(0, 3).forEach((skill) => {
            const tag = document.createElement("span");
            tag.textContent = skill;
            tags.appendChild(tag);
        });

        const bottom = document.createElement("div");
        bottom.className = "card-bottom";
        const stipend = document.createElement("span");
        stipend.className = "stipend";
        stipend.textContent = "Stipend not specified";
        const apply = document.createElement("button");
        apply.className = "apply-btn";
        apply.type = "button";
        apply.textContent = "Apply Now →";
        bottom.append(stipend, apply);
        card.append(companyRow, title, company, meta, tags, bottom);
        return card;
    }

    grid.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }
        const card = target.closest(".internship-card");
        if (!card) {
            return;
        }
        if (target.closest(".bookmark")) {
            const bookmark = target.closest(".bookmark");
            bookmark.classList.toggle("saved");
            bookmark.textContent = bookmark.classList.contains("saved") ? "♥" : "♡";
            return;
        }
        if (target.closest(".apply-btn")) {
            const title = card.querySelector("h3").textContent.trim();
            const company = card.querySelector(".company").textContent.trim();
            const meta = card.querySelectorAll(".job-meta span");
            const skills = Array.from(card.querySelectorAll(".tags span"))
                .map((tag) => tag.textContent.trim())
                .join(", ");
            const query = new URLSearchParams({
                internshipId: card.dataset.internshipId,
                job: title,
                company,
                location: meta[0]?.textContent.replace("◉", "").trim() || "",
                duration: meta[1]?.textContent.replace("◷", "").trim() || "",
                skills
            });
            window.location.href = `Apply.html?${query}`;
        }
    });

    window.InternBoardApi.internships()
        .then((internships) => {
            grid.replaceChildren(...internships.map(createCard));
            window.setInternBoardCards(grid.querySelectorAll(".internship-card"));
            document.getElementById("resultCount").textContent =
                `${internships.length} live opportunities`;
            document.getElementById("noResults").style.display =
                internships.length ? "none" : "block";
        })
        .catch((error) => {
            console.error("Could not load internship listings.", error);
            grid.replaceChildren();
            const noResults = document.getElementById("noResults");
            noResults.style.display = "block";
            noResults.querySelector("h3").textContent = "Unable to load internships";
            noResults.querySelector("p").textContent = error.message;
        });
})();
