import { TRPCError } from '@trpc/server'

import { createTRPCRouter, protectedProcedure } from '../trpc'

type TimeOfDay = 'morning' | 'afternoon' | 'night'

const getTimeOfDay = (date: Date = new Date()): TimeOfDay => {
  const hour = date.getHours()

  if (hour < 4 || hour >= 18) {
    return 'night'
  }

  if (hour < 12) {
    return 'morning'
  }

  return 'afternoon'
}

export const greetingRouter = createTRPCRouter({
  greet: protectedProcedure.query(async ({ ctx: { supabase, user } }) => {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single()

    if (profileError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Unable to load profile for greeting.',
        cause: profileError,
      })
    }

    const name = profile?.name?.trim()
    const timeOfDay = getTimeOfDay()

    return `Good ${timeOfDay}${name ? `, ${name}!` : '!'}`
  }),
})
