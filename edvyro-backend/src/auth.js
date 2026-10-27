import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import {
  createSession,
  createUser,
  getUserByEmail,
  getUserForSession,
  revokeSession,
} from "./database.js";

const scrypt = promisify(scryptCallback);
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DUMMY_SALT = "a4f31c7d92e8b605";

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

function tokenHash(token) {
  return createHash("sha256").update(token).digest("hex");
}

function validateCredentials(input, registration = false) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { errors: { form: "Provide account details as a JSON object." } };
  }

  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  const errors = {};

  if (registration && (name.length < 2 || name.length > 100)) {
    errors.name = "Name must contain 2 to 100 characters.";
  }
  if (registration && /[\u0000-\u001F\u007F]/.test(name)) {
    errors.name = "Name contains invalid characters.";
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address.";
  }
  if (password.length < 8 || password.length > 128) {
    errors.password = "Password must contain 8 to 128 characters.";
  }
  if (Object.keys(errors).length) {
    return { errors };
  }
  return { value: { name, email, password } };
}

function createLoginSession(database, user) {
  const token = randomBytes(32).toString("hex");
  createSession(database, tokenHash(token), user.id, Date.now() + SESSION_TTL_MS);
  return { token, user: publicUser(user) };
}

export async function registerAccount(database, input) {
  const validation = validateCredentials(input, true);
  if (validation.errors) {
    return validation;
  }

  const { name, email, password } = validation.value;
  if (getUserByEmail(database, email)) {
    return { errors: { email: "An account with this email already exists." }, status: 409 };
  }

  const salt = randomBytes(16).toString("hex");
  const passwordHash = (await scrypt(password, salt, 64)).toString("hex");
  const user = {
    id: randomBytes(16).toString("hex"),
    name,
    email,
    salt,
    passwordHash,
  };

  try {
    createUser(database, user);
  } catch (error) {
    if (error.code === "ERR_SQLITE_CONSTRAINT_UNIQUE") {
      return { errors: { email: "An account with this email already exists." }, status: 409 };
    }
    throw error;
  }
  return { value: createLoginSession(database, user) };
}

export async function loginAccount(database, input) {
  const validation = validateCredentials(input);
  if (validation.errors) {
    return validation;
  }

  const { email, password } = validation.value;
  const user = getUserByEmail(database, email);
  const candidateHash = await scrypt(password, user?.salt || DUMMY_SALT, 64);
  if (!user) {
    timingSafeEqual(candidateHash, Buffer.alloc(candidateHash.length));
    return { value: null };
  }
  const savedHash = Buffer.from(user.passwordHash, "hex");
  if (savedHash.length !== candidateHash.length || !timingSafeEqual(savedHash, candidateHash)) {
    return { value: null };
  }
  return { value: createLoginSession(database, user) };
}

export function getAuthenticatedUser(database, token) {
  if (!/^[a-f0-9]{64}$/i.test(token || "")) {
    return null;
  }
  return getUserForSession(database, tokenHash(token));
}

export function endSession(database, token) {
  if (/^[a-f0-9]{64}$/i.test(token || "")) {
    revokeSession(database, tokenHash(token));
  }
}

export function validateAccountInput(input, registration = false) {
  return validateCredentials(input, registration);
}
