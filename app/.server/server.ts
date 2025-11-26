import { createRequestHandler } from "@react-router/express";
import express from "express";
import * as build from "./build/server/index.js";

export default function createApp() {
  const app = express();

  // Serve static assets from build/client
  app.use(express.static("build/client", { maxAge: "1y" }));

  // Serve public directory
  app.use(express.static("public"));

  // Handle all requests with React Router
  app.all(
    "*",
    createRequestHandler({
      build,
      getLoadContext: (req, res) => ({}),
    })
  );

  return app;
}
