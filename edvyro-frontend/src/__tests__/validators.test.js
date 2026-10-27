import { describe, expect, it } from "vitest";
import { validateApplication } from "../utils/validators";

describe("validateApplication", () => {
  it("reports required and malformed client-side fields", () => {
    const errors = validateApplication({
      fullName: "A",
      email: "not-an-email",
      phone: "123",
      internshipId: "",
      skills: "",
      coverLetter: "",
    });

    expect(errors).toMatchObject({
      fullName: expect.any(String),
      email: expect.any(String),
      phone: expect.any(String),
      internshipId: expect.any(String),
    });
  });

  it("accepts valid trimmed application details", () => {
    expect(
      validateApplication({
        fullName: "  Taylor Morgan ",
        email: " taylor@example.com ",
        phone: "+1 (415) 555-0134",
        internshipId: "frontend-developer",
        skills: "React",
        coverLetter: "Interested in this role.",
      })
    ).toEqual({});
  });

  it("enforces optional field length limits", () => {
    const errors = validateApplication({
      fullName: "Taylor Morgan",
      email: "taylor@example.com",
      phone: "+1 (415) 555-0134",
      internshipId: "frontend-developer",
      skills: "x".repeat(1001),
      coverLetter: "x".repeat(3001),
    });

    expect(errors.skills).toMatch(/1000/);
    expect(errors.coverLetter).toMatch(/3000/);
  });
});
