import type { QueryClient } from '@tanstack/react-query'

export async function invalidateProfileQueries(
  queryClient: QueryClient
): Promise<void> {
  const tasks: Array<Promise<unknown>> = [
    // General profile
    queryClient.invalidateQueries({ queryKey: ['scaffald', 'profiles', 'general'] }),

    // Employment
    queryClient.invalidateQueries({ queryKey: ['scaffald', 'profiles', 'employment'] }),

    // Education
    queryClient.invalidateQueries({ queryKey: ['scaffald', 'profiles', 'education'] }),
    queryClient.invalidateQueries({ queryKey: ['scaffald', 'profiles', 'education-level'] }),

    // Experience
    queryClient.invalidateQueries({ queryKey: ['scaffald', 'profiles', 'experience'] }),
    queryClient.invalidateQueries({ queryKey: ['scaffald', 'profiles', 'experience-summary'] }),

    // Skills (multi-taxonomy)
    queryClient.invalidateQueries({ queryKey: ['scaffald', 'skills', 'multi-taxonomy'] }),
    queryClient.invalidateQueries({ queryKey: ['scaffald', 'skills', 'legacy'] }),

    // Certifications
    queryClient.invalidateQueries({ queryKey: ['scaffald', 'profiles', 'certifications'] }),
    queryClient.invalidateQueries({ queryKey: ['scaffald', 'profiles', 'certifications', 'top-level'] }),

    // User profile (comprehensive view)
    queryClient.invalidateQueries({ queryKey: ['scaffald', 'user-profiles'] }),
  ]

  await Promise.allSettled(tasks)
}
