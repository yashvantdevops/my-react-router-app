import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createRequestHandler } from "@react-router/express";
import * as build from "./build/server/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// Serve static files from build/client
app.use(express.static(join(__dirname, "build/client"), { maxAge: "1h" }));

// Create request handler for React Router
const handler = createRequestHandler({
  build,
  mode: process.env.NODE_ENV || "production",
});

// Handle all requests with React Router
app.all("*", handler);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
