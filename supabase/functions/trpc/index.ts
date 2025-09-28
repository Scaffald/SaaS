import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { fetchRequestHandler } from 'https://esm.sh/@trpc/server@10.45.0/adapters/fetch'
import { appRouter, createTRPCContext } from '../../packages/api/src/index.ts'

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/trpc',
    req,
    router: appRouter,
    createContext: createTRPCContext,
  })

serve(handler)
