import { ROUTES } from '@scf/core/constants/routes'
import { Redirect } from 'expo-router'

/** `/hiring` is a section; its one screen so far is the pipeline (#1312). */
export default function HiringIndexRoute() {
  return <Redirect href={ROUTES.HIRING.APPLICATIONS.path} />
}
