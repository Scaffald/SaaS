'use client'

import '../public/web.css'
import 'mapbox-gl/dist/mapbox-gl.css'
import '@tamagui/core/reset.css'
import '@tamagui/font-inter/css/400.css'
import '@tamagui/font-inter/css/700.css'
import { type ColorScheme, NextThemeProvider, useRootTheme } from '@tamagui/next-theme'
import { Provider } from '@app/provider'
import type { AuthProviderProps } from '@app/provider/auth'
import { api } from '@app/utils/api'
import type { NextPage } from 'next'
import Head from 'next/head'
import 'raf/polyfill'
import type { ReactElement, ReactNode } from 'react'
import type { SolitoAppProps } from 'solito'

if (process.env.NODE_ENV === 'production') {
  require('../public/tamagui.css')
}

export type NextPageWithLayout<P = object, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode
}

// Create a separate component that uses the hook inside the provider context
function AppWithTheme({
  Component,
  pageProps,
  router,
}: SolitoAppProps<{ initialSession: AuthProviderProps['initialSession'] }>) {
  const [, setTheme] = useRootTheme()
  const getLayout = Component.getLayout || ((page) => page)

  return (
    <NextThemeProvider
      onChangeTheme={(next) => {
        setTheme(next as ColorScheme)
      }}
    >
      <Provider initialSession={pageProps.initialSession}>
        {getLayout(<Component {...pageProps} />)}
      </Provider>
    </NextThemeProvider>
  )
}

function MyApp({
  Component,
  pageProps,
  router,
}: SolitoAppProps<{ initialSession: AuthProviderProps['initialSession'] }>) {
  return (
    <>
      <Head>
        <title>Tamagui Universal App</title>
        <meta name="description" content="Tamagui Universal Starter" />
        <link rel="icon" href="/favicon.svg" />
        <link rel="stylesheet" href="/tamagui.css" />
      </Head>
      <AppWithTheme Component={Component} pageProps={pageProps} router={router} />
    </>
  )
}

export default api.withTRPC(MyApp)
