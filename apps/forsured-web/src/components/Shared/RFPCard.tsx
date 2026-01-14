import { FileText, DollarSign, Calendar, Award, Building } from 'lucide-react';
import { Row, Stack, Text, Card } from '@unicornlove/beyond-ui';
import Button from '../Common/Button';
import { PublicRFP } from '../../types';

interface RFPCardProps {
  rfp: PublicRFP;
  userRole?: 'manager' | 'subcontractor';
  hasResponded?: boolean;
  onRespond?: () => void;
  onView?: () => void;
}

const getStatusStyles = (status: string): React.CSSProperties => {
  switch (status) {
    case 'published':
      return {
        borderColor: 'var(--color-green5)',
        backgroundColor: 'var(--color-green2)',
      };
    case 'closed':
      return {
        borderColor: 'var(--color-color5)',
        backgroundColor: 'var(--color-color2)',
      };
    case 'awarded':
      return {
        borderColor: 'var(--color-blue5)',
        backgroundColor: 'var(--color-blue2)',
      };
    default:
      return {
        borderColor: 'var(--color-orange5)',
        backgroundColor: 'var(--color-orange2)',
      };
  }
};

const getStatusTextColor = (status: string): string => {
  switch (status) {
    case 'published':
      return 'var(--color-green11)';
    case 'closed':
      return 'var(--color-color11)';
    case 'awarded':
      return 'var(--color-blue11)';
    default:
      return 'var(--color-orange11)';
  }
};

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

  return (
    <Card
      style={{
        backgroundColor: 'var(--color-background)',
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: 'var(--color-border)',
      }}
    >
      <Stack style={{ padding: 24 }}>
        <Row style={{ alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <Row style={{ alignItems: 'flex-start', gap: 12, flex: 1, minWidth: 0 }}>
            <Row
              style={{
                width: 48,
                height: 48,
                backgroundColor: 'var(--color-orange2)',
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FileText color="var(--color-orange9)" size={24} />
            </Row>
            <Stack style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-color12)' }}>
                {rfp.title}
              </Text>
              {rfp.trade_required && (
                <Row
                  style={{
                    alignItems: 'center',
                    paddingLeft: 8,
                    paddingRight: 8,
                    paddingTop: 4,
                    paddingBottom: 4,
                    borderRadius: 6,
                    backgroundColor: 'var(--color-color3)',
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderColor: 'var(--color-color5)',
                    marginTop: 4,
                    width: 'fit-content',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-color11)' }}>
                    {rfp.trade_required}
                  </Text>
                </Row>
              )}
            </Stack>
          </Row>
          <Row
            style={{
              alignItems: 'center',
              paddingLeft: 8,
              paddingRight: 8,
              paddingTop: 4,
              paddingBottom: 4,
              borderRadius: 6,
              borderWidth: 1,
              borderStyle: 'solid',
              ...getStatusStyles(rfp.status),
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: getStatusTextColor(rfp.status),
              }}
            >
              {rfp.status}
            </Text>
          </Row>
        </Row>

        {rfp.description && (
          <Text
            style={{
              fontSize: 14,
              color: 'var(--color-color11)',
              marginBottom: 16,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {rfp.description}
          </Text>
        )}

        <Row style={{ flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
          <Row style={{ alignItems: 'center', gap: 8, flex: 1, minWidth: 150 }}>
            <DollarSign size={14} color="var(--color-color11)" />
            <Stack>
              <Text style={{ fontSize: 12, color: 'var(--color-color11)' }}>Budget Range</Text>
              <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-color12)' }}>
                {formatCurrency(rfp.budget_range_min)} -{' '}
                {formatCurrency(rfp.budget_range_max)}
              </Text>
            </Stack>
          </Row>

          {rfp.deadline && (
            <Row style={{ alignItems: 'center', gap: 8, flex: 1, minWidth: 150 }}>
              <Calendar size={14} color="var(--color-color11)" />
              <Stack>
                <Text style={{ fontSize: 12, color: 'var(--color-color11)' }}>Deadline</Text>
                <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-color12)' }}>
                  {formatDate(rfp.deadline)}
                </Text>
                {daysLeft !== null && daysLeft > 0 && (
                  <Text
                    style={{
                      fontSize: 12,
                      color: daysLeft <= 7 ? 'var(--color-red9)' : 'var(--color-color11)',
                    }}
                  >
                    {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                  </Text>
                )}
              </Stack>
            </Row>
          )}

          {rfp.published_at && (
            <Row style={{ alignItems: 'center', gap: 8, flex: 1, minWidth: 150 }}>
              <Building size={14} color="var(--color-color11)" />
              <Stack>
                <Text style={{ fontSize: 12, color: 'var(--color-color11)' }}>Published</Text>
                <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-color12)' }}>
                  {formatDate(rfp.published_at)}
                </Text>
              </Stack>
            </Row>
          )}

          <Row style={{ alignItems: 'center', gap: 8, flex: 1, minWidth: 150 }}>
            <Award size={14} color="var(--color-color11)" />
            <Stack>
              <Text style={{ fontSize: 12, color: 'var(--color-color11)' }}>Responses</Text>
              <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-color12)' }}>
                {rfp.response_count}
              </Text>
            </Stack>
          </Row>
        </Row>

        {rfp.requirements && Object.keys(rfp.requirements).length > 0 && (
          <Stack style={{ marginBottom: 16, padding: 12, backgroundColor: 'var(--color-color4)', borderRadius: 12 }}>
            <Text style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-color12)', marginBottom: 8 }}>
              Requirements
            </Text>
            <Stack style={{ gap: 4 }}>
              {rfp.requirements.insurance && (
                <Text style={{ fontSize: 12, color: 'var(--color-color11)' }}>
                  Insurance:{' '}
                  {Array.isArray(rfp.requirements.insurance)
                    ? rfp.requirements.insurance.join(', ')
                    : rfp.requirements.insurance}
                </Text>
              )}
              {rfp.requirements.certifications && (
                <Text style={{ fontSize: 12, color: 'var(--color-color11)' }}>
                  Certifications:{' '}
                  {Array.isArray(rfp.requirements.certifications)
                    ? rfp.requirements.certifications.join(', ')
                    : rfp.requirements.certifications}
                </Text>
              )}
              {rfp.requirements.minimum_coverage && (
                <Text style={{ fontSize: 12, color: 'var(--color-color11)' }}>
                  Min Coverage:{' '}
                  {formatCurrency(rfp.requirements.minimum_coverage)}
                </Text>
              )}
            </Stack>
          </Stack>
        )}

        <Row
          style={{
            alignItems: 'center',
            gap: 12,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopStyle: 'solid',
            borderTopColor: 'var(--color-border)',
          }}
        >
          {userRole === 'subcontractor' && rfp.status === 'published' && (
            <>
              <Button
                variant="primary"
                style={{ flex: 1 }}
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
            <Button variant="ghost" style={{ flex: 1 }} onPress={onView}>
              View Responses ({rfp.response_count})
            </Button>
          )}

          {!userRole && (
            <Button variant="ghost" style={{ flex: 1 }} onPress={onView}>
              View Details
            </Button>
          )}
        </Row>
      </Stack>
    </Card>
  );
}
