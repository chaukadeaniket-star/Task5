import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ErrorMessage from "../components/ErrorMessage";

describe("ErrorMessage", () => {
  it("announces the error title and message", () => {
    render(
      <ErrorMessage
        title="Internships unavailable"
        message="The API could not be reached."
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Internships unavailable"
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "The API could not be reached."
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("provides a retry action when a handler is supplied", () => {
    const onRetry = vi.fn();
    render(
      <ErrorMessage
        message="Request failed."
        onRetry={onRetry}
        retryLabel="Retry request"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Retry request" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});