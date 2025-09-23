import { config } from '@app/ui'
import NextDocument, {
  type DocumentContext,
  type DocumentInitialProps,
  Head,
  Html,
  Main,
  NextScript,
} from 'next/document'
import { Children, cloneElement } from 'react'
import type { ReactElement } from 'react'
import { AppRegistry } from 'react-native'

export default class Document extends NextDocument {
  static async getInitialProps(ctx: DocumentContext): Promise<DocumentInitialProps> {
    AppRegistry.registerComponent('Main', () => Main)
    const page = await ctx.renderPage()

    const { getStyleElement } = (AppRegistry as any).getApplication('Main') as unknown as {
      getStyleElement: () => ReactElement
    }

    /**
     * Note: be sure to keep tamagui styles after react-native-web styles like it is here!
     * So Tamagui styles can override the react-native-web styles.
     */
    const reactNativeStyles = Children.toArray(getStyleElement()).map((element, index) =>
      cloneElement(element as ReactElement, { key: `react-native-web-${index}` })
    )

    const styles = [
      ...reactNativeStyles,
      <style
        key="tamagui-inline-css"
        dangerouslySetInnerHTML={{
          __html: config.getCSS(),
        }}
      />,
    ]

    return { ...page, styles }
  }

  render() {
    return (
      <Html>
        <Head>
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <link rel="stylesheet" href="/tamagui.css" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
