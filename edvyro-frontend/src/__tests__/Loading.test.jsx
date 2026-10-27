import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Loading from "../components/Loading";

describe("Loading", () => {
  it("shows the supplied message with status semantics", () => {
    render(<Loading message="Loading internships..." />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading internships..."
    );
    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-live",
      "polite"
    );
  });

  it("uses full-page styling when requested", () => {
    render(<Loading fullPage />);

    expect(screen.getByRole("status")).toHaveClass(
      "loading-container-full"
    );
    expect(screen.getByRole("status")).toHaveTextContent("Loading...");
  });
});