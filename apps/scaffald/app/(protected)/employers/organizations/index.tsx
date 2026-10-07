/**
 * Redirect: /employers/organizations → My Organizations (/employers/org).
 * It pointed at `/org`, which does not exist (#1030).
 */

import { type Href, useRouter } from 'expo-router'
import { useEffect } from 'react'
import { RouteBuilder } from '@scf/core/constants/routes'

export default function OrganizationsRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace(RouteBuilder.orgIndex() as Href)
  }, [router])
  return null
}
