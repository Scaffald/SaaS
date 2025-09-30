import { registerRootComponent } from 'expo'
import { ExpoRoot } from 'expo-router'
import 'react-native-url-polyfill/auto'
import React, { Fragment } from 'react'

//NOTE: do not remove. this is a workaround for build to work with expo v51.0.0
React.AnimatedComponent = ({ children }) => <Fragment>{children}</Fragment>

// Must be exported or Fast Refresh won't update the context
export function App() {
  const ctx = require.context('./app')
  return <ExpoRoot context={ctx} />
}

registerRootComponent(App)
