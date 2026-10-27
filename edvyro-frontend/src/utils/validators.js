const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PHONE_PATTERN = /^\+?[0-9\s()-]{7,20}$/;

const MAX_NAME_LENGTH = 100;

const MAX_EMAIL_LENGTH = 254;

const MAX_PHONE_LENGTH = 20;

const MAX_SKILLS_LENGTH = 1000;

const MAX_COVER_LETTER_LENGTH = 3000;

export function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateName(value) {
  const name = normalizeText(value);

  if (!name) {
    return "Full name is required.";
  }

  if (name.length < 2) {
    return "Full name must contain at least 2 characters.";
  }

  if (name.length > MAX_NAME_LENGTH) {
    return `Full name must not exceed ${MAX_NAME_LENGTH} characters.`;
  }

  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001F\u007F]/.test(name)) {
    return "Full name contains invalid characters.";
  }

  return "";
}

export function validateEmail(value) {
  const email = normalizeText(value);

  if (!email) {
    return "Email address is required.";
  }

  if (email.length > MAX_EMAIL_LENGTH) {
    return "Email address is too long.";
  }

  if (!EMAIL_PATTERN.test(email)) {
    return "Enter a valid email address.";
  }

  return "";
}

export function validatePhone(value) {
  const phone = normalizeText(value);

  if (!phone) {
    return "Phone number is required.";
  }

  if (phone.length > MAX_PHONE_LENGTH) {
    return "Phone number is too long.";
  }

  if (!PHONE_PATTERN.test(phone)) {
    return "Enter a valid phone number.";
  }

  const digits = phone.replace(/\D/g, "");

  if (digits.length < 7 || digits.length > 15) {
    return "Phone number must contain between 7 and 15 digits.";
  }

  return "";
}

export function validateInternshipId(value) {
  if (typeof value !== "string" && typeof value !== "number") {
    return "Please select an internship.";
  }

  const id = String(value).trim();

  if (!id || id.length > 100) {
    return "Please select a valid internship.";
  }

  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001F\u007F]/.test(id)) {
    return "The selected internship is invalid.";
  }

  return "";
}

export function validateSkills(value) {
  if (typeof value !== "string") {
    return "Skills must be provided as text.";
  }

  if (value.length > MAX_SKILLS_LENGTH) {
    return `Skills must not exceed ${MAX_SKILLS_LENGTH} characters.`;
  }

  return "";
}

export function validateCoverLetter(value) {
  if (typeof value !== "string") {
    return "Cover letter must be provided as text.";
  }

  if (value.length > MAX_COVER_LETTER_LENGTH) {
    return `Cover letter must not exceed ${MAX_COVER_LETTER_LENGTH} characters.`;
  }

  return "";
}

export function validateApplication(values) {
  const input =
    values && typeof values === "object" && !Array.isArray(values)
      ? values
      : {};

  const errors = {
    fullName: validateName(input.fullName),
    email: validateEmail(input.email),
    phone: validatePhone(input.phone),
    internshipId: validateInternshipId(input.internshipId),
    skills: validateSkills(input.skills ?? ""),
    coverLetter: validateCoverLetter(input.coverLetter ?? ""),
  };

  return Object.fromEntries(
    Object.entries(errors).filter(([, message]) => Boolean(message))
  );
}