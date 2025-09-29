import React from 'react'
import { Checklist, DashboardWidget } from '@app/ui'
import { useProfileCompletion } from './useProfileCompletion'
import type { ChecklistItem } from '@app/ui'

export interface ProfileCompletionWidgetProps {
  onNavigate: (route: string) => void
}

/**
 * ProfileCompletionWidget - Dashboard widget for profile completion tracking
 *
 * @param onNavigate - Navigation handler for routing to profile sections
 * @returns JSX element
 */
export const ProfileCompletionWidget = ({ onNavigate }: ProfileCompletionWidgetProps) => {
  const { completionData, isLoading } = useProfileCompletion()

  const handleItemPress = (item: ChecklistItem) => {
    if (item.actionRoute) {
      onNavigate(item.actionRoute)
    }
  }

  if (!completionData) {
    return (
      <DashboardWidget>
        <Checklist
          title="Complete your profile"
          subtitle="By completing all the details you have a higher chance of being seen by recruiters."
          items={[]}
          completionPercentage={0}
          isLoading={isLoading}
        />
      </DashboardWidget>
    )
  }

  return (
    <DashboardWidget>
      <Checklist
        title="Complete your profile"
        subtitle="By completing all the details you have a higher chance of being seen by recruiters."
        items={completionData.items}
        completionPercentage={completionData.completionPercentage}
        onItemPress={handleItemPress}
        isLoading={isLoading}
      />
    </DashboardWidget>
  )
}
