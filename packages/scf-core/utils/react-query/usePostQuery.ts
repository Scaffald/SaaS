import { useQuery } from '@tanstack/react-query'

import { supabase } from '../supabase/client'

function usePostQuery() {
  // Using supabase directly from import

  const queryFn = async () => {
    // Type instantiation is excessively deep - posts table may not exist in database types yet
    const result = await (
      supabase as unknown as {
        schema: (schema: string) => {
          from: (table: string) => {
            select: (columns: string) => {
              order: (
                column: string,
                options: { ascending: boolean }
              ) => {
                limit: (count: number) => Promise<{ data: unknown[] | null }>
              }
            }
          }
        }
      }
    )
      .schema('core')
      .from('posts')
      .select('*')
      .order('created_at', {
        ascending: false,
      })
      .limit(4)

    return result.data || []
  }

  return useQuery({
    queryKey: ['posts'],
    queryFn,
  })
}

export default usePostQuery
