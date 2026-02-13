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
  Stack,
  Row,
  Text,
  H1,
  H2,
  H3,
  Card,
  Button,
  Input,
  Spinner,
  Switch,
} from '@scaffald/ui';
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
      <Stack style={{ alignItems: 'center', justifyContent: 'center', height: '100%', padding: 'var(--space-6)' }}>
        <Spinner size="large" />
        <Text style={{ marginTop: 'var(--space-4)', color: 'var(--color-11)' }}>
          Loading referral program data...
        </Text>
      </Stack>
    );
  }

  return (
    <Stack style={{ gap: 'var(--space-6)' }}>
      {/* Header */}
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack>
          <H1 style={{ fontSize: 'var(--font-size-10)', fontWeight: 700, color: 'var(--color-12)' }}>
            Referral Program Management
          </H1>
          <Text style={{ color: 'var(--color-11)', fontSize: 'var(--font-size-6)', marginTop: 'var(--space-1)' }}>
            Manage referral program settings, campaigns, and rewards
          </Text>
        </Stack>
        {settings && (
          <Row style={{ gap: 'var(--space-2)', alignItems: 'center', backgroundColor: settings.is_active ? 'var(--color-green-2)' : 'var(--color-gray-3)', paddingLeft: 'var(--space-4)', paddingRight: 'var(--space-4)', paddingTop: 'var(--space-2)', paddingBottom: 'var(--space-2)', borderRadius: 'var(--radius-3)' }}>
            <Activity size={16} color={settings.is_active ? 'var(--color-green-10)' : 'var(--color-gray-10)'} />
            <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 600, color: settings.is_active ? 'var(--color-green-10)' : 'var(--color-gray-10)' }}>
              {settings.is_active ? 'Program Active' : 'Program Inactive'}
            </Text>
          </Row>
        )}
      </Row>

      {/* Tab Navigation */}
      <Row style={{ gap: 'var(--space-2)', borderBottomWidth: 1, borderColor: 'var(--color-border)', paddingBottom: 'var(--space-2)' }}>
        <Button
          variant={activeTab === 'overview' ? 'default' : 'outline'}
          onPress={() => setActiveTab('overview')}
          style={{ backgroundColor: activeTab === 'overview' ? 'var(--color-blue-9)' : 'transparent', color: activeTab === 'overview' ? 'white' : 'var(--color-11)' }}
        >
          Overview
        </Button>
        <Button
          variant={activeTab === 'settings' ? 'default' : 'outline'}
          onPress={() => setActiveTab('settings')}
          style={{ backgroundColor: activeTab === 'settings' ? 'var(--color-blue-9)' : 'transparent', color: activeTab === 'settings' ? 'white' : 'var(--color-11)' }}
        >
          Settings
        </Button>
        <Button
          variant={activeTab === 'campaigns' ? 'default' : 'outline'}
          onPress={() => setActiveTab('campaigns')}
          style={{ backgroundColor: activeTab === 'campaigns' ? 'var(--color-blue-9)' : 'transparent', color: activeTab === 'campaigns' ? 'white' : 'var(--color-11)' }}
        >
          Campaigns
        </Button>
        <Button
          variant={activeTab === 'rewards' ? 'default' : 'outline'}
          onPress={() => setActiveTab('rewards')}
          style={{ backgroundColor: activeTab === 'rewards' ? 'var(--color-blue-9)' : 'transparent', color: activeTab === 'rewards' ? 'white' : 'var(--color-11)' }}
        >
          Rewards
        </Button>
      </Row>

      {/* Overview Tab */}
      {activeTab === 'overview' && analytics && (
        <Stack style={{ gap: 'var(--space-6)' }}>
          {/* Key Metrics */}
          <Row style={{ gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-4)', borderWidth: 1, borderColor: 'var(--color-border)', padding: 'var(--space-5)', flex: 1, minWidth: 200 }}>
              <Stack style={{ gap: 'var(--space-2)' }}>
                <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-11)' }}>Total Invitations</Text>
                  <Users size={20} color="var(--color-blue-10)" />
                </Row>
                <Text style={{ fontSize: 'var(--font-size-9)', fontWeight: 700, color: 'var(--color-12)' }}>
                  {analytics.total_invitations}
                </Text>
                <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-10)' }}>
                  All time
                </Text>
              </Stack>
            </Card>

            <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-4)', borderWidth: 1, borderColor: 'var(--color-border)', padding: 'var(--space-5)', flex: 1, minWidth: 200 }}>
              <Stack style={{ gap: 'var(--space-2)' }}>
                <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-11)' }}>Successful Connections</Text>
                  <CheckCircle size={20} color="var(--color-green-10)" />
                </Row>
                <Text style={{ fontSize: 'var(--font-size-9)', fontWeight: 700, color: 'var(--color-12)' }}>
                  {analytics.successful_connections}
                </Text>
                <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-green-10)' }}>
                  {analytics.conversion_rate}% conversion rate
                </Text>
              </Stack>
            </Card>

            <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-4)', borderWidth: 1, borderColor: 'var(--color-border)', padding: 'var(--space-5)', flex: 1, minWidth: 200 }}>
              <Stack style={{ gap: 'var(--space-2)' }}>
                <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-11)' }}>Pending Invitations</Text>
                  <Clock size={20} color="var(--color-orange-10)" />
                </Row>
                <Text style={{ fontSize: 'var(--font-size-9)', fontWeight: 700, color: 'var(--color-12)' }}>
                  {analytics.pending_invitations}
                </Text>
                <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-10)' }}>
                  Awaiting response
                </Text>
              </Stack>
            </Card>

            <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-4)', borderWidth: 1, borderColor: 'var(--color-border)', padding: 'var(--space-5)', flex: 1, minWidth: 200 }}>
              <Stack style={{ gap: 'var(--space-2)' }}>
                <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-11)' }}>Credits Granted</Text>
                  <Award size={20} color="var(--color-purple-10)" />
                </Row>
                <Text style={{ fontSize: 'var(--font-size-9)', fontWeight: 700, color: 'var(--color-12)' }}>
                  {analytics.credits_granted}
                </Text>
                <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-10)' }}>
                  To new accounts
                </Text>
              </Stack>
            </Card>
          </Row>

          {/* By User Type */}
          <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-4)', borderWidth: 1, borderColor: 'var(--color-border)', padding: 'var(--space-5)' }}>
            <Stack style={{ gap: 'var(--space-4)' }}>
              <H3 style={{ fontSize: 'var(--font-size-5)', fontWeight: 600, color: 'var(--color-12)' }}>
                Invitations by User Type
              </H3>
              <Row style={{ gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                <Stack style={{ gap: 'var(--space-2)', flex: 1, minWidth: 150 }}>
                  <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-11)' }}>Brokers</Text>
                  <Text style={{ fontSize: 'var(--font-size-7)', fontWeight: 600, color: 'var(--color-blue-11)' }}>
                    {analytics.broker_invitations}
                  </Text>
                </Stack>
                <Stack style={{ gap: 'var(--space-2)', flex: 1, minWidth: 150 }}>
                  <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-11)' }}>Managers</Text>
                  <Text style={{ fontSize: 'var(--font-size-7)', fontWeight: 600, color: 'var(--color-green-11)' }}>
                    {analytics.manager_invitations}
                  </Text>
                </Stack>
                <Stack style={{ gap: 'var(--space-2)', flex: 1, minWidth: 150 }}>
                  <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-11)' }}>Contractors</Text>
                  <Text style={{ fontSize: 'var(--font-size-7)', fontWeight: 600, color: 'var(--color-purple-11)' }}>
                    {analytics.contractor_invitations}
                  </Text>
                </Stack>
              </Row>
            </Stack>
          </Card>
        </Stack>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && settings && (
        <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-4)', borderWidth: 1, borderColor: 'var(--color-border)', padding: 'var(--space-5)' }}>
          <Stack style={{ gap: 'var(--space-4)' }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <H2 style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, color: 'var(--color-12)' }}>
                Program Settings
              </H2>
              {!editingSettings ? (
                <Button
                  variant="outline"
                  iconStart={Edit}
                  onPress={() => setEditingSettings(true)}
                >
                  Edit Settings
                </Button>
              ) : (
                <Row style={{ gap: 'var(--space-2)' }}>
                  <Button
                    variant="outline"
                    onPress={() => {
                      setEditingSettings(false);
                      fetchSettings();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    color="primary"
                    onPress={handleSaveSettings}
                    disabled={savingSettings}
                  >
                    {savingSettings ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Row>
              )}
            </Row>

            {/* Program Status */}
            <Stack style={{ gap: 'var(--space-2)' }}>
              <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Stack style={{ gap: 'var(--space-1)' }}>
                  <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 600, color: 'var(--color-12)' }}>
                    Program Active
                  </Text>
                  <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-11)' }}>
                    Enable or disable the entire referral program
                  </Text>
                </Stack>
                <Switch
                  checked={settings.is_active}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, is_active: checked })
                  }
                  disabled={!editingSettings}
                />
              </Row>
            </Stack>

            {/* Credit Settings */}
            <Stack style={{ gap: 'var(--space-3)', borderTopWidth: 1, borderColor: 'var(--color-border)', paddingTop: 'var(--space-4)' }}>
              <H3 style={{ fontSize: 'var(--font-size-4)', fontWeight: 600, color: 'var(--color-12)' }}>
                Credit Settings
              </H3>

              <Stack style={{ gap: 'var(--space-2)' }}>
                <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-11)' }}>
                  Default Credit Amount (${settings.credit_currency})
                </Text>
                <Input
                  value={String(settings.default_credit_amount)}
                  onChange={(e) =>
                    setSettings({ ...settings, default_credit_amount: parseFloat(e.target.value) || 0 })
                  }
                  disabled={!editingSettings}
                  type="number"
                />
              </Stack>

              <Stack style={{ gap: 'var(--space-2)' }}>
                <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-11)' }}>
                  Minimum Account Age (hours) for Credits
                </Text>
                <Input
                  value={String(settings.min_account_age_hours)}
                  onChange={(e) =>
                    setSettings({ ...settings, min_account_age_hours: parseInt(e.target.value) || 24 })
                  }
                  disabled={!editingSettings}
                  type="number"
                />
                <Text style={{ fontSize: 'var(--font-size-1)', color: 'var(--color-10)' }}>
                  Only accounts newer than this get referral credits
                </Text>
              </Stack>
            </Stack>

            {/* Relationship Multipliers */}
            <Stack style={{ gap: 'var(--space-3)', borderTopWidth: 1, borderColor: 'var(--color-border)', paddingTop: 'var(--space-4)' }}>
              <H3 style={{ fontSize: 'var(--font-size-4)', fontWeight: 600, color: 'var(--color-12)' }}>
                Relationship Credit Multipliers
              </H3>

              <Row style={{ gap: 'var(--space-3)' }}>
                <Stack style={{ gap: 'var(--space-2)', flex: 1 }}>
                  <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-11)' }}>
                    Broker Multiplier
                  </Text>
                  <Input
                    value={String(settings.broker_relationship_multiplier)}
                    onChange={(e) =>
                      setSettings({ ...settings, broker_relationship_multiplier: parseFloat(e.target.value) || 1.0 })
                    }
                    disabled={!editingSettings}
                    type="number"
                    step="0.1"
                  />
                </Stack>

                <Stack style={{ gap: 'var(--space-2)', flex: 1 }}>
                  <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-11)' }}>
                    Manager Multiplier
                  </Text>
                  <Input
                    value={String(settings.manager_relationship_multiplier)}
                    onChange={(e) =>
                      setSettings({ ...settings, manager_relationship_multiplier: parseFloat(e.target.value) || 1.0 })
                    }
                    disabled={!editingSettings}
                    type="number"
                    step="0.1"
                  />
                </Stack>

                <Stack style={{ gap: 'var(--space-2)', flex: 1 }}>
                  <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-11)' }}>
                    Contractor Multiplier
                  </Text>
                  <Input
                    value={String(settings.contractor_relationship_multiplier)}
                    onChange={(e) =>
                      setSettings({ ...settings, contractor_relationship_multiplier: parseFloat(e.target.value) || 1.0 })
                    }
                    disabled={!editingSettings}
                    type="number"
                    step="0.1"
                  />
                </Stack>
              </Row>
            </Stack>

            {/* Rate Limits */}
            <Stack style={{ gap: 'var(--space-3)', borderTopWidth: 1, borderColor: 'var(--color-border)', paddingTop: 'var(--space-4)' }}>
              <H3 style={{ fontSize: 'var(--font-size-4)', fontWeight: 600, color: 'var(--color-12)' }}>
                Rate Limits
              </H3>

              <Row style={{ gap: 'var(--space-3)' }}>
                <Stack style={{ gap: 'var(--space-2)', flex: 1 }}>
                  <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-11)' }}>
                    Max Invitations per Day
                  </Text>
                  <Input
                    value={String(settings.max_invitations_per_day)}
                    onChange={(e) =>
                      setSettings({ ...settings, max_invitations_per_day: parseInt(e.target.value) || 10 })
                    }
                    disabled={!editingSettings}
                    type="number"
                  />
                </Stack>

                <Stack style={{ gap: 'var(--space-2)', flex: 1 }}>
                  <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-11)' }}>
                    Max Invitations per Month
                  </Text>
                  <Input
                    value={String(settings.max_invitations_per_month)}
                    onChange={(e) =>
                      setSettings({ ...settings, max_invitations_per_month: parseInt(e.target.value) || 50 })
                    }
                    disabled={!editingSettings}
                    type="number"
                  />
                </Stack>
              </Row>
            </Stack>
          </Stack>
        </Card>
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <Stack style={{ gap: 'var(--space-4)' }}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <H2 style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, color: 'var(--color-12)' }}>
              Referral Campaigns
            </H2>
            <Button
              color="primary"
              iconStart={Plus}
              onPress={() => toast.info('Campaign creation coming soon')}
            >
              Create Campaign
            </Button>
          </Row>

          {campaigns.length === 0 ? (
            <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-4)', borderWidth: 1, borderColor: 'var(--color-border)', padding: 'var(--space-6)' }}>
              <Stack style={{ alignItems: 'center', gap: 'var(--space-3)' }}>
                <Calendar size={48} color="var(--color-10)" />
                <Text style={{ fontSize: 'var(--font-size-4)', color: 'var(--color-11)' }}>
                  No campaigns yet
                </Text>
                <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-10)', textAlign: 'center' }}>
                  Create targeted campaigns to boost referral activity
                </Text>
              </Stack>
            </Card>
          ) : (
            <Stack style={{ gap: 'var(--space-3)' }}>
              {campaigns.map((campaign) => (
                <Card key={campaign.id} style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-4)', borderWidth: 1, borderColor: 'var(--color-border)', padding: 'var(--space-4)' }}>
                  <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Stack style={{ gap: 'var(--space-2)', flex: 1 }}>
                      <Row style={{ gap: 'var(--space-2)', alignItems: 'center' }}>
                        <Text style={{ fontSize: 'var(--font-size-4)', fontWeight: 600, color: 'var(--color-12)' }}>
                          {campaign.name}
                        </Text>
                        <Row
                          style={{
                            backgroundColor:
                              campaign.status === 'active' ? 'var(--color-green-2)' :
                              campaign.status === 'completed' ? 'var(--color-blue-2)' : 'var(--color-gray-3)',
                            paddingLeft: 'var(--space-2)',
                            paddingRight: 'var(--space-2)',
                            paddingTop: 'var(--space-1)',
                            paddingBottom: 'var(--space-1)',
                            borderRadius: 'var(--radius-2)'
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 'var(--font-size-1)',
                              fontWeight: 600,
                              color:
                                campaign.status === 'active' ? 'var(--color-green-10)' :
                                campaign.status === 'completed' ? 'var(--color-blue-10)' : 'var(--color-gray-10)',
                              textTransform: 'uppercase'
                            }}
                          >
                            {campaign.status}
                          </Text>
                        </Row>
                      </Row>
                      {campaign.description && (
                        <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-11)' }}>
                          {campaign.description}
                        </Text>
                      )}
                      <Row style={{ gap: 'var(--space-4)' }}>
                        <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-10)' }}>
                          Invitations: {campaign.total_invitations}
                        </Text>
                        <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-10)' }}>
                          Connections: {campaign.total_connections}
                        </Text>
                        <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-10)' }}>
                          Credits: ${campaign.total_credits_granted}
                        </Text>
                      </Row>
                    </Stack>
                    <Button
                      variant="outline"
                      size="sm"
                      iconStart={Edit}
                      onPress={() => toast.info('Campaign editing coming soon')}
                    >
                      Edit
                    </Button>
                  </Row>
                </Card>
              ))}
            </Stack>
          )}
        </Stack>
      )}

      {/* Rewards Tab */}
      {activeTab === 'rewards' && (
        <Stack style={{ gap: 'var(--space-4)' }}>
          <H2 style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, color: 'var(--color-12)' }}>
            Reward Management
          </H2>

          {rewards.length === 0 ? (
            <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-4)', borderWidth: 1, borderColor: 'var(--color-border)', padding: 'var(--space-6)' }}>
              <Stack style={{ alignItems: 'center', gap: 'var(--space-3)' }}>
                <Award size={48} color="var(--color-10)" />
                <Text style={{ fontSize: 'var(--font-size-4)', color: 'var(--color-11)' }}>
                  No rewards yet
                </Text>
                <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-10)', textAlign: 'center' }}>
                  Rewards will appear here as users earn credits
                </Text>
              </Stack>
            </Card>
          ) : (
            <Stack style={{ gap: 'var(--space-3)' }}>
              {rewards.map((reward) => (
                <Card key={reward.id} style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-4)', borderWidth: 1, borderColor: 'var(--color-border)', padding: 'var(--space-4)' }}>
                  <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Stack style={{ gap: 'var(--space-2)', flex: 1 }}>
                      <Row style={{ gap: 'var(--space-2)', alignItems: 'center' }}>
                        <Text style={{ fontSize: 'var(--font-size-4)', fontWeight: 600, color: 'var(--color-12)' }}>
                          ${reward.credit_amount}
                        </Text>
                        <Row
                          style={{
                            backgroundColor:
                              reward.status === 'approved' || reward.status === 'paid' ? 'var(--color-green-2)' :
                              reward.status === 'pending' ? 'var(--color-orange-2)' : 'var(--color-gray-3)',
                            paddingLeft: 'var(--space-2)',
                            paddingRight: 'var(--space-2)',
                            paddingTop: 'var(--space-1)',
                            paddingBottom: 'var(--space-1)',
                            borderRadius: 'var(--radius-2)'
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 'var(--font-size-1)',
                              fontWeight: 600,
                              color:
                                reward.status === 'approved' || reward.status === 'paid' ? 'var(--color-green-10)' :
                                reward.status === 'pending' ? 'var(--color-orange-10)' : 'var(--color-gray-10)',
                              textTransform: 'uppercase'
                            }}
                          >
                            {reward.status}
                          </Text>
                        </Row>
                      </Row>
                      <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-11)' }}>
                        Type: {reward.reward_type.replace('_', ' ')}
                      </Text>
                      <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-10)' }}>
                        Created: {new Date(reward.created_at).toLocaleDateString()}
                      </Text>
                    </Stack>
                    {reward.status === 'pending' && (
                      <Row style={{ gap: 'var(--space-2)' }}>
                        <Button
                          size="sm"
                          iconStart={CheckCircle}
                          onPress={() => toast.info('Reward approval coming soon')}
                          style={{ backgroundColor: 'var(--color-green-9)', color: 'white' }}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          iconStart={XCircle}
                          onPress={() => toast.info('Reward rejection coming soon')}
                        >
                          Reject
                        </Button>
                      </Row>
                    )}
                  </Row>
                </Card>
              ))}
            </Stack>
          )}
        </Stack>
      )}
    </Stack>
  );
}
