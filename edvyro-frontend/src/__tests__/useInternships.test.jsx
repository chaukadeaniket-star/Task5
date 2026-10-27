import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getInternships } from "../services/api";
import { useInternships } from "../hooks/useInternships";

vi.mock("../services/api", () => ({
  getInternships: vi.fn(),
}));

describe("useInternships", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads internship data from the API", async () => {
    const internships = [{ id: "role-1", title: "Frontend Intern" }];
    getInternships.mockResolvedValue({ internships });

    const { result } = renderHook(() => useInternships({ location: "Remote" }));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(getInternships).toHaveBeenCalledWith(
      { location: "Remote" },
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
    expect(result.current.internships).toEqual(internships);
    expect(result.current.error).toBeNull();
  });

  it("shows an API failure and retries on demand", async () => {
    getInternships
      .mockRejectedValueOnce(new Error("Unable to connect to the server."))
      .mockResolvedValueOnce({ internships: [{ id: "role-2" }] });

    const { result } = renderHook(() => useInternships());

    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.internships).toEqual([]);

    act(() => result.current.reload());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(getInternships).toHaveBeenCalledTimes(2);
    expect(result.current.internships).toEqual([{ id: "role-2" }]);
    expect(result.current.error).toBeNull();
  });

  it("rejects unexpected response formats instead of failing silently", async () => {
    getInternships.mockResolvedValue({ unexpected: [] });
    const { result } = renderHook(() => useInternships());

    await waitFor(() =>
      expect(result.current.error).toMatch(/unexpected internship format/)
    );
    expect(result.current.internships).toEqual([]);
  });
});
