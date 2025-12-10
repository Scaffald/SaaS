/**
 * tRPC HTTP Handler
 * REQ-286: Create tRPC Router Structure for Forsured
 * TASK-4: Create Root Router and API Handler Integration
 *
 * Provides HTTP handler for tRPC requests.
 * Works with Vite dev server, Express, or serverless environments.
 */

import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from './root';
import { createContext } from './context';

/**
 * tRPC fetch handler
 *
 * Handles incoming HTTP requests and routes them to the appropriate tRPC procedure.
 * Supports both GET (for queries) and POST (for mutations) methods.
 *
 * @param request - Web API Request object
 * @returns Web API Response object
 */
export async function handleTRPCRequest(request: Request): Promise<Response> {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: request,
    router: appRouter,
    createContext: createContext,
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            console.error(`❌ tRPC failed on ${path ?? '<no-path>'}:`, error.message);
          }
        : undefined,
  });
}

/**
 * Express/Connect middleware adapter
 *
 * Converts Express request/response to Web API Request/Response.
 * Use this with Express or Vite's Connect middleware.
 *
 * @example
 * ```ts
 * // Express
 * app.use('/api/trpc', trpcMiddleware);
 *
 * // Vite
 * server.middlewares.use('/api/trpc', trpcMiddleware);
 * ```
 */
export async function trpcMiddleware(req: any, res: any) {
  // Convert Express request to Web API Request
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const headers = new Headers();
  Object.entries(req.headers).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => headers.append(key, v));
    } else if (value) {
      headers.set(key, value as string);
    }
  });

  let body: BodyInit | null = null;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    // Read body from Express request
    body = JSON.stringify(req.body);
  }

  const request = new Request(url.toString(), {
    method: req.method,
    headers,
    body,
  });

  // Handle request
  const response = await handleTRPCRequest(request);

  // Convert Web API Response to Express response
  res.status(response.status);
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  const responseBody = await response.text();
  res.send(responseBody);
}
