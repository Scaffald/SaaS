import { SelfScheduleScreen } from '@scf/core/features/office/scheduling/SelfScheduleScreen'
import { useLocalSearchParams } from 'expo-router'
import { View } from 'react-native'

/**
 * Candidate interview self-scheduling, reached via a scheduling-link token
 * (delivered by notification/email). Auth-gated by the (protected) layout;
 * the API verifies the linked application belongs to the signed-in user.
 */
export default function ScheduleByTokenRoute() {
  const { token } = useLocalSearchParams<{ token: string }>()
  return (
    <View style={{ flex: 1 }}>
      <SelfScheduleScreen token={token} />
    </View>
  )
}
