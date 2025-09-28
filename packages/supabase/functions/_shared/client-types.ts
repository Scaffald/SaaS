// Client-safe types that don't import server dependencies
export type ProfileGeneralInput = {
  first_name?: string
  last_name?: string
  avatar_url?: string
  email?: string
  phone?: string
  about?: string
}

export type ProfileGeneralOutput = {
  first_name: string
  last_name: string
  avatar_url: string
  email: string
  phone: string
  about: string
}

// tRPC router types for client consumption
export type AppRouter = {
  profile: {
    getGeneral: {
      input: void
      output: ProfileGeneralOutput
    }
    updateGeneral: {
      input: ProfileGeneralInput
      output: { success: boolean }
    }
  }
}
