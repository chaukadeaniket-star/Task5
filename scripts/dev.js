import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const frontendRoot = resolve(projectRoot, "edvyro-frontend");
const services = [
  {
    name: "api",
    cwd: resolve(projectRoot, "edvyro-backend"),
    args: ["src/server.js"],
  },
  {
    name: "frontend",
    cwd: frontendRoot,
    args: [
      resolve(frontendRoot, "node_modules", "vite", "bin", "vite.js"),
      "--host",
      "127.0.0.1",
    ],
  },
];

const children = services.map(({ name, cwd, args }) => {
  const child = spawn(process.execPath, args, {
    cwd,
    env: process.env,
    stdio: "inherit",
    windowsHide: false,
  });

  child.on("error", (error) => {
    console.error(`Unable to start ${name}:`, error);
    process.exitCode = 1;
    stopChildren();
  });

  child.on("exit", (code, signal) => {
    if (code !== 0 && code !== null) {
      console.error(`${name} exited with code ${code}.`);
      process.exitCode = code;
      stopChildren();
    } else if (signal && !shuttingDown) {
      console.error(`${name} stopped after ${signal}.`);
      stopChildren();
    }
  });

  return child;
});

let shuttingDown = false;

function stopChildren() {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }
}

process.once("SIGINT", () => {
  stopChildren();
});
process.once("SIGTERM", () => {
  stopChildren();
});

console.log("Starting EdVyro API and frontend.");
console.log("Frontend: http://127.0.0.1:5173");
console.log("API:      http://127.0.0.1:5000/api/v1/health");
