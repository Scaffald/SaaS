// Minimal ambient declaration for Deno globals used in shared code.
declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
  [key: string]: unknown;
};
