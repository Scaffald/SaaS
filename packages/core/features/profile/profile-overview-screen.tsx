import { ContentWrapper, ContentSection, KVTable, SizableText } from '@app/ui'
import { useUser } from '@app/core/utils/useUser'
import { Link } from 'solito/link'

export const ProfileOverviewScreen = () => {
  const { user, profile } = useUser()

  return (
    <ContentWrapper title="Profile">
      <ContentSection title="Profile Overview">
        <KVTable.Row>
          <KVTable.Key>
            <SizableText fow="900">Profile Photo Test</SizableText>
          </KVTable.Key>
          <KVTable.Value gap="$4">
            <SizableText>Upload a profile photo to personalize your account</SizableText>
            <Link href="/profile/edit">
              <SizableText textDecorationLine="underline">Upload</SizableText>
            </Link>
          </KVTable.Value>
        </KVTable.Row>
      </ContentSection>

      <ContentSection title="Basic Information">
        <KVTable.Row>
          <KVTable.Key>
            <SizableText fow="900">Name</SizableText>
          </KVTable.Key>
          <KVTable.Value gap="$4">
            <SizableText>{profile?.name || 'Not set'}</SizableText>
            <Link href="/profile/edit">
              <SizableText textDecorationLine="underline">Edit</SizableText>
            </Link>
          </KVTable.Value>
        </KVTable.Row>

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
      </ContentSection>

      <ContentSection title="Work & Skills">
        <KVTable.Row>
          <KVTable.Key>
            <SizableText fow="900">Experience</SizableText>
          </KVTable.Key>
          <KVTable.Value gap="$4">
            <SizableText>{profile?.headline || 'Add your professional headline'}</SizableText>
            <Link href="/profile/edit">
              <SizableText textDecorationLine="underline">Edit</SizableText>
            </Link>
          </KVTable.Value>
        </KVTable.Row>
      </ContentSection>
    </ContentWrapper>
  )
}
