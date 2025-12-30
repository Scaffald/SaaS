import { FileText, DollarSign, Calendar, Award, Building } from 'lucide-react';
import { XStack, YStack, Text, SizableText, Card } from 'tamagui';
import Button from '../Common/Button';
import { PublicRFP } from '../../types';

interface RFPCardProps {
  rfp: PublicRFP;
  userRole?: 'manager' | 'subcontractor';
  hasResponded?: boolean;
  onRespond?: () => void;
  onView?: () => void;
}

export default function RFPCard({
  rfp,
  userRole,
  hasResponded = false,
  onRespond,
  onView,
}: RFPCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysUntilDeadline = () => {
    if (!rfp.deadline) return null;
    const deadline = new Date(rfp.deadline);
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysLeft = getDaysUntilDeadline();

  const getStatusBadgeColor = () => {
    switch (rfp.status) {
      case 'published':
        return 'bg-success-100 text-success-700 border-success-300';
      case 'closed':
        return 'bg-neutral-100 text-neutral-700 border-neutral-300';
      case 'awarded':
        return 'bg-primary-100 text-primary-700 border-primary-300';
      default:
        return 'bg-warning-100 text-warning-700 border-warning-300';
    }
  };

  return (
    <Card
      backgroundColor="$background"
      borderRadius="$4"
      borderWidth={1}
      borderColor="$borderColor"
      elevation={1}
      hoverStyle={{
        elevation: 2,
      }}
    >
      <YStack padding="$6">
        <XStack alignItems="flex-start" justifyContent="space-between" mb="$4">
          <XStack alignItems="flex-start" gap="$3" flex={1} minWidth={0}>
            <XStack
              width={48}
              height={48}
              backgroundColor="$orange2"
              borderRadius="$4"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <FileText color="$orange9" size={24} />
            </XStack>
            <YStack flex={1} minWidth={0}>
              <Text fontSize="$6" fontWeight="600" color="$color12">
                {rfp.title}
              </Text>
              {rfp.trade_required && (
                <XStack
                  alignItems="center"
                  paddingHorizontal="$2"
                  paddingVertical="$1"
                  borderRadius="$2"
                  backgroundColor="$color3"
                  borderWidth={1}
                  borderColor="$color5"
                  mt="$1"
                >
                  <SizableText size="$1" fontWeight="500" color="$color11">
                    {rfp.trade_required}
                  </SizableText>
                </XStack>
              )}
            </YStack>
          </XStack>
          <XStack
            alignItems="center"
            paddingHorizontal="$2"
            paddingVertical="$1"
            borderRadius="$2"
            borderWidth={1}
            borderColor={
              rfp.status === 'published'
                ? '$green5'
                : rfp.status === 'closed'
                  ? '$color5'
                  : rfp.status === 'awarded'
                    ? '$blue5'
                    : '$orange5'
            }
            backgroundColor={
              rfp.status === 'published'
                ? '$green2'
                : rfp.status === 'closed'
                  ? '$color2'
                  : rfp.status === 'awarded'
                    ? '$blue2'
                    : '$orange2'
            }
          >
            <SizableText
              size="$1"
              fontWeight="500"
              color={
                rfp.status === 'published'
                  ? '$green11'
                  : rfp.status === 'closed'
                    ? '$color11'
                    : rfp.status === 'awarded'
                      ? '$blue11'
                      : '$orange11'
              }
            >
              {rfp.status}
            </SizableText>
          </XStack>
        </XStack>

        {rfp.description && (
          <SizableText size="$3" color="$color11" numberOfLines={3} mb="$4">
            {rfp.description}
          </SizableText>
        )}

        <XStack flexWrap="wrap" gap="$4" mb="$4">
          <XStack alignItems="center" gap="$2" flex={1} minWidth="150px">
            <DollarSign size={14} color="$color11" />
            <YStack>
              <SizableText size="$1" color="$color11">Budget Range</SizableText>
              <SizableText size="$3" fontWeight="500" color="$color12">
                {formatCurrency(rfp.budget_range_min)} -{' '}
                {formatCurrency(rfp.budget_range_max)}
              </SizableText>
            </YStack>
          </XStack>

          {rfp.deadline && (
            <XStack alignItems="center" gap="$2" flex={1} minWidth="150px">
              <Calendar size={14} color="$color11" />
              <YStack>
                <SizableText size="$1" color="$color11">Deadline</SizableText>
                <SizableText size="$3" fontWeight="500" color="$color12">
                  {formatDate(rfp.deadline)}
                </SizableText>
                {daysLeft !== null && daysLeft > 0 && (
                  <SizableText
                    size="$1"
                    color={daysLeft <= 7 ? '$red9' : '$color11'}
                  >
                    {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                  </SizableText>
                )}
              </YStack>
            </XStack>
          )}

          {rfp.published_at && (
            <XStack alignItems="center" gap="$2" flex={1} minWidth="150px">
              <Building size={14} color="$color11" />
              <YStack>
                <SizableText size="$1" color="$color11">Published</SizableText>
                <SizableText size="$3" fontWeight="500" color="$color12">
                  {formatDate(rfp.published_at)}
                </SizableText>
              </YStack>
            </XStack>
          )}

          <XStack alignItems="center" gap="$2" flex={1} minWidth="150px">
            <Award size={14} color="$color11" />
            <YStack>
              <SizableText size="$1" color="$color11">Responses</SizableText>
              <SizableText size="$3" fontWeight="500" color="$color12">
                {rfp.response_count}
              </SizableText>
            </YStack>
          </XStack>
        </XStack>

        {rfp.requirements && Object.keys(rfp.requirements).length > 0 && (
          <YStack mb="$4" padding="$3" backgroundColor="$color4" borderRadius="$4">
            <SizableText size="$1" fontWeight="500" color="$color12" mb="$2">
              Requirements
            </SizableText>
            <YStack gap="$1">
              {rfp.requirements.insurance && (
                <SizableText size="$1" color="$color11">
                  Insurance:{' '}
                  {Array.isArray(rfp.requirements.insurance)
                    ? rfp.requirements.insurance.join(', ')
                    : rfp.requirements.insurance}
                </SizableText>
              )}
              {rfp.requirements.certifications && (
                <SizableText size="$1" color="$color11">
                  Certifications:{' '}
                  {Array.isArray(rfp.requirements.certifications)
                    ? rfp.requirements.certifications.join(', ')
                    : rfp.requirements.certifications}
                </SizableText>
              )}
              {rfp.requirements.minimum_coverage && (
                <SizableText size="$1" color="$color11">
                  Min Coverage:{' '}
                  {formatCurrency(rfp.requirements.minimum_coverage)}
                </SizableText>
              )}
            </YStack>
          </YStack>
        )}

        <XStack alignItems="center" gap="$3" paddingTop="$4" borderTopWidth={1} borderColor="$borderColor">
          {userRole === 'subcontractor' && rfp.status === 'published' && (
            <>
              <Button
                variant="primary"
                flex={1}
                onPress={onRespond}
                disabled={hasResponded}
              >
                {hasResponded ? 'Response Submitted' : 'Submit Proposal'}
              </Button>
              <Button variant="ghost" onPress={onView}>
                View Details
              </Button>
            </>
          )}

          {userRole === 'manager' && (
            <Button variant="ghost" flex={1} onPress={onView}>
              View Responses ({rfp.response_count})
            </Button>
          )}

          {!userRole && (
            <Button variant="ghost" flex={1} onPress={onView}>
              View Details
            </Button>
          )}
        </XStack>
      </YStack>
    </Card>
  );
}
