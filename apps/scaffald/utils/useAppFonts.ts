import { Roboto_400Regular } from '@expo-google-fonts/roboto/400Regular'
import { Roboto_500Medium } from '@expo-google-fonts/roboto/500Medium'
import { Roboto_700Bold } from '@expo-google-fonts/roboto/700Bold'
import { RobotoSerif_400Regular } from '@expo-google-fonts/roboto-serif/400Regular'
import { useFonts } from 'expo-font'

/**
 * Native font loading.
 *
 * Imports are per-weight on purpose: the package barrels `require()` every
 * weight, which pulled 36 TTFs (7.2 MB) into the bundle for the four we use.
 *
 * See useAppFonts.web.ts — web serves self-hosted WOFF2 via CSS instead.
 */
export function useAppFonts(): [boolean] {
  const [loaded] = useFonts({
    Roboto: Roboto_400Regular,
    'Roboto-Medium': Roboto_500Medium,
    'Roboto-Bold': Roboto_700Bold,
    'Roboto Serif': RobotoSerif_400Regular,
  })
  return [loaded]
}
