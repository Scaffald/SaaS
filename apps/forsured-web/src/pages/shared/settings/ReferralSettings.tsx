/**
 * Referral Settings Page
 *
 * Accessible from all user types (manager, subcontractor, broker)
 * Displays user's referral code, statistics, and referral list
 */

import { useEffect, useState } from 'react';
import { Stack, Row, Text, Card, Button, Input, Spinner } from '@scaffald/ui';
import { Copy, Share2, Mail, CheckCircle, Clock, DollarSign, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useUser } from '../../../contexts/UserContext';
import { useReferrals } from '../../../hooks/useReferrals';
import { getUserOrganizationId } from '../../../lib/supabase';
import { toast } from 'sonner';

export default function ReferralSettings() {
  const { user } = useAuth();
  const { currentUser } = useUser();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [emailToRefer, setEmailToRefer] = useState('');
  const [sending, setSending] = useState(false);

  const userId = currentUser?.id ?? user?.id ?? null;

  const {
    stats,
    referrals,
    referralCode,
    referralLink,
    loading,
    error,
    createNewReferral,
    copyReferralCode,
    copyReferralLink,
  } = useReferrals(userId || undefined, organizationId || undefined);

  // Fetch organization ID
  useEffect(() => {
    async function fetchOrganization() {
      if (!userId) return;

      try {
        const orgId = await getUserOrganizationId(userId);
        setOrganizationId(orgId);
      } catch (error) {
        console.error('[ReferralSettings] Error fetching organization:', error);
      }
    }

    fetchOrganization();
  }, [userId]);

  const handleCopyCode = () => {
    if (copyReferralCode()) {
      toast.success('Referral code copied to clipboard');
    } else {
      toast.error('Failed to copy code');
    }
  };

  const handleCopyLink = () => {
    if (copyReferralLink()) {
      toast.success('Referral link copied to clipboard');
    } else {
      toast.error('Failed to copy link');
    }
  };

  const handleSendReferral = async () => {
    if (!emailToRefer.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setSending(true);

    try {
      await createNewReferral(emailToRefer.trim());
      toast.success('Referral invitation sent!');
      setEmailToRefer('');
    } catch (err) {
      toast.error('Failed to send referral');
    } finally {
      setSending(false);
    }
  };

  if (loading && !stats) {
    return (
      <Stack style={{ gap: 'var(--space-4)', padding: 'var(--space-6)' }}>
        <Spinner size="lg" />
        <Text style={{ color: 'var(--color-11)' }}>Loading referral information...</Text>
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack style={{ gap: 'var(--space-4)', padding: 'var(--space-6)' }}>
        <Card
          style={{
            backgroundColor: 'var(--color-red-2)',
            borderColor: 'var(--color-red-6)',
            borderWidth: 1,
            borderRadius: 'var(--radius-4)',
            padding: 'var(--space-4)',
          }}
        >
          <Text style={{ color: 'var(--color-red-11)' }}>{error}</Text>
        </Card>
      </Stack>
    );
  }

  return (
    <Stack style={{ gap: 'var(--space-6)', padding: 'var(--space-6)' }}>
      <Stack style={{ gap: 'var(--space-2)' }}>
        <Text
          style={{
            fontSize: 'var(--font-size-8)',
            fontWeight: 700,
            color: 'var(--color-12)',
          }}
        >
          Referral Program
        </Text>
        <Text style={{ color: 'var(--color-11)' }}>
          Refer businesses to Forsured and earn rewards
        </Text>
      </Stack>

      {/* Referral Stats Overview */}
      {stats && (
        <Row style={{ flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <Card
            style={{
              flex: 1,
              minWidth: 200,
              backgroundColor: 'var(--color-background)',
              borderRadius: 'var(--radius-4)',
              border: '1px solid var(--color-border)',
              padding: 'var(--space-6)',
            }}
          >
            <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Stack>
                <Text style={{ color: 'var(--color-11)', fontSize: 'var(--font-size-3)' }}>
                  Total Referrals
                </Text>
                <Text
                  style={{
                    fontSize: 'var(--font-size-10)',
                    fontWeight: 700,
                    color: 'var(--color-12)',
                  }}
                >
                  {stats.totalReferrals}
                </Text>
              </Stack>
              <Row
                style={{
                  backgroundColor: 'var(--color-blue-3)',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-12)',
                }}
              >
                <Users size={24} color="var(--color-blue-10)" />
              </Row>
            </Row>
          </Card>

          <Card
            style={{
              flex: 1,
              minWidth: 200,
              backgroundColor: 'var(--color-background)',
              borderRadius: 'var(--radius-4)',
              border: '1px solid var(--color-border)',
              padding: 'var(--space-6)',
            }}
          >
            <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Stack>
                <Text style={{ color: 'var(--color-11)', fontSize: 'var(--font-size-3)' }}>
                  Completed
                </Text>
                <Text
                  style={{
                    fontSize: 'var(--font-size-10)',
                    fontWeight: 700,
                    color: 'var(--color-green-11)',
                  }}
                >
                  {stats.completedReferrals}
                </Text>
              </Stack>
              <Row
                style={{
                  backgroundColor: 'var(--color-green-3)',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-12)',
                }}
              >
                <CheckCircle size={24} color="var(--color-green-10)" />
              </Row>
            </Row>
          </Card>

          <Card
            style={{
              flex: 1,
              minWidth: 200,
              backgroundColor: 'var(--color-background)',
              borderRadius: 'var(--radius-4)',
              border: '1px solid var(--color-border)',
              padding: 'var(--space-6)',
            }}
          >
            <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Stack>
                <Text style={{ color: 'var(--color-11)', fontSize: 'var(--font-size-3)' }}>
                  Pending
                </Text>
                <Text
                  style={{
                    fontSize: 'var(--font-size-10)',
                    fontWeight: 700,
                    color: 'var(--color-yellow-11)',
                  }}
                >
                  {stats.pendingReferrals}
                </Text>
              </Stack>
              <Row
                style={{
                  backgroundColor: 'var(--color-yellow-3)',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-12)',
                }}
              >
                <Clock size={24} color="var(--color-yellow-10)" />
              </Row>
            </Row>
          </Card>

          <Card
            style={{
              flex: 1,
              minWidth: 200,
              backgroundColor: 'var(--color-background)',
              borderRadius: 'var(--radius-4)',
              border: '1px solid var(--color-border)',
              padding: 'var(--space-6)',
            }}
          >
            <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Stack>
                <Text style={{ color: 'var(--color-11)', fontSize: 'var(--font-size-3)' }}>
                  Total Credits
                </Text>
                <Text
                  style={{
                    fontSize: 'var(--font-size-10)',
                    fontWeight: 700,
                    color: 'var(--color-12)',
                  }}
                >
                  ${stats.totalCredit.toFixed(2)}
                </Text>
              </Stack>
              <Row
                style={{
                  backgroundColor: 'var(--color-green-3)',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-12)',
                }}
              >
                <DollarSign size={24} color="var(--color-green-10)" />
              </Row>
            </Row>
            <Text
              style={{
                fontSize: 'var(--font-size-2)',
                color: 'var(--color-11)',
                marginTop: 'var(--space-2)',
              }}
            >
              Paid: ${stats.paidCredit.toFixed(2)}
            </Text>
          </Card>
        </Row>
      )}

      {/* Referral Code Card */}
      {referralCode && (
        <Card
          style={{
            backgroundColor: 'var(--color-background)',
            borderRadius: 'var(--radius-4)',
            border: '1px solid var(--color-border)',
            padding: 'var(--space-6)',
          }}
        >
          <Text
            style={{
              fontSize: 'var(--font-size-6)',
              fontWeight: 600,
              color: 'var(--color-12)',
              marginBottom: 'var(--space-4)',
            }}
          >
            Your Referral Code
          </Text>

          <Card
            style={{
              backgroundColor: 'var(--color-blue-2)',
              borderColor: 'var(--color-blue-6)',
              border: '1px solid var(--color-blue-6)',
              borderRadius: 'var(--radius-4)',
              padding: 'var(--space-4)',
              marginBottom: 'var(--space-4)',
            }}
          >
            <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Text
                style={{
                  fontSize: 'var(--font-size-8)',
                  fontWeight: 700,
                  color: 'var(--color-blue-11)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {referralCode.referral_code}
              </Text>
              <Button variant="ghost" onPress={handleCopyCode}>
                <Copy size={20} />
              </Button>
            </Row>
          </Card>

          {referralLink && (
            <Card
              style={{
                backgroundColor: 'var(--color-gray-2)',
                borderColor: 'var(--color-gray-6)',
                border: '1px solid var(--color-gray-6)',
                borderRadius: 'var(--radius-4)',
                padding: 'var(--space-4)',
                marginBottom: 'var(--space-4)',
              }}
            >
              <Text
                style={{
                  fontSize: 'var(--font-size-2)',
                  color: 'var(--color-11)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                Referral Link:
              </Text>
              <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                <Text
                  style={{
                    fontSize: 'var(--font-size-3)',
                    color: 'var(--color-12)',
                    flex: 1,
                    wordBreak: 'break-all',
                  }}
                >
                  {referralLink}
                </Text>
                <Button variant="ghost" size="sm" onPress={handleCopyLink}>
                  <Copy size={16} />
                </Button>
              </Row>
            </Card>
          )}

          <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-11)' }}>
            Share your referral code or link with businesses you'd like to invite to Forsured.
          </Text>
        </Card>
      )}

      {/* Send Referral Invitation */}
      <Card
        style={{
          backgroundColor: 'var(--color-background)',
          borderRadius: 'var(--radius-4)',
          border: '1px solid var(--color-border)',
          padding: 'var(--space-6)',
        }}
      >
        <Row
          style={{
            alignItems: 'center',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-4)',
          }}
        >
          <Mail size={24} color="var(--color-blue-10)" />
          <Text
            style={{
              fontSize: 'var(--font-size-6)',
              fontWeight: 600,
              color: 'var(--color-12)',
            }}
          >
            Send Referral Invitation
          </Text>
        </Row>

        <Stack style={{ gap: 'var(--space-4)' }}>
          <Input
            label="Email Address"
            type="email"
            value={emailToRefer}
            onChange={(e) => setEmailToRefer(e.target.value)}
            placeholder="business@example.com"
            disabled={sending}
          />

          <Button onPress={handleSendReferral} disabled={sending || !emailToRefer}>
            {sending ? <Spinner size="sm" /> : 'Send Invitation'}
          </Button>
        </Stack>
      </Card>

      {/* Recent Referrals */}
      {referrals && referrals.length > 0 && (
        <Card
          style={{
            backgroundColor: 'var(--color-background)',
            borderRadius: 'var(--radius-4)',
            border: '1px solid var(--color-border)',
            padding: 'var(--space-6)',
          }}
        >
          <Text
            style={{
              fontSize: 'var(--font-size-6)',
              fontWeight: 600,
              color: 'var(--color-12)',
              marginBottom: 'var(--space-4)',
            }}
          >
            Recent Referrals
          </Text>

          <Stack style={{ gap: 'var(--space-3)' }}>
            {referrals.slice(0, 10).map((referral) => (
              <Card
                key={referral.id}
                style={{
                  backgroundColor:
                    referral.status === 'completed'
                      ? 'var(--color-green-2)'
                      : referral.status === 'credited'
                        ? 'var(--color-blue-2)'
                        : 'var(--color-gray-2)',
                  borderColor:
                    referral.status === 'completed'
                      ? 'var(--color-green-6)'
                      : referral.status === 'credited'
                        ? 'var(--color-blue-6)'
                        : 'var(--color-gray-6)',
                  border: `1px solid ${
                    referral.status === 'completed'
                      ? 'var(--color-green-6)'
                      : referral.status === 'credited'
                        ? 'var(--color-blue-6)'
                        : 'var(--color-gray-6)'
                  }`,
                  borderRadius: 'var(--radius-3)',
                  padding: 'var(--space-4)',
                }}
              >
                <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                  <Stack style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 'var(--font-size-4)',
                        fontWeight: 600,
                        color: 'var(--color-12)',
                      }}
                    >
                      {referral.referred_email}
                    </Text>
                    <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-11)' }}>
                      {new Date(referral.referred_at).toLocaleDateString()}
                    </Text>
                  </Stack>

                  <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                    {referral.status === 'completed' && (
                      <CheckCircle size={20} color="var(--color-green-10)" />
                    )}
                    {referral.status === 'pending' && (
                      <Clock size={20} color="var(--color-yellow-10)" />
                    )}
                    {referral.status === 'credited' && (
                      <DollarSign size={20} color="var(--color-blue-10)" />
                    )}
                    <Text
                      style={{
                        fontSize: 'var(--font-size-3)',
                        color:
                          referral.status === 'completed'
                            ? 'var(--color-green-11)'
                            : referral.status === 'credited'
                              ? 'var(--color-blue-11)'
                              : 'var(--color-yellow-11)',
                        textTransform: 'capitalize',
                      }}
                    >
                      {referral.status}
                    </Text>
                  </Row>
                </Row>

                {referral.status === 'credited' && referral.credit_amount > 0 && (
                  <Text
                    style={{
                      fontSize: 'var(--font-size-2)',
                      color: 'var(--color-blue-11)',
                      marginTop: 'var(--space-2)',
                    }}
                  >
                    Credit: ${referral.credit_amount.toFixed(2)}
                  </Text>
                )}
              </Card>
            ))}
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
