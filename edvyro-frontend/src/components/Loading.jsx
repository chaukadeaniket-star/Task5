function Loading({
  message = "Loading...",
  fullPage = false,
}) {
  const containerClass = fullPage
    ? "loading-container loading-container-full"
    : "loading-container";

  return (
    <div
      className={containerClass}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span
        className="loading-spinner"
        aria-hidden="true"
      />

      <span className="loading-message">
        {message}
      </span>
    </div>
  );
}

export default Loading;