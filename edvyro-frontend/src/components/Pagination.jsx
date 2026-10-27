function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}) {
  if (
    !Number.isInteger(currentPage) ||
    !Number.isInteger(totalPages) ||
    totalPages <= 1 ||
    currentPage < 1 ||
    currentPage > totalPages ||
    typeof onPageChange !== "function"
  ) {
    return null;
  }

  function handlePageChange(page) {
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }

    onPageChange(page);
  }

  return (
    <nav
      className="pagination"
      aria-label="Internship pages"
    >
      <button
        type="button"
        className="pagination-button"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </button>

      <span
        className="pagination-status"
        aria-live="polite"
      >
        Page {currentPage} of {totalPages}
      </span>

      <button
        type="button"
        className="pagination-button"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </nav>
  );
}

export default Pagination;
