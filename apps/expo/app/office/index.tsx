import { Redirect } from 'expo-router'
import { OFFICE_ROUTES } from '@app/core/constants/routes'

export default function OfficeIndex() {
  return <Redirect href={OFFICE_ROUTES.USERS.path} />
}
