import React, { createContext, useContext } from 'react'

type SafeAreaInsets = {
  top: number
  left: number
  bottom: number
  right: number
}

const SafeAreaContext = createContext<SafeAreaInsets>({
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
})

export const SafeAreaProvider = ({ children }: { children: React.ReactNode }) => {
  const insets = {
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  }

  return <SafeAreaContext.Provider value={insets}>{children}</SafeAreaContext.Provider>
}

export const useSafeAreaInsets = () => useContext(SafeAreaContext)
