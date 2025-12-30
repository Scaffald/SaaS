/**
 * Referral Settings Page
 * 
 * Accessible from all user types (manager, subcontractor, broker)
 * Displays user's referral code, statistics, and referral list
 */

import { useEffect, useState } from 'react';
import { YStack, XStack, Text, Card, Button, Input, Spinner } from '@unicornlove/ui';
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
      <YStack gap="$4" padding="$6">
        <Spinner size="large" />
        <Text color="$color11">Loading referral information...</Text>
      </YStack>
    );
  }

  if (error) {
    return (
      <YStack gap="$4" padding="$6">
        <Card
          backgroundColor="$red2"
          borderColor="$red6"
          borderWidth={1}
          borderRadius="$4"
          padding="$4"
        >
          <Text color="$red11">{error}</Text>
        </Card>
      </YStack>
    );
  }

  return (
    <YStack gap="$6" padding="$6">
      <YStack gap="$2">
        <Text fontSize="$8" fontWeight="700" color="$color12">
          Referral Program
        </Text>
        <Text color="$color11">
          Refer businesses to Forsured and earn rewards
        </Text>
      </YStack>

      {/* Referral Stats Overview */}
      {stats && (
        <XStack flexWrap="wrap" gap="$4">
          <Card
            flex={1}
            minWidth={200}
            backgroundColor="$background"
            borderRadius="$4"
            borderWidth={1}
            borderColor="$borderColor"
            padding="$6"
          >
            <XStack alignItems="center" justifyContent="space-between">
              <YStack>
                <Text color="$color11" fontSize="$3">
                  Total Referrals
                </Text>
                <Text fontSize="$10" fontWeight="700" color="$color12">
                  {stats.totalReferrals}
                </Text>
              </YStack>
              <XStack backgroundColor="$blue3" padding="$3" borderRadius="$12">
                <Users size={24} color="var(--blue10)" />
              </XStack>
            </XStack>
          </Card>

          <Card
            flex={1}
            minWidth={200}
            backgroundColor="$background"
            borderRadius="$4"
            borderWidth={1}
            borderColor="$borderColor"
            padding="$6"
          >
            <XStack alignItems="center" justifyContent="space-between">
              <YStack>
                <Text color="$color11" fontSize="$3">
                  Completed
                </Text>
                <Text fontSize="$10" fontWeight="700" color="$green11">
                  {stats.completedReferrals}
                </Text>
              </YStack>
              <XStack backgroundColor="$green3" padding="$3" borderRadius="$12">
                <CheckCircle size={24} color="var(--green10)" />
              </XStack>
            </XStack>
          </Card>

          <Card
            flex={1}
            minWidth={200}
            backgroundColor="$background"
            borderRadius="$4"
            borderWidth={1}
            borderColor="$borderColor"
            padding="$6"
          >
            <XStack alignItems="center" justifyContent="space-between">
              <YStack>
                <Text color="$color11" fontSize="$3">
                  Pending
                </Text>
                <Text fontSize="$10" fontWeight="700" color="$yellow11">
                  {stats.pendingReferrals}
                </Text>
              </YStack>
              <XStack backgroundColor="$yellow3" padding="$3" borderRadius="$12">
                <Clock size={24} color="var(--yellow10)" />
              </XStack>
            </XStack>
          </Card>

          <Card
            flex={1}
            minWidth={200}
            backgroundColor="$background"
            borderRadius="$4"
            borderWidth={1}
            borderColor="$borderColor"
            padding="$6"
          >
            <XStack alignItems="center" justifyContent="space-between">
              <YStack>
                <Text color="$color11" fontSize="$3">
                  Total Credits
                </Text>
                <Text fontSize="$10" fontWeight="700" color="$color12">
                  ${stats.totalCredit.toFixed(2)}
                </Text>
              </YStack>
              <XStack backgroundColor="$green3" padding="$3" borderRadius="$12">
                <DollarSign size={24} color="var(--green10)" />
              </XStack>
            </XStack>
            <Text fontSize="$2" color="$color11" marginTop="$2">
              Paid: ${stats.paidCredit.toFixed(2)}
            </Text>
          </Card>
        </XStack>
      )}

      {/* Referral Code Card */}
      {referralCode && (
        <Card
          backgroundColor="$background"
          borderRadius="$4"
          borderWidth={1}
          borderColor="$borderColor"
          padding="$6"
        >
          <Text fontSize="$6" fontWeight="600" color="$color12" marginBottom="$4">
            Your Referral Code
          </Text>
          
          <Card
            backgroundColor="$blue2"
            borderColor="$blue6"
            borderWidth={1}
            borderRadius="$4"
            padding="$4"
            marginBottom="$4"
          >
            <XStack alignItems="center" justifyContent="space-between">
              <Text
                fontSize="$8"
                fontWeight="700"
                color="$blue11"
                fontFamily="$mono"
              >
                {referralCode.referral_code}
              </Text>
              <Button variant="ghost" onPress={handleCopyCode}>
                <Copy size={20} />
              </Button>
            </XStack>
          </Card>

          {referralLink && (
            <Card
              backgroundColor="$gray2"
              borderColor="$gray6"
              borderWidth={1}
              borderRadius="$4"
              padding="$4"
              marginBottom="$4"
            >
              <Text fontSize="$2" color="$color11" marginBottom="$2">
                Referral Link:
              </Text>
              <XStack alignItems="center" gap="$2">
                <Text
                  fontSize="$3"
                  color="$color12"
                  flex={1}
                  style={{ wordBreak: 'break-all' }}
                >
                  {referralLink}
                </Text>
                <Button variant="ghost" size="small" onPress={handleCopyLink}>
                  <Copy size={16} />
                </Button>
              </XStack>
            </Card>
          )}

          <Text fontSize="$3" color="$color11">
            Share your referral code or link with businesses you'd like to invite to Forsured.
          </Text>
        </Card>
      )}

      {/* Send Referral Invitation */}
      <Card
        backgroundColor="$background"
        borderRadius="$4"
        borderWidth={1}
        borderColor="$borderColor"
        padding="$6"
      >
        <XStack alignItems="center" gap="$3" marginBottom="$4">
          <Mail size={24} color="var(--blue10)" />
          <Text fontSize="$6" fontWeight="600" color="$color12">
            Send Referral Invitation
          </Text>
        </XStack>

        <YStack gap="$4">
          <Input
            label="Email Address"
            type="email"
            value={emailToRefer}
            onChangeText={setEmailToRefer}
            placeholder="business@example.com"
            disabled={sending}
          />

          <Button onPress={handleSendReferral} disabled={sending || !emailToRefer}>
            {sending ? <Spinner size="small" /> : 'Send Invitation'}
          </Button>
        </YStack>
      </Card>

      {/* Recent Referrals */}
      {referrals && referrals.length > 0 && (
        <Card
          backgroundColor="$background"
          borderRadius="$4"
          borderWidth={1}
          borderColor="$borderColor"
          padding="$6"
        >
          <Text fontSize="$6" fontWeight="600" color="$color12" marginBottom="$4">
            Recent Referrals
          </Text>

          <YStack gap="$3">
            {referrals.slice(0, 10).map(referral => (
              <Card
                key={referral.id}
                backgroundColor={
                  referral.status === 'completed' ? '$green2' :
                  referral.status === 'credited' ? '$blue2' :
                  '$gray2'
                }
                borderColor={
                  referral.status === 'completed' ? '$green6' :
                  referral.status === 'credited' ? '$blue6' :
                  '$gray6'
                }
                borderWidth={1}
                borderRadius="$3"
                padding="$4"
              >
                <XStack alignItems="center" justifyContent="space-between">
                  <YStack flex={1}>
                    <Text fontSize="$4" fontWeight="600" color="$color12">
                      {referral.referred_email}
                    </Text>
                    <Text fontSize="$2" color="$color11">
                      {new Date(referral.referred_at).toLocaleDateString()}
                    </Text>
                  </YStack>

                  <XStack alignItems="center" gap="$2">
                    {referral.status === 'completed' && (
                      <CheckCircle size={20} color="var(--green10)" />
                    )}
                    {referral.status === 'pending' && (
                      <Clock size={20} color="var(--yellow10)" />
                    )}
                    {referral.status === 'credited' && (
                      <DollarSign size={20} color="var(--blue10)" />
                    )}
                    <Text
                      fontSize="$3"
                      color={
                        referral.status === 'completed' ? '$green11' :
                        referral.status === 'credited' ? '$blue11' :
                        '$yellow11'
                      }
                      textTransform="capitalize"
                    >
                      {referral.status}
                    </Text>
                  </XStack>
                </XStack>

                {referral.status === 'credited' && referral.credit_amount > 0 && (
                  <Text fontSize="$2" color="$blue11" marginTop="$2">
                    Credit: ${referral.credit_amount.toFixed(2)}
                  </Text>
                )}
              </Card>
            ))}
          </YStack>
        </Card>
      )}
    </YStack>
  );
}

