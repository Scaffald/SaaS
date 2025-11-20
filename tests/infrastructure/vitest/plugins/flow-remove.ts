import { extname } from 'node:path'

import flowRemoveTypes from 'flow-remove-types'
import type { Config } from 'vitest'

type Matcher = RegExp | ((path: string) => boolean)
type VitePlugin = NonNullable<Config['plugins']>[number]

export interface FlowRemoveTypesPluginOptions {
  include?: Matcher[]
  exclude?: Matcher[]
}

const defaultIncludeMatchers: Matcher[] = [
  /node_modules\/react-native\//,
  /node_modules\/@react-native\//,
  /node_modules\/react-native-web-lite\//,
]

const defaultExcludeMatchers: Matcher[] = [/node_modules\/react-native\/dist\//]

const supportedExtensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.cjs', '.mjs'])

export function flowRemoveTypesPlugin({
  include = defaultIncludeMatchers,
  exclude = defaultExcludeMatchers,
}: FlowRemoveTypesPluginOptions = {}): VitePlugin {
  return {
    name: 'flow-remove-types',
    enforce: 'pre',
    transform(code: string, id: string) {
      if (process.env.VITEST !== 'true') {
        return null
      }

      const [filepath] = id.split('?')
      if (!filepath || !supportedExtensions.has(extname(filepath))) {
        return null
      }

      if (!shouldTransform(filepath, include, exclude)) {
        return null
      }

      const result = flowRemoveTypes(code, { all: true })
      return {
        code: result.code,
        map: result.map ?? null,
      }
    },
  }
}

function shouldTransform(path: string, include: Matcher[], exclude: Matcher[]): boolean {
  if (!include.some((matcher) => matches(matcher, path))) {
    return false
  }

  return !exclude.some((matcher) => matches(matcher, path))
}

function matches(matcher: Matcher, path: string): boolean {
  return typeof matcher === 'function' ? matcher(path) : matcher.test(path)
}
