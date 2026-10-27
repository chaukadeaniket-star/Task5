(() => {
    function categoryFor(internship) {
        const searchable = `${internship.title} ${internship.skills.join(" ")}`.toLowerCase();
        if (/design|figma|wireframe/.test(searchable)) return "design";
        if (/data science|analytics|machine learning/.test(searchable)) return "data";
        if (/marketing/.test(searchable)) return "marketing";
        return "development";
    }

    window.InternBoardApi.internships()
        .then((internships) => {
            const companies = new Set(internships.map((internship) => internship.company));
            document.getElementById("listingCount").textContent = String(internships.length);
            document.getElementById("companyCount").textContent = String(companies.size);

            document.querySelectorAll(".internship-result").forEach((result, index) => {
                const internship = internships[index];
                if (!internship) {
                    result.hidden = true;
                    return;
                }
                result.hidden = false;
                result.dataset.category = categoryFor(internship);
                result.dataset.search = [
                    internship.title,
                    internship.company,
                    internship.description,
                    ...internship.skills
                ].join(" ").toLowerCase();
                const logo = result.querySelector(".company-logo");
                logo.className = "company-logo";
                logo.textContent =
                    internship.company.slice(0, 1).toUpperCase();
                result.querySelector(".result-info h3").textContent = internship.title;
                result.querySelector(".result-info p").textContent = internship.company;
                const meta = result.querySelectorAll(".result-meta span");
                meta[0].textContent = `${internship.location}`;
                meta[1].textContent = internship.duration;
            });

            document.querySelectorAll(".mini-internship").forEach((item, index) => {
                const internship = internships[index];
                if (!internship) {
                    item.hidden = true;
                    return;
                }
                item.hidden = false;
                item.querySelector("strong").textContent = internship.title;
                item.querySelector("small").textContent = internship.company;
                item.querySelector(".mini-meta").textContent =
                    `${internship.location} · ${internship.duration}`;
                const logo = item.querySelector(".mini-company");
                logo.className = "mini-company";
                logo.textContent =
                    internship.company.slice(0, 1).toUpperCase();
            });
        })
        .catch((error) => {
            console.error("Could not load homepage internship data.", error);
            document.getElementById("listingCount").textContent = "—";
            document.getElementById("companyCount").textContent = "—";
        });
})();
