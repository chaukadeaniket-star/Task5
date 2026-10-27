const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9\s()-]{7,20}$/;
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/;

export function validateApplication(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { errors: { form: "Provide application details as a JSON object." } };
  }

  const fullName =
    typeof input.fullName === "string" ? input.fullName.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const phone = typeof input.phone === "string" ? input.phone.trim() : "";
  const internshipId =
    typeof input.internshipId === "string" ? input.internshipId.trim() : "";
  const skills = typeof input.skills === "string" ? input.skills.trim() : "";
  const coverLetter =
    typeof input.coverLetter === "string" ? input.coverLetter.trim() : "";
  const errors = {};

  if (!fullName) {
    errors.fullName = "Full name is required.";
  } else if (fullName.length < 2 || fullName.length > 100) {
    errors.fullName = "Full name must contain 2 to 100 characters.";
  } else if (CONTROL_CHARACTERS.test(fullName)) {
    errors.fullName = "Full name contains invalid characters.";
  }

  if (!email) {
    errors.email = "Email address is required.";
  } else if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!phone) {
    errors.phone = "Phone number is required.";
  } else if (
    phone.length > 20 ||
    !PHONE_PATTERN.test(phone) ||
    phone.replace(/\D/g, "").length < 7 ||
    phone.replace(/\D/g, "").length > 15
  ) {
    errors.phone = "Enter a valid phone number.";
  }

  if (!internshipId || internshipId.length > 100) {
    errors.internshipId = "Please select a valid internship.";
  } else if (CONTROL_CHARACTERS.test(internshipId)) {
    errors.internshipId = "The selected internship is invalid.";
  }

  if (typeof input.skills !== "undefined" && typeof input.skills !== "string") {
    errors.skills = "Skills must be provided as text.";
  } else if (skills.length > 1000) {
    errors.skills = "Skills must not exceed 1000 characters.";
  }

  if (
    typeof input.coverLetter !== "undefined" &&
    typeof input.coverLetter !== "string"
  ) {
    errors.coverLetter = "Cover letter must be provided as text.";
  } else if (coverLetter.length > 3000) {
    errors.coverLetter = "Cover letter must not exceed 3000 characters.";
  }

  if (Object.keys(errors).length) {
    return { errors };
  }

  return {
    value: { fullName, email, phone, internshipId, skills, coverLetter },
  };
}
