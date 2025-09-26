import { ContentWrapper, ContentSection, KVTable, SizableText } from '@app/ui'
import { useUser } from '@app/core/utils/useUser'
import { Link } from 'solito/link'

export const GeneralSettingsScreen = () => {
  const { user, profile } = useUser()

  return (
    <ContentWrapper title="General">
      <ContentSection title="Profile Data">
        <KVTable.Row>
          <KVTable.Key>
            <SizableText fow="900">Name</SizableText>
          </KVTable.Key>
          <KVTable.Value gap="$4">
            <SizableText>{profile?.name}</SizableText>
            <Link href="/profile/edit">
              <SizableText textDecorationLine="underline">Change</SizableText>
            </Link>
          </KVTable.Value>
        </KVTable.Row>
      </ContentSection>

      <ContentSection title="Account Data">
        <KVTable.Row>
          <KVTable.Key>
            <SizableText fow="900">Email</SizableText>
          </KVTable.Key>
          <KVTable.Value gap="$4">
            <SizableText>{user?.email}</SizableText>
            <Link href="/settings/change-email">
              <SizableText textDecorationLine="underline">Change</SizableText>
            </Link>
          </KVTable.Value>
        </KVTable.Row>

        <KVTable.Row>
          <KVTable.Key>
            <SizableText fow="900">User ID</SizableText>
          </KVTable.Key>
          <KVTable.Value>
            <SizableText>{user?.id}</SizableText>
          </KVTable.Value>
        </KVTable.Row>
      </ContentSection>
    </ContentWrapper>
  )
}
