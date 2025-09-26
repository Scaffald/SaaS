import '../public/web.css'
import '@tamagui/core/reset.css'
import '@tamagui/font-inter/css/400.css'
import '@tamagui/font-inter/css/700.css'
import 'mapbox-gl/dist/mapbox-gl.css'
import { NextThemeProvider } from '@tamagui/next-theme'
import { Provider } from '@app/core/provider'
import { AuthProviderProps } from '@app/core/provider/auth'
import { api } from '@app/core/utils/api'
import { NextPage } from 'next'
import Head from 'next/head'
import 'raf/polyfill'
import { ReactElement, ReactNode } from 'react'
import type { SolitoAppProps } from 'solito'

if (process.env.NODE_ENV === 'production') {
  require('../public/tamagui.css')
}

export type NextPageWithLayout<P = object, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode
}

function AppWithTheme({
  Component,
  pageProps,
}: SolitoAppProps<{ initialSession: AuthProviderProps['initialSession'] }>) {
  // reference: https://nextjs.org/docs/pages/building-your-application/routing/pages-and-layouts
  const getLayout = Component.getLayout || ((page) => page)

  return (
    <Provider initialSession={pageProps.initialSession}>
      {getLayout(<Component {...pageProps} />)}
    </Provider>
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
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <NextThemeProvider>
        <AppWithTheme Component={Component} pageProps={pageProps} router={router} />
      </NextThemeProvider>
    </>
  )
}

export default api.withTRPC(MyApp)
