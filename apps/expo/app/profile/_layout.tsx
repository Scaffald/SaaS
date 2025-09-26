import { Stack } from 'expo-router'

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen
        name="edit"
        options={{
          title: 'Edit Profile',
        }}
      />
      <Stack.Screen
        name="overview"
        options={{
          title: 'Profile Overview',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="basic-info"
        options={{
          title: 'Basic Information',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="work-skills"
        options={{
          title: 'Work & Skills',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="travel-compliance"
        options={{
          title: 'Travel & Compliance',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="contact-availability"
        options={{
          title: 'Contact & Availability',
          headerShown: true,
        }}
      />
    </Stack>
  )
}
