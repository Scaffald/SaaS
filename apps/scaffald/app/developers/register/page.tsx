/**
 * Developer App Registration Page
 * Self-service app registration page
 */

import { AppRegistrationForm } from '@scf/core/features/oauth/components/AppRegistrationForm'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function DeveloperRegisterPage() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <AppRegistrationForm />
    </SafeAreaView>
  )
}
