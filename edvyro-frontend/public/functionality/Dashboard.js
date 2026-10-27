(() => {
    const applicationsList = document.getElementById("applicationsList");
    const dashboardNote = document.querySelector(".demo-note");
    const count = document.getElementById("applicationsCount");

    function createApplicationRow(application) {
        const row = document.createElement("article");
        row.className = "application-row panel";

        const initials = document.createElement("div");
        initials.className = "company-initials initials-purple";
        initials.setAttribute("aria-hidden", "true");
        initials.textContent = (application.company || "I").slice(0, 1).toUpperCase();

        const info = document.createElement("div");
        info.className = "application-info";
        const title = document.createElement("h3");
        title.textContent = application.job || "Internship opportunity";
        const company = document.createElement("p");
        company.textContent = [
            application.company,
            application.location,
            application.duration
        ].filter(Boolean).join(" · ");
        info.append(title, company);

        const status = document.createElement("span");
        status.className = "status-badge status-submitted";
        status.textContent = "Submitted";

        const dateLabel = document.createElement("span");
        dateLabel.className = "applied-date";
        const appliedAt = new Date(application.appliedAt);
        dateLabel.textContent = Number.isNaN(appliedAt.getTime())
            ? "Date unavailable"
            : `Applied ${appliedAt.toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric"
            })}`;

        const details = document.createElement("button");
        details.className = "document-button";
        details.type = "button";
        details.textContent = "Job specifications";
        details.dataset.job = application.job || "Internship opportunity";
        details.dataset.company = application.company || "Company not specified";
        details.dataset.location = application.location || "Not specified";
        details.dataset.duration = application.duration || "Not specified";
        details.dataset.skills = application.skills || "Not specified";
        details.addEventListener("click", () => {
            const content = [
                "INTERNBOARD - JOB SPECIFICATIONS",
                "",
                `Position: ${details.dataset.job}`,
                `Company: ${details.dataset.company}`,
                `Location: ${details.dataset.location}`,
                `Duration: ${details.dataset.duration}`,
                `Skills: ${details.dataset.skills}`
            ].join("\n");
            const file = new Blob([content], { type: "text/plain;charset=utf-8" });
            const url = URL.createObjectURL(file);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${details.dataset.company}-${details.dataset.job}-specifications.txt`
                .replace(/[^a-z0-9.-]+/gi, "-");
            link.click();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        });

        row.append(initials, info, status, dateLabel, details);
        return row;
    }

    window.InternBoardApi.applications()
        .then((applications) => {
            applicationsList.replaceChildren();
            count.textContent = String(applications.length);
            if (!applications.length) {
                const emptyState = document.createElement("p");
                emptyState.className = "empty-applications panel";
                emptyState.textContent = "You have not submitted any applications yet. Browse internships to find your next opportunity.";
                applicationsList.appendChild(emptyState);
            } else {
                applications.forEach((application) => {
                    applicationsList.appendChild(createApplicationRow(application));
                });
            }
            dashboardNote.textContent = "Your account and applications are saved securely on the InternBoard server.";
        })
        .catch((error) => {
            console.error("Could not load your applications.", error);
            count.textContent = "—";
            applicationsList.replaceChildren();
            const errorMessage = document.createElement("p");
            errorMessage.className = "empty-applications panel";
            errorMessage.textContent = error.message;
            applicationsList.appendChild(errorMessage);
            dashboardNote.textContent = "Your application history could not be loaded. Please try again later.";
        });
})();
