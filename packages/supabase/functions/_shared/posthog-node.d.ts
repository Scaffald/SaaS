declare module "npm:posthog-node" {
  interface PostHogOptions {
    host?: string;
    flushAt?: number;
    flushInterval?: number;
  }

  interface CapturePayload {
    distinctId: string;
    event: string;
    properties?: Record<string, unknown>;
  }

  export class PostHog {
    constructor(apiKey: string, options?: PostHogOptions);
    capture(payload: CapturePayload): void;
    flush(): Promise<void>;
  }
}

