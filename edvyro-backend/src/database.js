import { mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const internshipSeedPath = new URL("../data/internships.json", import.meta.url);
const internshipSeed = JSON.parse(readFileSync(internshipSeedPath, "utf8"));

export function createDatabase(databasePath = ":memory:") {
  const resolvedPath =
    databasePath === ":memory:" ? databasePath : resolve(databasePath);

  if (resolvedPath !== ":memory:") {
    mkdirSync(dirname(resolvedPath), { recursive: true });
  }

  const database = new DatabaseSync(resolvedPath);
  database.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS internships (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      location TEXT NOT NULL,
      type TEXT NOT NULL,
      duration TEXT NOT NULL,
      description TEXT NOT NULL,
      skills TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      salt TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT REFERENCES users(id),
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      internship_id TEXT NOT NULL REFERENCES internships(id),
      skills TEXT NOT NULL DEFAULT '',
      cover_letter TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  const applicationColumns = database
    .prepare("PRAGMA table_info(applications)")
    .all()
    .map((column) => column.name);
  if (!applicationColumns.includes("user_id")) {
    database.exec("ALTER TABLE applications ADD COLUMN user_id TEXT REFERENCES users(id)");
  }

  const insertInternship = database.prepare(`
    INSERT OR IGNORE INTO internships
      (id, title, company, location, type, duration, description, skills)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const internship of internshipSeed) {
    insertInternship.run(
      internship.id,
      internship.title,
      internship.company,
      internship.location,
      internship.type,
      internship.duration,
      internship.description,
      JSON.stringify(internship.skills)
    );
  }

  return database;
}

export function getInternships(database, filters = {}) {
  const conditions = [];
  const values = [];

  if (filters.q) {
    conditions.push("(title LIKE ? OR company LIKE ? OR description LIKE ?)");
    const search = `%${filters.q}%`;
    values.push(search, search, search);
  }

  if (filters.location) {
    conditions.push("location = ?");
    values.push(filters.location);
  }

  if (filters.type) {
    conditions.push("type = ?");
    values.push(filters.type);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = database
    .prepare(
      `SELECT id, title, company, location, type, duration, description, skills
       FROM internships ${where} ORDER BY title`
    )
    .all(...values);

  return rows.map((row) => ({
    ...row,
    skills: JSON.parse(row.skills),
  }));
}

export function createApplication(database, application, userId) {
  const result = database
    .prepare(`
      INSERT INTO applications
        (user_id, full_name, email, phone, internship_id, skills, cover_letter)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      userId,
      application.fullName,
      application.email,
      application.phone,
      application.internshipId,
      application.skills,
      application.coverLetter
    );

  return Number(result.lastInsertRowid);
}

export function getApplications(database, userId) {
  return database
    .prepare(`
      SELECT applications.id, applications.full_name AS fullName,
        applications.email, applications.phone,
        applications.internship_id AS internshipId,
        applications.skills, applications.cover_letter AS coverLetter,
        applications.created_at AS appliedAt,
        internships.title AS job, internships.company,
        internships.location, internships.duration
      FROM applications
      JOIN internships ON internships.id = applications.internship_id
      WHERE applications.user_id = ?
      ORDER BY applications.created_at DESC, applications.id DESC
    `)
    .all(userId);
}

export function internshipExists(database, id) {
  return Boolean(
    database.prepare("SELECT 1 FROM internships WHERE id = ?").get(id)
  );
}

export function getUserByEmail(database, email) {
  return database
    .prepare("SELECT id, name, email, salt, password_hash AS passwordHash FROM users WHERE email = ?")
    .get(email);
}

export function createUser(database, user) {
  database
    .prepare("INSERT INTO users (id, name, email, salt, password_hash) VALUES (?, ?, ?, ?, ?)")
    .run(user.id, user.name, user.email, user.salt, user.passwordHash);
  return { id: user.id, name: user.name, email: user.email };
}

export function createSession(database, tokenHash, userId, expiresAt) {
  database
    .prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
    .run(tokenHash, userId, expiresAt);
}

export function getUserForSession(database, tokenHash, now = Date.now()) {
  const session = database
    .prepare(`
      SELECT users.id, users.name, users.email, sessions.expires_at AS expiresAt
      FROM sessions JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = ?
    `)
    .get(tokenHash);
  if (!session) {
    return null;
  }
  if (session.expiresAt <= now) {
    revokeSession(database, tokenHash);
    return null;
  }
  return { id: session.id, name: session.name, email: session.email };
}

export function revokeSession(database, tokenHash) {
  database.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
}
