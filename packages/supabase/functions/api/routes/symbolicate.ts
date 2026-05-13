/**
 * Symbolicate stub
 * Expo/React Native dev clients sometimes send stack traces to the app's base URL + /symbolicate.
 * This API does not perform symbolication; we return a valid response so the client doesn't get 404/401.
 */

import { Hono } from "hono";

const app = new Hono();

// POST /symbolicate - Metro/Expo often POST stack traces here
app.post("/", (c) => {
  return c.json(
    {
      stack: [],
      codeFrame: null,
      message:
        "Symbolication is not provided by this server. Use Metro bundler or a dedicated symbolication service.",
    },
    501,
    {
      "X-Symbolicate-Status": "not-supported",
    },
  );
});

// GET /symbolicate - some clients use GET
app.get("/", (c) => {
  return c.json(
    {
      stack: [],
      codeFrame: null,
      message: "Symbolication is not provided by this server.",
    },
    501,
    {
      "X-Symbolicate-Status": "not-supported",
    },
  );
});

export default app;
