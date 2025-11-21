import { createContext, type ReactNode, useContext } from 'react'

import { type ResumeWizardController, useResumeWizard } from '../hooks/useResumeWizard'

interface ResumeWizardProviderProps {
  resumeId: string
  children: ReactNode
}

const ResumeWizardContext = createContext<ResumeWizardController | null>(null)

export function ResumeWizardProvider({ resumeId, children }: ResumeWizardProviderProps) {
  const controller = useResumeWizard(resumeId)

  return <ResumeWizardContext.Provider value={controller}>{children}</ResumeWizardContext.Provider>
}

export function useResumeWizardContext() {
  return useContext(ResumeWizardContext)
}
