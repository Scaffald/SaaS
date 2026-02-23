import type { ChecklistItemData } from '@scaffald/ui'
import { Checklist, DashboardWidget } from '@scaffald/ui'
import { useProfileCompletion } from './useProfileCompletion'

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

  const handleItemPress = (item: ChecklistItemData) => {
    if (item.actionRoute) {
      onNavigate(item.actionRoute)
    }
  }

  if (!completionData) {
    return (
      <DashboardWidget>
        <Checklist
          title="Complete Your Profile"
          subtitle="Your profile is your first impression on Scaffald. A complete profile helps employers, collaborators, and peers quickly understand who you are and what you're looking for. This checklist guides you through adding the most important details step by step. As you fill things out, you'll see your progress update in real time. Aim for 100% to unlock better visibility in search results and increase your chances of matching with the right opportunities."
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
        title="Complete Your Profile"
        subtitle="Your profile is your first impression on Scaffald. A complete profile helps employers, collaborators, and peers quickly understand who you are and what you're looking for. This checklist guides you through adding the most important details step by step. As you fill things out, you'll see your progress update in real time. Aim for 100% to unlock better visibility in search results and increase your chances of matching with the right opportunities."
        items={completionData.items}
        completionPercentage={completionData.completionPercentage}
        onItemPress={handleItemPress}
        isLoading={isLoading}
      />
    </DashboardWidget>
  )
}
