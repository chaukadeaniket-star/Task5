function ErrorMessage({
  title = "Something went wrong",
  message = "We couldn't complete your request. Please try again.",
  onRetry,
  retryLabel = "Try again",
}) {
  return (
    <section
      className="error-message"
      role="alert"
      aria-live="assertive"
    >
      <div
        className="error-message-icon"
        aria-hidden="true"
      >
        !
      </div>

      <div className="error-message-content">
        <h2 className="error-message-title">
          {title}
        </h2>

        <p className="error-message-description">
          {message}
        </p>

        {typeof onRetry === "function" && (
          <button
            type="button"
            className="button button-danger"
            onClick={onRetry}
          >
            {retryLabel}
          </button>
        )}
      </div>
    </section>
  );
}

export default ErrorMessage;