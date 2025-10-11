import { Redirect } from 'expo-router'
import { ROUTES } from '@app/core/constants/routes'

export default function OfficeIndex() {
  return <Redirect href={ROUTES.OFFICE_APPLICATIONS.path} />
}
