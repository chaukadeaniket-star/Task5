import { useMemo, useState } from "react";
import { useInternships } from "../hooks/useInternships";
import InternshipCard from "../components/InternshipCard";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";

const ITEMS_PER_PAGE = 6;

function Internships() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const {
    internships,
    loading,
    error,
    reload,
  } = useInternships();

  const filteredInternships = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return internships;
    }

    return internships.filter((internship) => {
      const searchableFields = [
        internship.title,
        internship.company,
        internship.location,
        internship.type,
        internship.description,
        ...(Array.isArray(internship.skills)
          ? internship.skills
          : []),
      ];

      return searchableFields.some(
        (field) =>
          typeof field === "string" &&
          field.toLowerCase().includes(query)
      );
    });
  }, [internships, search]);

  const totalPages = Math.ceil(
    filteredInternships.length / ITEMS_PER_PAGE
  );

  const safeCurrentPage = Math.min(
    currentPage,
    Math.max(totalPages, 1)
  );

  const visibleInternships = filteredInternships.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  );

  function handleSearchChange(value) {
    setSearch(value);
    setCurrentPage(1);
  }

  function handlePageChange(page) {
    setCurrentPage(page);

    document
      .getElementById("internship-results")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  return (
    <main className="internships-page">
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">
            FIND YOUR NEXT OPPORTUNITY
          </span>

          <h1>Explore internships</h1>

          <p>
            Discover opportunities to develop practical skills,
            gain experience, and move closer to your career goals.
          </p>
        </div>
      </section>

      <section
        className="internships-section container"
        aria-labelledby="internships-heading"
      >
        <div className="internships-toolbar">
          <div>
            <h2 id="internships-heading">
              Available opportunities
            </h2>

            <p className="internships-subtitle">
              Explore the opportunities available to you.
            </p>
          </div>

          <SearchBar
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by role, company, or skill..."
          />
        </div>

        {loading && (
          <Loading message="Loading internship opportunities..." />
        )}

        {!loading && error && (
          <ErrorMessage
            title="Unable to load internships"
            message={error}
            onRetry={reload}
            retryLabel="Try again"
          />
        )}

        {!loading && !error && (
          <>
            <div
              id="internship-results"
              className="internship-results"
              aria-live="polite"
              aria-busy={loading}
            >
              <div className="results-summary">
                <p>
                  {filteredInternships.length}{" "}
                  {filteredInternships.length === 1
                    ? "opportunity"
                    : "opportunities"}{" "}
                  found
                </p>
              </div>

              {visibleInternships.length > 0 ? (
                <div className="internship-grid">
                  {visibleInternships.map((internship) => (
                    <InternshipCard
                      key={
                        internship._id ??
                        internship.id
                      }
                      internship={internship}
                    />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <span
                    className="empty-state-icon"
                    aria-hidden="true"
                  >
                    ⌕
                  </span>

                  <h3>No internships found</h3>

                  <p>
                    {search
                      ? "Try another search term or clear your search."
                      : "There are no internship opportunities available right now."}
                  </p>

                  {search && (
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => handleSearchChange("")}
                    >
                      Clear search
                    </button>
                  )}
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <Pagination
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default Internships;