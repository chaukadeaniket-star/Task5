import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { createApp } from "./app.js";

export function startServer() {
  const port = Number(process.env.PORT || 5000);
  const host = process.env.HOST ||
    (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");
  const allowedOrigins = (process.env.CORS_ORIGINS ||
    process.env.RENDER_EXTERNAL_URL ||
    "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const databasePath = resolve(
    process.env.DATABASE_PATH || "./data/edvyro.sqlite"
  );
  const app = createApp({ databasePath, allowedOrigins });

  app.server.listen(port, host, () => {
    console.log(`EdVyro API listening at http://${host}:${port}`);
  });

  app.server.on("error", (error) => {
    console.error("Unable to start the EdVyro API:", error);
    app.close();
    process.exitCode = 1;
  });

  const shutdown = () => {
    app.server.close(() => {
      app.close();
      process.exit(0);
    });
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
  return app;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  startServer();
}
