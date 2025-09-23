import { SessionContext } from '@app/core/provider/auth/AuthProvider.native'
import { useContext } from 'react'

export const useSessionContext = () => useContext(SessionContext)
