declare module '@supabase/supabase-js'

// Type declarations for Deno standard library URL imports
declare module 'https://deno.land/std@0.168.0/http/server.ts' {
  export interface ServeInit {
    port?: number
    hostname?: string
    onListen?: (params: { hostname: string; port: number }) => void
  }

  export function serve(
    handler: (request: Request) => Response | Promise<Response>,
    init?: ServeInit
  ): Promise<void>
}

declare module 'https://deno.land/std@0.223.0/http/server.ts' {
  export interface ServeInit {
    port?: number
    hostname?: string
    onListen?: (params: { hostname: string; port: number }) => void
  }

  export function serve(
    handler: (request: Request) => Response | Promise<Response>,
    init?: ServeInit
  ): Promise<void>
}

declare module 'https://esm.sh/@supabase/supabase-js@2.58.0' {
  export * from '@supabase/supabase-js'
}
