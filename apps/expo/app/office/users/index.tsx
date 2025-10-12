import {
  OfficeUsersList,
  officeUsersHeaderConfig,
} from '@app/core/features/office/office-users-list'
import { OfficePageHeader } from '@app/core/features/office/components/OfficePageHeader'
import { useRouter } from 'expo-router'
import { Stack } from 'expo-router'
import { useState } from 'react'

export default function OfficeUsersIndex() {
  const router = useRouter()
  const [search, setSearch] = useState('')

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <OfficePageHeader
              searchPlaceholder={officeUsersHeaderConfig.searchPlaceholder}
              searchValue={search}
              onSearchChange={setSearch}
              createButtonLabel={officeUsersHeaderConfig.createButtonLabel}
              onCreateClick={() => router.push(officeUsersHeaderConfig.createRoute)}
            />
          ),
        }}
      />
      <OfficeUsersList searchValue={search} />
    </>
  )
}
