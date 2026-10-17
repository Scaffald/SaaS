import { ROUTES } from '@scf/core/constants/routes'
import { Redirect } from 'expo-router'

/**
 * Notification preferences are owned by Settings' Notifications tab. This
 * route rendered the same section again under Home's folder tabs (#1212); it
 * stays as a redirect so old links and bookmarks still land somewhere.
 */
export default function NotificationsSettingsRedirect() {
  return (
    <Redirect
      href={{ pathname: ROUTES.DASHBOARD.SETTINGS.path, params: { section: 'notifications' } }}
    />
  )
}
