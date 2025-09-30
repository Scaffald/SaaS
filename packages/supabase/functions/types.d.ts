// Deno runtime type definitions for Supabase Edge Functions

declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined
    }
    serve: (handler: (req: Request) => Response | Promise<Response>) => void
  }

  // Global functions available in Deno runtime
  function atob(data: string): string
  function btoa(data: string): string
}

export {}
