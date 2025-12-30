import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  DollarSign,
  Award,
  Settings as SettingsIcon,
  Activity,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  Edit,
  BarChart3,
} from 'lucide-react';
import {
  YStack,
  XStack,
  Text,
  H1,
  H2,
  H3,
  Card,
  Button as TamaguiButton,
  Input,
  Spinner,
  Switch,
} from '@unicornlove/ui';
import { useDatabase } from '../../contexts/DatabaseContext';
import { toast } from 'sonner';

interface ProgramSettings {
  id: string;
  is_active: boolean;
  program_name: string;
  program_description?: string;
  default_credit_amount: number;
  credit_currency: string;
  max_credits_per_user?: number;
  credits_expiry_days?: number;
  broker_relationship_multiplier: number;
  manager_relationship_multiplier: number;
  contractor_relationship_multiplier: number;
  general_referral_enabled: boolean;
  general_referral_credit_amount: number;
  require_email_verification: boolean;
  require_company_setup: boolean;
  min_account_age_hours: number;
  max_invitations_per_day: number;
  max_invitations_per_month: number;
  duplicate_email_cooldown_days: number;
}

interface Analytics {
  total_invitations: number;
  successful_connections: number;
  pending_invitations: number;
  conversion_rate: number;
  broker_invitations: number;
  manager_invitations: number;
  contractor_invitations: number;
  credits_granted: number;
}

interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  starts_at?: string;
  ends_at?: string;
  credit_amount?: number;
  total_invitations: number;
  total_connections: number;
  total_credits_granted: number;
}

interface Reward {
  id: string;
  user_id: string;
  credit_amount: number;
  reward_type: string;
  status: 'pending' | 'approved' | 'paid' | 'expired' | 'cancelled';
  created_at: string;
  user_email?: string;
  user_name?: string;
}

export default function ReferralManagementPage() {
  const { forsured } = useDatabase();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'campaigns' | 'rewards'>('overview');

  // Data states
  const [settings, setSettings] = useState<ProgramSettings | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);

  // UI states
  const [editingSettings, setEditingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSettings(),
        fetchAnalytics(),
        fetchCampaigns(),
        fetchRewards(),
      ]);
    } catch (error) {
      console.error('[ReferralManagement] Error fetching data:', error);
      toast.error('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    const { data, error } = await forsured('referral_program_settings')
      .select('*')
      .single();

    if (error) throw error;
    setSettings(data as ProgramSettings);
  };

  const fetchAnalytics = async () => {
    // Calculate analytics from relationship_invitations
    const { data: invitations, error } = await forsured('relationship_invitations')
      .select('*');

    if (error) throw error;

    const total = invitations?.length || 0;
    const connected = invitations?.filter(i => i.status === 'connected').length || 0;
    const pending = invitations?.filter(i => i.status === 'pending').length || 0;
    const broker = invitations?.filter(i => i.inviter_type === 'broker').length || 0;
    const manager = invitations?.filter(i => i.inviter_type === 'manager').length || 0;
    const contractor = invitations?.filter(i => i.inviter_type === 'subcontractor').length || 0;
    const credits = invitations?.filter(i => i.referral_credit_granted).length || 0;

    setAnalytics({
      total_invitations: total,
      successful_connections: connected,
      pending_invitations: pending,
      conversion_rate: total > 0 ? Math.round((connected / total) * 100) : 0,
      broker_invitations: broker,
      manager_invitations: manager,
      contractor_invitations: contractor,
      credits_granted: credits,
    });
  };

  const fetchCampaigns = async () => {
    const { data, error } = await forsured('referral_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setCampaigns(data as Campaign[] || []);
  };

  const fetchRewards = async () => {
    const { data, error } = await forsured('referral_rewards')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    setRewards(data as Reward[] || []);
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    setSavingSettings(true);
    try {
      const { error } = await forsured('referral_program_settings')
        .update({
          is_active: settings.is_active,
          program_name: settings.program_name,
          program_description: settings.program_description,
          default_credit_amount: settings.default_credit_amount,
          max_invitations_per_day: settings.max_invitations_per_day,
          max_invitations_per_month: settings.max_invitations_per_month,
          broker_relationship_multiplier: settings.broker_relationship_multiplier,
          manager_relationship_multiplier: settings.manager_relationship_multiplier,
          contractor_relationship_multiplier: settings.contractor_relationship_multiplier,
          general_referral_enabled: settings.general_referral_enabled,
          general_referral_credit_amount: settings.general_referral_credit_amount,
          min_account_age_hours: settings.min_account_age_hours,
          updated_at: new Date().toISOString(),
        })
        .eq('id', settings.id);

      if (error) throw error;

      toast.success('Settings saved successfully');
      setEditingSettings(false);
    } catch (error) {
      console.error('[ReferralManagement] Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <YStack alignItems="center" justifyContent="center" height="100%" padding="$6">
        <Spinner size="large" color="$blue10" />
        <Text mt="$4" color="$color11">
          Loading referral program data...
        </Text>
      </YStack>
    );
  }

  return (
    <YStack gap="$6">
      {/* Header */}
      <XStack justifyContent="space-between" alignItems="center">
        <YStack>
          <H1 fontSize="$10" fontWeight="700" color="$color12" fontFamily="$heading">
            Referral Program Management
          </H1>
          <Text color="$color11" fontSize="$6" mt="$1">
            Manage referral program settings, campaigns, and rewards
          </Text>
        </YStack>
        {settings && (
          <XStack gap="$2" alignItems="center" backgroundColor={settings.is_active ? '$green2' : '$gray3'} paddingHorizontal="$4" paddingVertical="$2" borderRadius="$3">
            <Activity size={16} color={settings.is_active ? '$green10' : '$gray10'} />
            <Text fontSize="$3" fontWeight="600" color={settings.is_active ? '$green10' : '$gray10'}>
              {settings.is_active ? 'Program Active' : 'Program Inactive'}
            </Text>
          </XStack>
        )}
      </XStack>

      {/* Tab Navigation */}
      <XStack gap="$2" borderBottomWidth={1} borderColor="$borderColor" paddingBottom="$2">
        <TamaguiButton
          size="$3"
          variant="outlined"
          backgroundColor={activeTab === 'overview' ? '$blue9' : 'transparent'}
          color={activeTab === 'overview' ? 'white' : '$color11'}
          onPress={() => setActiveTab('overview')}
        >
          Overview
        </TamaguiButton>
        <TamaguiButton
          size="$3"
          variant="outlined"
          backgroundColor={activeTab === 'settings' ? '$blue9' : 'transparent'}
          color={activeTab === 'settings' ? 'white' : '$color11'}
          onPress={() => setActiveTab('settings')}
        >
          Settings
        </TamaguiButton>
        <TamaguiButton
          size="$3"
          variant="outlined"
          backgroundColor={activeTab === 'campaigns' ? '$blue9' : 'transparent'}
          color={activeTab === 'campaigns' ? 'white' : '$color11'}
          onPress={() => setActiveTab('campaigns')}
        >
          Campaigns
        </TamaguiButton>
        <TamaguiButton
          size="$3"
          variant="outlined"
          backgroundColor={activeTab === 'rewards' ? '$blue9' : 'transparent'}
          color={activeTab === 'rewards' ? 'white' : '$color11'}
          onPress={() => setActiveTab('rewards')}
        >
          Rewards
        </TamaguiButton>
      </XStack>

      {/* Overview Tab */}
      {activeTab === 'overview' && analytics && (
        <YStack gap="$6">
          {/* Key Metrics */}
          <XStack gap="$4" flexWrap="wrap">
            <Card backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$borderColor" padding="$5" flex={1} minWidth={200}>
              <YStack gap="$2">
                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontSize="$3" color="$color11">Total Invitations</Text>
                  <Users size={20} color="$blue10" />
                </XStack>
                <Text fontSize="$9" fontWeight="700" color="$color12">
                  {analytics.total_invitations}
                </Text>
                <Text fontSize="$2" color="$color10">
                  All time
                </Text>
              </YStack>
            </Card>

            <Card backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$borderColor" padding="$5" flex={1} minWidth={200}>
              <YStack gap="$2">
                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontSize="$3" color="$color11">Successful Connections</Text>
                  <CheckCircle size={20} color="$green10" />
                </XStack>
                <Text fontSize="$9" fontWeight="700" color="$color12">
                  {analytics.successful_connections}
                </Text>
                <Text fontSize="$2" color="$green10">
                  {analytics.conversion_rate}% conversion rate
                </Text>
              </YStack>
            </Card>

            <Card backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$borderColor" padding="$5" flex={1} minWidth={200}>
              <YStack gap="$2">
                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontSize="$3" color="$color11">Pending Invitations</Text>
                  <Clock size={20} color="$orange10" />
                </XStack>
                <Text fontSize="$9" fontWeight="700" color="$color12">
                  {analytics.pending_invitations}
                </Text>
                <Text fontSize="$2" color="$color10">
                  Awaiting response
                </Text>
              </YStack>
            </Card>

            <Card backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$borderColor" padding="$5" flex={1} minWidth={200}>
              <YStack gap="$2">
                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontSize="$3" color="$color11">Credits Granted</Text>
                  <Award size={20} color="$purple10" />
                </XStack>
                <Text fontSize="$9" fontWeight="700" color="$color12">
                  {analytics.credits_granted}
                </Text>
                <Text fontSize="$2" color="$color10">
                  To new accounts
                </Text>
              </YStack>
            </Card>
          </XStack>

          {/* By User Type */}
          <Card backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$borderColor" padding="$5">
            <YStack gap="$4">
              <H3 fontSize="$5" fontWeight="600" color="$color12">
                Invitations by User Type
              </H3>
              <XStack gap="$4" flexWrap="wrap">
                <YStack gap="$2" flex={1} minWidth={150}>
                  <Text fontSize="$3" color="$color11">Brokers</Text>
                  <Text fontSize="$7" fontWeight="600" color="$blue11">
                    {analytics.broker_invitations}
                  </Text>
                </YStack>
                <YStack gap="$2" flex={1} minWidth={150}>
                  <Text fontSize="$3" color="$color11">Managers</Text>
                  <Text fontSize="$7" fontWeight="600" color="$green11">
                    {analytics.manager_invitations}
                  </Text>
                </YStack>
                <YStack gap="$2" flex={1} minWidth={150}>
                  <Text fontSize="$3" color="$color11">Contractors</Text>
                  <Text fontSize="$7" fontWeight="600" color="$purple11">
                    {analytics.contractor_invitations}
                  </Text>
                </YStack>
              </XStack>
            </YStack>
          </Card>
        </YStack>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && settings && (
        <Card backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$borderColor" padding="$5">
          <YStack gap="$4">
            <XStack justifyContent="space-between" alignItems="center">
              <H2 fontSize="$6" fontWeight="600" color="$color12">
                Program Settings
              </H2>
              {!editingSettings ? (
                <TamaguiButton
                  size="$3"
                  variant="outlined"
                  icon={<Edit size={16} />}
                  onPress={() => setEditingSettings(true)}
                >
                  Edit Settings
                </TamaguiButton>
              ) : (
                <XStack gap="$2">
                  <TamaguiButton
                    size="$3"
                    variant="outlined"
                    onPress={() => {
                      setEditingSettings(false);
                      fetchSettings();
                    }}
                  >
                    Cancel
                  </TamaguiButton>
                  <TamaguiButton
                    size="$3"
                    backgroundColor="$blue9"
                    color="white"
                    onPress={handleSaveSettings}
                    disabled={savingSettings}
                  >
                    {savingSettings ? 'Saving...' : 'Save Changes'}
                  </TamaguiButton>
                </XStack>
              )}
            </XStack>

            {/* Program Status */}
            <YStack gap="$2">
              <XStack justifyContent="space-between" alignItems="center">
                <YStack gap="$1">
                  <Text fontSize="$3" fontWeight="600" color="$color12">
                    Program Active
                  </Text>
                  <Text fontSize="$2" color="$color11">
                    Enable or disable the entire referral program
                  </Text>
                </YStack>
                <Switch
                  checked={settings.is_active}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, is_active: checked })
                  }
                  disabled={!editingSettings}
                />
              </XStack>
            </YStack>

            {/* Credit Settings */}
            <YStack gap="$3" borderTopWidth={1} borderColor="$borderColor" paddingTop="$4">
              <H3 fontSize="$4" fontWeight="600" color="$color12">
                Credit Settings
              </H3>
              
              <YStack gap="$2">
                <Text fontSize="$2" fontWeight="500" color="$color11">
                  Default Credit Amount (${settings.credit_currency})
                </Text>
                <Input
                  value={String(settings.default_credit_amount)}
                  onChangeText={(text) =>
                    setSettings({ ...settings, default_credit_amount: parseFloat(text) || 0 })
                  }
                  disabled={!editingSettings}
                  keyboardType="numeric"
                />
              </YStack>

              <YStack gap="$2">
                <Text fontSize="$2" fontWeight="500" color="$color11">
                  Minimum Account Age (hours) for Credits
                </Text>
                <Input
                  value={String(settings.min_account_age_hours)}
                  onChangeText={(text) =>
                    setSettings({ ...settings, min_account_age_hours: parseInt(text) || 24 })
                  }
                  disabled={!editingSettings}
                  keyboardType="numeric"
                />
                <Text fontSize="$1" color="$color10">
                  Only accounts newer than this get referral credits
                </Text>
              </YStack>
            </YStack>

            {/* Relationship Multipliers */}
            <YStack gap="$3" borderTopWidth={1} borderColor="$borderColor" paddingTop="$4">
              <H3 fontSize="$4" fontWeight="600" color="$color12">
                Relationship Credit Multipliers
              </H3>
              
              <XStack gap="$3">
                <YStack gap="$2" flex={1}>
                  <Text fontSize="$2" fontWeight="500" color="$color11">
                    Broker Multiplier
                  </Text>
                  <Input
                    value={String(settings.broker_relationship_multiplier)}
                    onChangeText={(text) =>
                      setSettings({ ...settings, broker_relationship_multiplier: parseFloat(text) || 1.0 })
                    }
                    disabled={!editingSettings}
                    keyboardType="decimal-pad"
                  />
                </YStack>

                <YStack gap="$2" flex={1}>
                  <Text fontSize="$2" fontWeight="500" color="$color11">
                    Manager Multiplier
                  </Text>
                  <Input
                    value={String(settings.manager_relationship_multiplier)}
                    onChangeText={(text) =>
                      setSettings({ ...settings, manager_relationship_multiplier: parseFloat(text) || 1.0 })
                    }
                    disabled={!editingSettings}
                    keyboardType="decimal-pad"
                  />
                </YStack>

                <YStack gap="$2" flex={1}>
                  <Text fontSize="$2" fontWeight="500" color="$color11">
                    Contractor Multiplier
                  </Text>
                  <Input
                    value={String(settings.contractor_relationship_multiplier)}
                    onChangeText={(text) =>
                      setSettings({ ...settings, contractor_relationship_multiplier: parseFloat(text) || 1.0 })
                    }
                    disabled={!editingSettings}
                    keyboardType="decimal-pad"
                  />
                </YStack>
              </XStack>
            </YStack>

            {/* Rate Limits */}
            <YStack gap="$3" borderTopWidth={1} borderColor="$borderColor" paddingTop="$4">
              <H3 fontSize="$4" fontWeight="600" color="$color12">
                Rate Limits
              </H3>
              
              <XStack gap="$3">
                <YStack gap="$2" flex={1}>
                  <Text fontSize="$2" fontWeight="500" color="$color11">
                    Max Invitations per Day
                  </Text>
                  <Input
                    value={String(settings.max_invitations_per_day)}
                    onChangeText={(text) =>
                      setSettings({ ...settings, max_invitations_per_day: parseInt(text) || 10 })
                    }
                    disabled={!editingSettings}
                    keyboardType="numeric"
                  />
                </YStack>

                <YStack gap="$2" flex={1}>
                  <Text fontSize="$2" fontWeight="500" color="$color11">
                    Max Invitations per Month
                  </Text>
                  <Input
                    value={String(settings.max_invitations_per_month)}
                    onChangeText={(text) =>
                      setSettings({ ...settings, max_invitations_per_month: parseInt(text) || 50 })
                    }
                    disabled={!editingSettings}
                    keyboardType="numeric"
                  />
                </YStack>
              </XStack>
            </YStack>
          </YStack>
        </Card>
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <YStack gap="$4">
          <XStack justifyContent="space-between" alignItems="center">
            <H2 fontSize="$6" fontWeight="600" color="$color12">
              Referral Campaigns
            </H2>
            <TamaguiButton
              size="$3"
              backgroundColor="$blue9"
              color="white"
              icon={<Plus size={16} />}
              onPress={() => toast.info('Campaign creation coming soon')}
            >
              Create Campaign
            </TamaguiButton>
          </XStack>

          {campaigns.length === 0 ? (
            <Card backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$borderColor" padding="$6">
              <YStack alignItems="center" gap="$3">
                <Calendar size={48} color="$color10" />
                <Text fontSize="$4" color="$color11">
                  No campaigns yet
                </Text>
                <Text fontSize="$2" color="$color10" textAlign="center">
                  Create targeted campaigns to boost referral activity
                </Text>
              </YStack>
            </Card>
          ) : (
            <YStack gap="$3">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$borderColor" padding="$4">
                  <XStack justifyContent="space-between" alignItems="center">
                    <YStack gap="$2" flex={1}>
                      <XStack gap="$2" alignItems="center">
                        <Text fontSize="$4" fontWeight="600" color="$color12">
                          {campaign.name}
                        </Text>
                        <XStack
                          backgroundColor={
                            campaign.status === 'active' ? '$green2' :
                            campaign.status === 'completed' ? '$blue2' : '$gray3'
                          }
                          paddingHorizontal="$2"
                          paddingVertical="$1"
                          borderRadius="$2"
                        >
                          <Text
                            fontSize="$1"
                            fontWeight="600"
                            color={
                              campaign.status === 'active' ? '$green10' :
                              campaign.status === 'completed' ? '$blue10' : '$gray10'
                            }
                          >
                            {campaign.status.toUpperCase()}
                          </Text>
                        </XStack>
                      </XStack>
                      {campaign.description && (
                        <Text fontSize="$2" color="$color11">
                          {campaign.description}
                        </Text>
                      )}
                      <XStack gap="$4">
                        <Text fontSize="$2" color="$color10">
                          Invitations: {campaign.total_invitations}
                        </Text>
                        <Text fontSize="$2" color="$color10">
                          Connections: {campaign.total_connections}
                        </Text>
                        <Text fontSize="$2" color="$color10">
                          Credits: ${campaign.total_credits_granted}
                        </Text>
                      </XStack>
                    </YStack>
                    <TamaguiButton
                      size="$2"
                      variant="outlined"
                      icon={<Edit size={14} />}
                      onPress={() => toast.info('Campaign editing coming soon')}
                    >
                      Edit
                    </TamaguiButton>
                  </XStack>
                </Card>
              ))}
            </YStack>
          )}
        </YStack>
      )}

      {/* Rewards Tab */}
      {activeTab === 'rewards' && (
        <YStack gap="$4">
          <H2 fontSize="$6" fontWeight="600" color="$color12">
            Reward Management
          </H2>

          {rewards.length === 0 ? (
            <Card backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$borderColor" padding="$6">
              <YStack alignItems="center" gap="$3">
                <Award size={48} color="$color10" />
                <Text fontSize="$4" color="$color11">
                  No rewards yet
                </Text>
                <Text fontSize="$2" color="$color10" textAlign="center">
                  Rewards will appear here as users earn credits
                </Text>
              </YStack>
            </Card>
          ) : (
            <YStack gap="$3">
              {rewards.map((reward) => (
                <Card key={reward.id} backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$borderColor" padding="$4">
                  <XStack justifyContent="space-between" alignItems="center">
                    <YStack gap="$2" flex={1}>
                      <XStack gap="$2" alignItems="center">
                        <Text fontSize="$4" fontWeight="600" color="$color12">
                          ${reward.credit_amount}
                        </Text>
                        <XStack
                          backgroundColor={
                            reward.status === 'approved' || reward.status === 'paid' ? '$green2' :
                            reward.status === 'pending' ? '$orange2' : '$gray3'
                          }
                          paddingHorizontal="$2"
                          paddingVertical="$1"
                          borderRadius="$2"
                        >
                          <Text
                            fontSize="$1"
                            fontWeight="600"
                            color={
                              reward.status === 'approved' || reward.status === 'paid' ? '$green10' :
                              reward.status === 'pending' ? '$orange10' : '$gray10'
                            }
                          >
                            {reward.status.toUpperCase()}
                          </Text>
                        </XStack>
                      </XStack>
                      <Text fontSize="$2" color="$color11">
                        Type: {reward.reward_type.replace('_', ' ')}
                      </Text>
                      <Text fontSize="$2" color="$color10">
                        Created: {new Date(reward.created_at).toLocaleDateString()}
                      </Text>
                    </YStack>
                    {reward.status === 'pending' && (
                      <XStack gap="$2">
                        <TamaguiButton
                          size="$2"
                          backgroundColor="$green9"
                          color="white"
                          icon={<CheckCircle size={14} />}
                          onPress={() => toast.info('Reward approval coming soon')}
                        >
                          Approve
                        </TamaguiButton>
                        <TamaguiButton
                          size="$2"
                          variant="outlined"
                          icon={<XCircle size={14} />}
                          onPress={() => toast.info('Reward rejection coming soon')}
                        >
                          Reject
                        </TamaguiButton>
                      </XStack>
                    )}
                  </XStack>
                </Card>
              ))}
            </YStack>
          )}
        </YStack>
      )}
    </YStack>
  );
}

